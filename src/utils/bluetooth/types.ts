/**
 * 蓝牙设备信息
 */
export interface BLEDeviceInfo {
  deviceId: string
  name?: string
  RSSI?: number
}

/**
 * 检测模式
 */
export type DetectType = 'quick' | 'full'

/**
 * 采集模式
 */
export enum CollectMode {
  MODE_STOP = 0,
  MODE_SPO2 = 1,
  MODE_RAW_LIGHT = 2,
}

/**
 * 蓝牙连接状态
 */
export interface BluetoothConnectionState {
  isConnected: boolean
  deviceName: string
  deviceId: string
}

/**
 * 检测状态
 */
export interface DetectState {
  collectMode: CollectMode
  detectType: DetectType
  isDetecting: boolean
  isCollectingFullWave: boolean
}

/**
 * 波形数据
 */
export interface WaveformData {
  heartRate: number
  spo2: number
  wavePoints: number[]
  filterPoints: number[]
  fullWaveData: number[]
}

/**
 * 采样统计
 */
export interface SampleStats {
  instantSampleRate: number
  avgSampleRate: number
}

/**
 * 进度信息
 */
export interface ProgressInfo {
  collectProgress: number
  remainingTime: number
}

/**
 * 调试参数
 */
export interface DebugParams {
  amplitudeRatio: number
  xStep: number
  yStep: number
  filterAlpha: number
  verticalBaseOffset: number
}

/**
 * 蓝牙协议帧
 */
export interface ProtocolFrame {
  head: number
  cmd: number
  data: number[]
  tail: number
}

/**
 * 上传数据格式
 */
export interface UploadWaveData {
  uid: string
  paraa: number[]
  parab: number[]
  parac: number[]
  user: {
    sex: number
  }
}
