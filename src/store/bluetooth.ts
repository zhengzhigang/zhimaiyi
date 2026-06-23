import type { DetectType, UploadWaveData } from '@/utils/bluetooth/types'
import { CollectMode } from '@/utils/bluetooth/types'
import { bluetoothManager } from '@/utils/bluetooth'
import { cubicSplineResample, removeDCAndDrift, convertTo0_255 } from '@/utils/bluetooth/algorithms'
import { uploadWaveResult } from '@/api/health/bluetooth'
import { useUserStore } from './user'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useBluetoothStore = defineStore('bluetooth', () => {
  // ========== 连接状态 ==========
  /** 蓝牙设备是否已连接 */
  const isConnected = ref(false)
  /** 设备名称 */
  const deviceName = ref('')
  /** 设备 ID */
  const deviceId = ref('')

  // ========== 检测状态 ==========
  /** 当前采集模式（停止/快速/全面） */
  const collectMode = ref<CollectMode>(CollectMode.MODE_STOP)
  /** 检测类型：quick 快速检测 | full 全面检测 */
  const detectType = ref<DetectType>('quick')
  /** 是否正在检测中 */
  const isDetecting = ref(false)
  /** 是否正在采集全面检测波形数据 */
  const isCollectingFullWave = ref(false)

  // ========== 数据 ==========
  /** 心率值 */
  const heartRate = ref(0)
  /** 血氧值 */
  const spo2 = ref(0)
  /** 波形显示点数组（用于实时绘制） */
  const wavePoints = ref<number[]>([])
  /** 滤波后的波形点数组 */
  const filterPoints = ref<number[]>([])
  /** 全面检测完整波形数据 */
  const fullWaveData = ref<number[]>([])

  // ========== 采样统计 ==========
  /** 瞬时采样率 */
  const instantSampleRate = ref(0)
  /** 平均采样率 */
  const avgSampleRate = ref(0)

  // ========== 进度 ==========
  /** 采集进度 0-100 */
  const collectProgress = ref(0)
  /** 剩余时间（秒） */
  const remainingTime = ref(0)

  // ========== 调试参数 ==========
  /** 波形振幅比例 */
  const amplitudeRatio = ref(0.1)
  /** X 轴步进 */
  const xStep = ref(1)
  /** Y 轴步进 */
  const yStep = ref(80)
  /** 一阶滤波系数 */
  const filterAlpha = ref(0.3)
  /** 垂直基线偏移量 */
  const verticalBaseOffset = ref(32768)

  // ========== 计算属性 ==========
  /** 连接状态文案 */
  const connectionText = computed(() => (isConnected.value ? '设备已连接' : '请连接检测设备'))

  // ========== 内部辅助 ==========
  /** 从 bluetoothManager 同步连接状态到 store */
  function updateConnectionState() {
    const state = bluetoothManager.getConnectionState()
    isConnected.value = state.isConnected
    deviceName.value = state.deviceName
    deviceId.value = state.deviceId
  }

  /** 从 bluetoothManager 同步检测状态到 store */
  function updateDetectState() {
    const state = bluetoothManager.getDetectState()
    isDetecting.value = state.isDetecting
    collectMode.value = state.collectMode
    detectType.value = state.detectType
  }

  // ========== 蓝牙连接相关 ==========
  /**
   * 初始化蓝牙并连接指定设备
   * @param targetDeviceName - 目标设备名称关键字，不传则连接第一个扫描到的设备
   * @returns 是否连接成功
   */
  async function initAndConnect(targetDeviceName?: string): Promise<boolean> {
    const ok = await bluetoothManager.initBluetooth()
    if (!ok) return false

    // 扫描蓝牙设备
    const devices = await bluetoothManager.startScan()
    console.log('扫描到的设备:', devices.map((item, index) => `${index}**${item.name || ''}**${item.deviceId}`))
    // 按名称匹配目标设备，未指定则取第一个
    const target = targetDeviceName
      ? devices.find((d) => d.deviceId?.includes(targetDeviceName))
      : devices[0]
    console.log('目标设备:', targetDeviceName, target)

    if (!target) {
      uni.showToast({ title: '未找到设备', icon: 'none' })
      return false
    }

    const connected = await bluetoothManager.connectDevice(target.deviceId, target.name || '')
    console.log('连接设备:', target.deviceId, target.name || '', connected)
    if (connected) {
      updateConnectionState()
    }
    return connected
  }

  /**
   * 直接连接指定设备（需先初始化蓝牙）
   * @param deviceId - 设备 ID
   * @param name - 设备名称
   */
  async function connectDevice(deviceId: string, name = ''): Promise<boolean> {
    const ok = await bluetoothManager.initBluetooth()
    if (!ok) return false
    const connected = await bluetoothManager.connectDevice(deviceId, name)
    if (connected) {
      updateConnectionState()
    }
    return connected
  }

  /** 断开蓝牙连接并重置状态 */
  async function disconnectDevice() {
    await bluetoothManager.disconnect()
    updateConnectionState()
    resetState()
  }

  // ========== 检测相关 ==========
  /** 启动快速检测（2分钟） */
  async function startQuickDetect(): Promise<boolean> {
    return startDetect('quick')
  }

  /** 启动全面检测（3分钟） */
  async function startFullDetect(): Promise<boolean> {
    return startDetect('full')
  }

  /**
   * 启动检测流程
   * - 快速检测：2分钟，仅显示实时波形
   * - 全面检测：3分钟，采集完整数据并自动上传分析
   * @param type - 检测类型
   */
  async function startDetect(type: DetectType): Promise<boolean> {
    updateDetectState()
    if (isDetecting.value) {
      uni.showToast({ title: '检测正在进行中', icon: 'none' })
      return false
    }

    // 重置检测数据
    detectType.value = type
    isCollectingFullWave.value = type === 'full'
    wavePoints.value = []
    filterPoints.value = []
    fullWaveData.value = []
    collectProgress.value = 0
    remainingTime.value = type === 'full' ? 180 : 120

    // 注册蓝牙数据回调
    bluetoothManager.setCallbacks({
      /** 实时波形数据回调，限制最大显示点数防止绘制性能下降 */
      onWaveData: (points: number[]) => {
        const maxDisplay = 600
        const current = wavePoints.value
        const combined = [...current, ...points]
        if (combined.length > maxDisplay) {
          wavePoints.value = combined.slice(combined.length - maxDisplay)
        } else {
          wavePoints.value = combined
        }
      },
      /** 采集进度回调 */
      onProgress: (progress: number, remaining: number) => {
        collectProgress.value = progress
        remainingTime.value = remaining
      },
      /** 检测完成回调，全面检测自动上传数据 */
      onDetectComplete: (data: number[]) => {
        fullWaveData.value = data
        isDetecting.value = false
        isCollectingFullWave.value = false
        collectMode.value = CollectMode.MODE_STOP
        uni.showToast({ title: '检测完成', icon: 'success' })

        if (detectType.value === 'full' && data.length > 0) {
          uploadFullWaveData(data)
        }
      },
      /** 错误回调 */
      onError: (err: string) => {
        uni.showToast({ title: err, icon: 'none' })
      },
      /** 连接状态变化回调，断开时自动重置 */
      onConnectionChange: (connected: boolean) => {
        isConnected.value = connected
        if (!connected) {
          resetState()
        }
      },
    })

    const ok = await bluetoothManager.startDetect(type)
    updateDetectState()
    return ok
  }

  /** 停止采集 */
  async function stopCollect() {
    await bluetoothManager.stopDetect()
    updateDetectState()
  }

  /** 关闭设备电源 */
  async function powerOff() {
    await bluetoothManager.powerOff()
  }

  /**
   * 上传全面检测波形数据
   * 处理流程：去直流漂移 → 三次样条插值(200Hz→240Hz) → 映射到0-255 → 上传
   * @param data - 原始波形数据
   */
  async function uploadFullWaveData(data: number[]) {
    try {
      uni.showLoading({ title: '正在分析数据...' })

      // 1. 去直流偏置和基线漂移
      const baselineQueue: number[] = []
      const smoothBaseline = { value: 32768 }
      const processed = data.map((v) => removeDCAndDrift(v, baselineQueue, smoothBaseline))

      // 2. 三次样条插值 200Hz -> 240Hz
      const resampled = cubicSplineResample(processed, 240, 200)

      // 3. 映射到 0-255
      const mapped = convertTo0_255(resampled)

      // 构建上传请求体
      const userStore = useUserStore()
      const payload: UploadWaveData = {
        uid: String(userStore.userInfo?.id || ''),
        paraa: [],
        parab: [],
        parac: mapped,
        user: {
          sex: userStore.userInfo?.sex === 1 ? 1 : 0,
        },
      }

      const res = await uploadWaveResult(payload)
      uni.hideLoading()
      console.log('波形上传结果', res)
      uni.showToast({ title: '分析完成', icon: 'success' })
      return res
    } catch (err) {
      uni.hideLoading()
      console.error('波形上传失败', err)
      uni.showToast({ title: '数据上传失败', icon: 'none' })
      throw err
    }
  }

  /** 重置检测（调用 bluetoothManager.reset 并重置本地状态） */
  function resetDetect() {
    bluetoothManager.reset()
    resetState()
  }

  /** 重置所有本地状态到初始值 */
  function resetState() {
    collectMode.value = CollectMode.MODE_STOP
    isDetecting.value = false
    isCollectingFullWave.value = false
    wavePoints.value = []
    filterPoints.value = []
    fullWaveData.value = []
    collectProgress.value = 0
    remainingTime.value = 0
    heartRate.value = 0
    spo2.value = 0
  }

  return {
    // 状态
    isConnected,
    deviceName,
    deviceId,
    collectMode,
    detectType,
    isDetecting,
    isCollectingFullWave,
    heartRate,
    spo2,
    wavePoints,
    filterPoints,
    fullWaveData,
    instantSampleRate,
    avgSampleRate,
    collectProgress,
    remainingTime,
    amplitudeRatio,
    xStep,
    yStep,
    filterAlpha,
    verticalBaseOffset,
    // 计算属性
    connectionText,
    // 方法
    initAndConnect,
    connectDevice,
    disconnectDevice,
    startQuickDetect,
    startFullDetect,
    startDetect,
    stopCollect,
    powerOff,
    uploadFullWaveData,
    resetDetect,
  }
})
