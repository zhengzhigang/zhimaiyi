/**
 * 蓝牙管理器（单例模式）
 * 负责蓝牙设备连接、数据传输、检测流程控制
 */

import {
  buildHeartBeatFrame,
  buildPowerOffFrame,
  buildRawLightCollectFrame,
  buildStopFrame,
  dataParser,
} from './protocol'
import {
  CHAR_READ_UUID,
  CHAR_WRITE_UUID,
  COLLECT_DURATION_FULL,
  COLLECT_DURATION_QUICK,
  HEART_BEAT_INTERVAL,
  SERVICE_UUID,
} from './constants'
import type { BLEDeviceInfo, DetectType } from './types'
import { CollectMode } from './types'

/** 实时波形数据回调 */
type OnWaveDataCallback = (points: number[]) => void
/** 心率血氧回调 */
type OnHeartRateSpo2Callback = (heartRate: number, spo2: number) => void
/** 采集进度回调，progress: 0-100, remaining: 剩余秒数 */
type OnProgressCallback = (progress: number, remaining: number) => void
/** 检测完成回调，data: 完整波形数据 */
type OnDetectCompleteCallback = (data: number[]) => void
/** 错误回调 */
type OnErrorCallback = (err: string) => void
/** 连接状态变化回调 */
type OnConnectionChangeCallback = (connected: boolean) => void

class BluetoothManager {
  /** 单例实例 */
  private static instance: BluetoothManager

  // ========== 设备信息 ==========
  /** 当前连接的设备 ID */
  private deviceId = ''
  /** 当前连接的设备名称 */
  private deviceName = ''
  /** 蓝牙是否已连接 */
  private isConnected = false

  // ========== 特征值 ==========
  /** 写特征值 ID */
  private writeCharId = ''
  /** 读特征值 ID */
  private readCharId = ''

  // ========== 检测状态 ==========
  /** 当前采集模式 */
  private collectMode = CollectMode.MODE_STOP
  /** 检测类型 */
  private detectType: DetectType = 'quick'
  /** 是否正在检测中 */
  private isDetecting = false
  /** 完整波形数据缓存（全面检测用） */
  private fullWaveData: number[] = []

  // ========== 定时器 ==========
  /** 心跳保活定时器 */
  private heartBeatTimer: ReturnType<typeof setInterval> | null = null
  /** 检测超时定时器 */
  private detectTimer: ReturnType<typeof setTimeout> | null = null
  /** 进度更新定时器 */
  private progressTimer: ReturnType<typeof setInterval> | null = null

  // ========== 回调函数 ==========
  private onWaveData: OnWaveDataCallback | null = null
  private onHeartRateSpo2: OnHeartRateSpo2Callback | null = null
  private onProgress: OnProgressCallback | null = null
  private onDetectComplete: OnDetectCompleteCallback | null = null
  private onError: OnErrorCallback | null = null
  private onConnectionChange: OnConnectionChangeCallback | null = null

  // ========== 采样统计 ==========
  /** 累计采样点数 */
  private sampleCount = 0
  /** 上次采样时间戳 */
  private lastSampleTime = 0

  private constructor() {
    // 初始化数据解析器回调
    dataParser.setCallback((result) => {
      if (result.heartRate !== undefined && result.spo2 !== undefined) {
        this.onHeartRateSpo2?.(result.heartRate, result.spo2)
      }
      if (result.waveValues?.length) {
        this.sampleCount += result.waveValues.length
        this.fullWaveData.push(...result.waveValues)
        this.onWaveData?.(result.waveValues)
      }
    })
  }

  /** 获取单例实例 */
  public static getInstance(): BluetoothManager {
    if (!BluetoothManager.instance) {
      BluetoothManager.instance = new BluetoothManager()
    }
    return BluetoothManager.instance
  }

  // ========== 状态获取 ==========
  /** 获取当前连接状态 */
  public getConnectionState() {
    return {
      isConnected: this.isConnected,
      deviceId: this.deviceId,
      deviceName: this.deviceName,
    }
  }

  /** 获取当前检测状态 */
  public getDetectState() {
    return {
      isDetecting: this.isDetecting,
      collectMode: this.collectMode,
      detectType: this.detectType,
    }
  }

  // ========== 回调注册 ==========
  /** 注册蓝牙事件回调 */
  public setCallbacks(options: {
    onWaveData?: OnWaveDataCallback
    onHeartRateSpo2?: OnHeartRateSpo2Callback
    onProgress?: OnProgressCallback
    onDetectComplete?: OnDetectCompleteCallback
    onError?: OnErrorCallback
    onConnectionChange?: OnConnectionChangeCallback
  }) {
    this.onWaveData = options.onWaveData ?? null
    this.onHeartRateSpo2 = options.onHeartRateSpo2 ?? null
    this.onProgress = options.onProgress ?? null
    this.onDetectComplete = options.onDetectComplete ?? null
    this.onError = options.onError ?? null
    this.onConnectionChange = options.onConnectionChange ?? null
  }

  // ========== 蓝牙初始化与连接 ==========
  /**
   * 初始化蓝牙适配器
   * 已打开时不视为错误，直接返回 true
   */
  public async initBluetooth(): Promise<boolean> {
    return new Promise((resolve) => {
      uni.openBluetoothAdapter({
        success: () => resolve(true),
        fail: (err) => {
          // 蓝牙适配器已经打开时不视为错误
          if (err.errMsg?.includes('already opened')) {
            resolve(true)
            return
          }
          console.error('初始化蓝牙失败', err)
          this.onError?.('初始化蓝牙失败，请检查蓝牙权限')
          resolve(false)
        },
      })
    })
  }

  /**
   * 扫描蓝牙设备（5秒超时）
   * @returns 扫描到的设备列表
   */
  public async startScan(): Promise<BLEDeviceInfo[]> {
    return new Promise((resolve) => {
      const devices: BLEDeviceInfo[] = []
      const deviceIdSet = new Set<string>()

      // 5秒超时后停止扫描
      const timeout = setTimeout(() => {
        uni.stopBluetoothDevicesDiscovery()
        // 清理事件监听
        if (typeof uni.offBluetoothDeviceFound === 'function') {
          uni.offBluetoothDeviceFound()
        }
        resolve(devices)
      }, 5000)

      // 监听设备发现，按 deviceId 去重
      const onDeviceFound = (res: any) => {
        res.devices.forEach((d) => {
          // 过滤掉没有名称的设备
          if (d.name && !deviceIdSet.has(d.deviceId)) {
            deviceIdSet.add(d.deviceId)
            devices.push({
              deviceId: d.deviceId,
              name: d.name,
              RSSI: d.RSSI,
            })
            console.log('发现设备:', d.name, d.deviceId)
          }
        })
      }

      // 先清理可能存在的旧监听器
      if (typeof uni.offBluetoothDeviceFound === 'function') {
        uni.offBluetoothDeviceFound()
      }
      uni.onBluetoothDeviceFound(onDeviceFound)

      // 扫描参数：不指定 services 表示全设备扫描
      // 如果需要特定服务，可以添加如: services: ['0000FFE0-0000-1000-8000-00805F9B34FB']
      uni.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: false,
        // 不指定 services，进行全设备扫描
        success: () => {
          console.log('开始扫描蓝牙设备')
        },
        fail: (err) => {
          clearTimeout(timeout)
          if (typeof uni.offBluetoothDeviceFound === 'function') {
            uni.offBluetoothDeviceFound()
          }
          console.error('搜索设备失败', err)
          this.onError?.('搜索设备失败')
          resolve([])
        },
      })
    })
  }

  /**
   * 连接蓝牙设备
   * 连接成功后延迟 1s 再发现服务（等待设备稳定）
   */
  public async connectDevice(deviceId: string, deviceName = ''): Promise<boolean> {
    return new Promise((resolve) => {
      uni.createBLEConnection({
        deviceId,
        success: () => {
          console.log('连接设备成功', deviceId, deviceName)
          // 延迟 1s 等待设备稳定后再发现服务
          setTimeout(() => {
            this.discoverServices(deviceId, deviceName).then(resolve)
          }, 1000)
        },
        fail: (err) => {
          console.log('连接设备失败', deviceId, deviceName, err)
          console.error('连接设备失败', err, err)
          this.onError?.('连接设备失败')
          resolve(false)
        },
      })
    })
  }

  /** 发现设备服务，匹配目标 SERVICE_UUID */
  private async discoverServices(deviceId: string, deviceName: string): Promise<boolean> {
    return new Promise((resolve) => {
      uni.getBLEDeviceServices({
        deviceId,
        success: (res) => {
          console.log('发现服务成功', SERVICE_UUID, res.services)
          // 查找匹配的服务 UUID
          const service = res.services.find(
            (s) => s.uuid.toUpperCase() === SERVICE_UUID.toUpperCase(),
          )
          console.log('===服务===', service)
          if (service) {
            this.discoverCharacteristics(deviceId, service.uuid, deviceName).then(resolve)
          } else {
            this.onError?.('未找到对应服务UUID')
            resolve(false)
          }
        },
        fail: (err) => {
          console.error('获取服务失败', err)
          this.onError?.('获取服务失败')
          resolve(false)
        },
      })
    })
  }

  /**
   * 发现服务特征值，匹配读写 UUID
   * 成功后开启 notify 并启动心跳
   */
  private async discoverCharacteristics(
    deviceId: string,
    serviceId: string,
    deviceName: string,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      uni.getBLEDeviceCharacteristics({
        deviceId,
        serviceId,
        success: (res) => {
          console.log('发现特征值成功', res)
          // 查找写特征值
          const writeChar = res.characteristics.find(
            (c) => c.uuid.toUpperCase() === CHAR_WRITE_UUID.toUpperCase(),
          )
          // 查找读特征值
          const readChar = res.characteristics.find(
            (c) => c.uuid.toUpperCase() === CHAR_READ_UUID.toUpperCase(),
          )
          console.log('===特征值===', writeChar, readChar)

          if (!writeChar || !readChar) {
            this.onError?.('未找到对应特征值')
            resolve(false)
            return
          }

          this.writeCharId = writeChar.uuid
          this.readCharId = readChar.uuid
          this.deviceId = deviceId
          this.deviceName = deviceName
          console.log('===discoverCharacteristics===', writeChar, readChar)

          // 开启 notify 接收数据
          this.enableNotify(deviceId, serviceId, readChar.uuid).then((ok) => {
            if (ok) {
              this.isConnected = true
              this.onConnectionChange?.(true)
              this.startHeartBeat()
            }
            resolve(ok)
          })
        },
        fail: (err) => {
          console.error('获取特征值失败', err)
          this.onError?.('获取特征值失败')
          resolve(false)
        },
      })
    })
  }

  /**
   * 开启 BLE 通知，接收设备数据
   * 数据通过 onBLECharacteristicValueChange 回调
   */
  private async enableNotify(
    deviceId: string,
    serviceId: string,
    characteristicId: string,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      uni.notifyBLECharacteristicValueChange({
        deviceId,
        serviceId,
        characteristicId,
        state: true,
        success: () => {
          console.log('开启通知成功', deviceId, serviceId, characteristicId)
          // 监听特征值变化，接收设备数据
          uni.onBLECharacteristicValueChange((res) => {
            console.log('===onBLECharacteristicValueChange===', res)
            this.handleBLEData(res.value as unknown as ArrayBuffer)
          })
          resolve(true)
        },
        fail: (err) => {
          console.error('开启通知失败', err)
          this.onError?.('开启通知失败')
          resolve(false)
        },
      })
    })
  }

  /**
   * 处理蓝牙接收到的数据
   * 使用 DataParser 解析数据流（缓冲区管理 + 异常过滤）
   */
  private handleBLEData(value: ArrayBuffer) {
    dataParser.parse(value)
  }

  // ========== 心跳保活 ==========
  /** 启动心跳保活，定时发送心跳帧防止设备断连 */
  private startHeartBeat() {
    this.stopHeartBeat()
    this.heartBeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.writeData(buildHeartBeatFrame())
      }
    }, HEART_BEAT_INTERVAL)
  }

  /** 停止心跳保活 */
  private stopHeartBeat() {
    if (this.heartBeatTimer) {
      clearInterval(this.heartBeatTimer)
      this.heartBeatTimer = null
    }
  }

  // ========== 写入数据 ==========
  /**
   * 向设备写入 BLE 数据
   * @param buffer - 要写入的二进制数据
   */
  private async writeData(buffer: ArrayBuffer): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.isConnected || !this.deviceId || !this.writeCharId) {
        resolve(false)
        return
      }
      uni.writeBLECharacteristicValue({
        deviceId: this.deviceId,
        serviceId: SERVICE_UUID,
        characteristicId: this.writeCharId,
        // uni-app 类型定义问题，实际需要 ArrayBuffer
        value: buffer as unknown as number[],
        success: () => resolve(true),
        fail: (err) => {
          console.error('写入失败', err)
          resolve(false)
        },
      })
    })
  }

  // ========== 检测控制 ==========
  /**
   * 启动检测流程
   * - 发送采集指令给设备
   * - 启动进度更新定时器（200ms 间隔）
   * - 设置超时自动停止
   * @param type - 检测类型（quick: 2分钟 / full: 3分钟）
   */
  public async startDetect(type: DetectType): Promise<boolean> {
    if (!this.isConnected) {
      this.onError?.('设备未连接')
      return false
    }
    if (this.isDetecting) {
      this.onError?.('检测正在进行中')
      return false
    }

    // 重置检测状态
    this.detectType = type
    this.isDetecting = true
    this.collectMode = CollectMode.MODE_RAW_LIGHT
    this.fullWaveData = []
    this.sampleCount = 0
    this.lastSampleTime = Date.now()

    // 重置并启动数据解析器的波形采集模式
    dataParser.reset()
    dataParser.setCollectingMode(true)

    // 发送采集指令
    const ok = await this.writeData(buildRawLightCollectFrame())
    if (!ok) {
      this.isDetecting = false
      return false
    }

    // 根据检测类型确定时长
    const duration = type === 'quick' ? COLLECT_DURATION_QUICK : COLLECT_DURATION_FULL
    const startTime = Date.now()

    // 启动进度更新定时器（200ms 间隔，5次/秒）
    this.progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(100, Math.round((elapsed / duration) * 100))
      const remaining = Math.max(0, Math.ceil((duration - elapsed) / 1000))
      this.onProgress?.(progress, remaining)

      // 达到时长后自动停止
      if (elapsed >= duration) {
        this.stopDetect()
      }
    }, 200)

    // 超时保护（比目标时长多 1 秒）
    this.detectTimer = setTimeout(() => {
      this.stopDetect()
    }, duration + 1000)

    return true
  }

  /**
   * 停止检测
   * 发送停止帧 → 清除定时器 → 触发完成回调
   */
  public async stopDetect(): Promise<void> {
    // 清除定时器
    if (this.progressTimer) {
      clearInterval(this.progressTimer)
      this.progressTimer = null
    }
    if (this.detectTimer) {
      clearTimeout(this.detectTimer)
      this.detectTimer = null
    }

    if (this.isDetecting) {
      // 发送停止采集指令
      await this.writeData(buildStopFrame())
      this.isDetecting = false
      this.collectMode = CollectMode.MODE_STOP
      // 停止数据解析器的波形采集模式
      dataParser.setCollectingMode(false)
      // 触发完成回调，传递完整波形数据副本
      this.onDetectComplete?.([...this.fullWaveData])
    }
  }

  /** 关闭设备电源 */
  public async powerOff(): Promise<boolean> {
    return this.writeData(buildPowerOffFrame())
  }

  // ========== 断开连接 ==========
  /** 断开蓝牙连接：停止检测 → 停止心跳 → 关闭连接 → 关闭适配器 */
  public async disconnect(): Promise<void> {
    await this.stopDetect()
    this.stopHeartBeat()

    // 关闭 BLE 连接
    if (this.deviceId) {
      try {
        uni.closeBLEConnection({ deviceId: this.deviceId })
      } catch {
        // ignore
      }
    }
    // 关闭蓝牙适配器
    uni.closeBluetoothAdapter()

    this.isConnected = false
    this.deviceId = ''
    this.deviceName = ''
    this.onConnectionChange?.(false)
  }

  // ========== 重置状态 ==========
  /** 重置检测状态（不清除连接） */
  public reset() {
    this.stopDetect()
    this.fullWaveData = []
    this.sampleCount = 0
    dataParser.reset()
  }
}

/** 蓝牙管理器单例导出 */
export const bluetoothManager = BluetoothManager.getInstance()
