/**
 * 蓝牙管理器
 */

import {
  buildHeartBeatFrame,
  buildPowerOffFrame,
  buildRawLightCollectFrame,
  buildStopFrame,
  parseFrame,
  extractADCValues,
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

// 回调类型
type OnWaveDataCallback = (points: number[]) => void
type OnProgressCallback = (progress: number, remaining: number) => void
type OnDetectCompleteCallback = (data: number[]) => void
type OnErrorCallback = (err: string) => void
type OnConnectionChangeCallback = (connected: boolean) => void

class BluetoothManager {
  private static instance: BluetoothManager

  // 设备信息
  private deviceId = ''
  private deviceName = ''
  private isConnected = false

  // 特征值
  private writeCharId = ''
  private readCharId = ''

  // 检测状态
  private collectMode = CollectMode.MODE_STOP
  private detectType: DetectType = 'quick'
  private isDetecting = false
  private fullWaveData: number[] = []

  // 定时器
  private heartBeatTimer: ReturnType<typeof setInterval> | null = null
  private detectTimer: ReturnType<typeof setTimeout> | null = null
  private progressTimer: ReturnType<typeof setInterval> | null = null

  // 回调
  private onWaveData: OnWaveDataCallback | null = null
  private onProgress: OnProgressCallback | null = null
  private onDetectComplete: OnDetectCompleteCallback | null = null
  private onError: OnErrorCallback | null = null
  private onConnectionChange: OnConnectionChangeCallback | null = null

  // 采样统计
  private sampleCount = 0
  private lastSampleTime = 0

  private constructor() {}

  public static getInstance(): BluetoothManager {
    if (!BluetoothManager.instance) {
      BluetoothManager.instance = new BluetoothManager()
    }
    return BluetoothManager.instance
  }

  // ========== 状态获取 ==========
  public getConnectionState() {
    return {
      isConnected: this.isConnected,
      deviceId: this.deviceId,
      deviceName: this.deviceName,
    }
  }

  public getDetectState() {
    return {
      isDetecting: this.isDetecting,
      collectMode: this.collectMode,
      detectType: this.detectType,
    }
  }

  // ========== 回调注册 ==========
  public setCallbacks(options: {
    onWaveData?: OnWaveDataCallback
    onProgress?: OnProgressCallback
    onDetectComplete?: OnDetectCompleteCallback
    onError?: OnErrorCallback
    onConnectionChange?: OnConnectionChangeCallback
  }) {
    this.onWaveData = options.onWaveData ?? null
    this.onProgress = options.onProgress ?? null
    this.onDetectComplete = options.onDetectComplete ?? null
    this.onError = options.onError ?? null
    this.onConnectionChange = options.onConnectionChange ?? null
  }

  // ========== 蓝牙初始化与连接 ==========
  public async initBluetooth(): Promise<boolean> {
    return new Promise((resolve) => {
      uni.openBluetoothAdapter({
        success: () => resolve(true),
        fail: (err) => {
          console.error('初始化蓝牙失败', err)
          this.onError?.('初始化蓝牙失败，请检查蓝牙权限')
          resolve(false)
        },
      })
    })
  }

  public async startScan(): Promise<BLEDeviceInfo[]> {
    return new Promise((resolve) => {
      const devices: BLEDeviceInfo[] = []
      const timeout = setTimeout(() => {
        uni.stopBluetoothDevicesDiscovery()
        resolve(devices)
      }, 5000)

      uni.onBluetoothDeviceFound((res) => {
        res.devices.forEach((d) => {
          if (d.name && !devices.find((x) => x.deviceId === d.deviceId)) {
            devices.push({
              deviceId: d.deviceId,
              name: d.name,
              RSSI: d.RSSI,
            })
          }
        })
      })

      uni.startBluetoothDevicesDiscovery({
        success: () => {},
        fail: (err) => {
          clearTimeout(timeout)
          console.error('搜索设备失败', err)
          this.onError?.('搜索设备失败')
          resolve([])
        },
      })
    })
  }

  public async connectDevice(deviceId: string, deviceName = ''): Promise<boolean> {
    return new Promise((resolve) => {
      uni.createBLEConnection({
        deviceId,
        success: () => {
          setTimeout(() => {
            this.discoverServices(deviceId, deviceName).then(resolve)
          }, 1000)
        },
        fail: (err) => {
          console.error('连接设备失败', err)
          this.onError?.('连接设备失败')
          resolve(false)
        },
      })
    })
  }

  private async discoverServices(deviceId: string, deviceName: string): Promise<boolean> {
    return new Promise((resolve) => {
      uni.getBLEDeviceServices({
        deviceId,
        success: (res) => {
          const service = res.services.find(
            (s) => s.uuid.toUpperCase() === SERVICE_UUID.toUpperCase(),
          )
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
          const writeChar = res.characteristics.find(
            (c) => c.uuid.toUpperCase() === CHAR_WRITE_UUID.toUpperCase(),
          )
          const readChar = res.characteristics.find(
            (c) => c.uuid.toUpperCase() === CHAR_READ_UUID.toUpperCase(),
          )

          if (!writeChar || !readChar) {
            this.onError?.('未找到对应特征值')
            resolve(false)
            return
          }

          this.writeCharId = writeChar.uuid
          this.readCharId = readChar.uuid
          this.deviceId = deviceId
          this.deviceName = deviceName

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
          uni.onBLECharacteristicValueChange((res) => {
            this.handleBLEData(res.value)
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

  private handleBLEData(value: ArrayBuffer) {
    const frame = parseFrame(value)
    if (!frame) return

    if (frame.cmd === CMD_RAW_LIGHT_COLLECT) {
      const adcValues = extractADCValues(frame.data)
      if (adcValues.length > 0) {
        this.sampleCount += adcValues.length
        this.fullWaveData.push(...adcValues)
        this.onWaveData?.(adcValues)
      }
    }
  }

  // ========== 心跳保活 ==========
  private startHeartBeat() {
    this.stopHeartBeat()
    this.heartBeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.writeData(buildHeartBeatFrame())
      }
    }, HEART_BEAT_INTERVAL)
  }

  private stopHeartBeat() {
    if (this.heartBeatTimer) {
      clearInterval(this.heartBeatTimer)
      this.heartBeatTimer = null
    }
  }

  // ========== 写入数据 ==========
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
        value: buffer,
        success: () => resolve(true),
        fail: (err) => {
          console.error('写入失败', err)
          resolve(false)
        },
      })
    })
  }

  // ========== 检测控制 ==========
  public async startDetect(type: DetectType): Promise<boolean> {
    if (!this.isConnected) {
      this.onError?.('设备未连接')
      return false
    }
    if (this.isDetecting) {
      this.onError?.('检测正在进行中')
      return false
    }

    this.detectType = type
    this.isDetecting = true
    this.collectMode = CollectMode.MODE_RAW_LIGHT
    this.fullWaveData = []
    this.sampleCount = 0
    this.lastSampleTime = Date.now()

    const ok = await this.writeData(buildRawLightCollectFrame())
    if (!ok) {
      this.isDetecting = false
      return false
    }

    const duration = type === 'quick' ? COLLECT_DURATION_QUICK : COLLECT_DURATION_FULL
    const startTime = Date.now()

    // 进度更新
    this.progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(100, Math.round((elapsed / duration) * 100))
      const remaining = Math.max(0, Math.ceil((duration - elapsed) / 1000))
      this.onProgress?.(progress, remaining)

      if (elapsed >= duration) {
        this.stopDetect()
      }
    }, 200)

    // 超时自动停止
    this.detectTimer = setTimeout(() => {
      this.stopDetect()
    }, duration + 1000)

    return true
  }

  public async stopDetect(): Promise<void> {
    if (this.progressTimer) {
      clearInterval(this.progressTimer)
      this.progressTimer = null
    }
    if (this.detectTimer) {
      clearTimeout(this.detectTimer)
      this.detectTimer = null
    }

    if (this.isDetecting) {
      await this.writeData(buildStopFrame())
      this.isDetecting = false
      this.collectMode = CollectMode.MODE_STOP
      this.onDetectComplete?.([...this.fullWaveData])
    }
  }

  public async powerOff(): Promise<boolean> {
    return this.writeData(buildPowerOffFrame())
  }

  // ========== 断开连接 ==========
  public async disconnect(): Promise<void> {
    await this.stopDetect()
    this.stopHeartBeat()

    if (this.deviceId) {
      try {
        uni.closeBLEConnection({ deviceId: this.deviceId })
      } catch {
        // ignore
      }
    }
    uni.closeBluetoothAdapter()

    this.isConnected = false
    this.deviceId = ''
    this.deviceName = ''
    this.onConnectionChange?.(false)
  }

  // ========== 重置状态 ==========
  public reset() {
    this.stopDetect()
    this.fullWaveData = []
    this.sampleCount = 0
  }
}

export const bluetoothManager = BluetoothManager.getInstance()
