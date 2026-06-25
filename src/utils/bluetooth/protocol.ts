/**
 * 蓝牙协议解析与封装
 */

import {
  CMD_HEART_BEAT,
  CMD_POWER_OFF,
  CMD_RAW_LIGHT_COLLECT,
  CMD_SPO2_COLLECT,
  CMD_STOP,
  FRAME_HEAD,
  FRAME_TAIL,
  ADC_MIN,
  ADC_MAX,
  MAX_JUMP_DELTA,
  MAX_CONTINUE_ERROR,
} from './constants'

/** 解析结果类型 */
export type ParseResult = {
  /** 心率值（从心率血氧帧解析） */
  heartRate?: number
  /** 血氧值（从心率血氧帧解析） */
  spo2?: number
  /** 波形ADC值数组（从波形数据解析） */
  waveValues?: number[]
}

/** 数据解析回调 */
export type OnParseCallback = (result: ParseResult) => void

/**
 * 构建发送帧
 * @param cmd 指令
 * @param data 数据
 * @returns ArrayBuffer
 */
export function buildFrame(cmd: number, data: number[] = []): ArrayBuffer {
  const frame = [FRAME_HEAD, cmd, ...data, FRAME_TAIL]
  const buffer = new ArrayBuffer(frame.length)
  const view = new DataView(buffer)
  frame.forEach((byte, index) => {
    view.setUint8(index, byte)
  })
  return buffer
}

/**
 * 发送心跳
 * @returns ArrayBuffer
 */
export function buildHeartBeatFrame(): ArrayBuffer {
  return buildFrame(CMD_HEART_BEAT)
}

/**
 * 发送开始血氧采集
 * @returns ArrayBuffer
 */
export function buildSpo2CollectFrame(): ArrayBuffer {
  return buildFrame(CMD_SPO2_COLLECT)
}

/**
 * 发送开始原始波形采集
 * @returns ArrayBuffer
 */
export function buildRawLightCollectFrame(): ArrayBuffer {
  return buildFrame(CMD_RAW_LIGHT_COLLECT)
}

/**
 * 发送停止采集
 * @returns ArrayBuffer
 */
export function buildStopFrame(): ArrayBuffer {
  return buildFrame(CMD_STOP)
}

/**
 * 发送关机指令
 * @returns ArrayBuffer
 */
export function buildPowerOffFrame(): ArrayBuffer {
  return buildFrame(CMD_POWER_OFF)
}

/**
 * 数据解析器类
 * 参考 btsentest 抑制漂移 200hz.html 的 parseData 实现
 * - 缓冲区管理：处理数据拼接和残留
 * - 帧类型区分：心率血氧帧（4字节）vs 波形数据（2字节）
 * - 异常过滤：数值越界 + 突变检测
 */
export class DataParser {
  /** 接收缓冲区 */
  private rawBuffer: number[] = []
  /** 连续异常计数 */
  private errorCount = 0
  /** 上一个有效的波形值（用于突变检测） */
  private lastWaveValue: number | null = null
  /** 是否正在采集波形（MODE_RAW_LIGHT 模式） */
  private isCollectingWave = false
  /** 解析回调 */
  private onParse: OnParseCallback | null = null

  /**
   * 设置解析回调
   * @param callback 解析结果回调函数
   */
  public setCallback(callback: OnParseCallback) {
    this.onParse = callback
  }

  /**
   * 设置采集模式
   * @param collecting 是否正在采集波形数据
   */
  public setCollectingMode(collecting: boolean) {
    this.isCollectingWave = collecting
  }

  /**
   * 重置解析器状态
   * 清空缓冲区和计数器
   */
  public reset() {
    this.rawBuffer = []
    this.errorCount = 0
    this.lastWaveValue = null
  }

  /**
   * 处理接收到的数据
   * @param dataBuf ArrayBuffer 数据
   */
  public parse(dataBuf: ArrayBuffer) {
    // 将 ArrayBuffer 转为 number[] 并拼接到缓冲区
    const view = new DataView(dataBuf)
    const newBytes: number[] = []
    for (let i = 0; i < view.byteLength; i++) {
      newBytes.push(view.getUint8(i))
    }
    this.rawBuffer = this.rawBuffer.concat(newBytes)

    // 1. 解析心率血氧帧（4字节帧）
    this.parseHeartRateFrames()

    // 2. 解析波形数据（2字节原始波形）
    if (this.isCollectingWave) {
      this.parseWaveData()
    }
  }

  /**
   * 解析心率血氧帧
   * 帧格式：FRAME_HEAD + heartRate + spo2 + FRAME_TAIL（共4字节）
   */
  private parseHeartRateFrames() {
    while (true) {
      const headIdx = this.rawBuffer.indexOf(FRAME_HEAD)
      if (headIdx === -1) break

      const tailIdx = this.rawBuffer.indexOf(FRAME_TAIL, headIdx)
      if (tailIdx === -1) break

      const frameLen = tailIdx - headIdx + 1
      if (frameLen !== 4) {
        // 非心率血氧帧，跳过帧头继续查找
        this.rawBuffer = this.rawBuffer.slice(headIdx + 1)
        continue
      }

      const heartRate = this.rawBuffer[headIdx + 1]
      const spo2 = this.rawBuffer[headIdx + 2]

      // 触发回调
      this.onParse?.({ heartRate, spo2 })

      // 移除已处理的帧
      this.rawBuffer = this.rawBuffer.slice(tailIdx + 1)
    }
  }

  /**
   * 解析波形数据
   * 数据格式：2字节大端 ADC 值（high << 8 | low）
   * 包含异常过滤：数值越界 + 突变检测
   */
  private parseWaveData() {
    if (this.rawBuffer.length < 2) return

    const validPair = Math.floor(this.rawBuffer.length / 2)
    const waveData = this.rawBuffer.slice(0, validPair * 2)
    this.rawBuffer = this.rawBuffer.slice(validPair * 2)

    const validValues: number[] = []

    for (let i = 0; i < waveData.length; i += 2) {
      const high = waveData[i]
      const low = waveData[i + 1]
      const val = (high << 8) | low

      // 异常过滤
      if (!this.isWaveValueValid(val)) {
        this.errorCount++
        if (this.errorCount >= MAX_CONTINUE_ERROR) {
          // 连续异常过多，清空缓冲区重新组包
          this.rawBuffer = []
          this.errorCount = 0
          console.warn('连续异常数据过多，清空接收缓冲区，重新组包')
        }
        continue
      }

      this.errorCount = 0
      this.lastWaveValue = val
      validValues.push(val)
    }

    if (validValues.length > 0) {
      this.onParse?.({ waveValues: validValues })
    }
  }

  /**
   * 检查波形值是否有效
   * 1. 数值越界检查：val 必须在 ADC_MIN ~ ADC_MAX 范围内
   * 2. 突变检查：与前一个值的差值不能超过 MAX_JUMP_DELTA
   * @param val 波形值
   * @returns 是否有效
   */
  private isWaveValueValid(val: number): boolean {
    // 数值越界检查
    if (val < ADC_MIN || val > ADC_MAX) {
      console.warn(`丢弃异常波形值: ${val} (数值越界)`)
      return false
    }

    // 突变检查
    if (this.lastWaveValue !== null) {
      const delta = Math.abs(val - this.lastWaveValue)
      if (delta > MAX_JUMP_DELTA) {
        console.warn(`丢弃异常波形值: ${val} (突变过大，delta=${delta})`)
        return false
      }
    }

    return true
  }
}

// 导出单例解析器
export const dataParser = new DataParser()

/**
 * 旧版简单帧解析（保留兼容性）
 * @deprecated 请使用 DataParser 类
 */
export function parseFrame(value: ArrayBuffer): { cmd: number; data: number[] } | null {
  const view = new DataView(value)
  const bytes: number[] = []
  for (let i = 0; i < view.byteLength; i++) {
    bytes.push(view.getUint8(i))
  }

  // 简单校验：找帧头帧尾
  const headIndex = bytes.indexOf(FRAME_HEAD)
  const tailIndex = bytes.lastIndexOf(FRAME_TAIL)
  if (headIndex === -1 || tailIndex === -1 || headIndex >= tailIndex) {
    return null
  }

  const cmd = bytes[headIndex + 1]
  const data = bytes.slice(headIndex + 2, tailIndex)
  return { cmd, data }
}

/**
 * 从数据中提取16位ADC值（小端）
 * @deprecated 请使用 DataParser 类
 */
export function extractADCValues(data: number[]): number[] {
  const values: number[] = []
  for (let i = 0; i + 1 < data.length; i += 2) {
    const val = (data[i + 1] << 8) | data[i]
    values.push(val)
  }
  return values
}