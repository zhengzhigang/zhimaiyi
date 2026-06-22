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
} from './constants'

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
 * 解析接收到的数据
 * @param value ArrayBuffer
 * @returns 解析后的数据数组，若无效返回null
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
 * @param data 字节数组
 * @returns ADC值数组
 */
export function extractADCValues(data: number[]): number[] {
  const values: number[] = []
  for (let i = 0; i + 1 < data.length; i += 2) {
    const val = (data[i + 1] << 8) | data[i]
    values.push(val)
  }
  return values
}
