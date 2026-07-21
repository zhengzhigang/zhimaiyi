import type { DetectType, UploadWaveData } from '@/utils/bluetooth/types'
import { CollectMode } from '@/utils/bluetooth/types'
import { bluetoothManager } from '@/utils/bluetooth'
import { prepareWaveDataForUpload } from '@/utils/bluetooth/algorithms'
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

  // ========== 回调 ==========
  /** 原始数据回调：蓝牙数据到达时立即调用，由页面注册用于即时处理 */
  let rawDataCallback: ((points: number[]) => void) | null = null

  function onRawData(cb: (points: number[]) => void) {
    rawDataCallback = cb
  }

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
    console.log('初始化蓝牙:', ok)
    if (!ok) return false

    // 扫描蓝牙设备
    const devices = await bluetoothManager.startScan()
    console.log('扫描到的设备:', devices)
    // 按名称匹配目标设备，未指定则取第一个
    const target = targetDeviceName
      ? devices.find((d) => d.deviceId?.includes(targetDeviceName))
      : devices[0]

    if (devices.length === 0) {
      uni.showToast({ title: '未扫描到设备', icon: 'none' })
      return false
    }

    if (!target) {
      uni.showToast({ title: '未找到设备', icon: 'none' })
      return false
    }

    const connected = await bluetoothManager.connectDevice(target.deviceId, target.name || '')
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
  /** 启动快速检测（1分钟） */
  async function startQuickDetect(): Promise<boolean> {
    return startDetect('quick')
  }

  /** 启动全面检测（3分钟） */
  async function startFullDetect(): Promise<boolean> {
    return startDetect('full')
  }

  /**
   * 启动检测流程
   * - 快速检测：1分钟，仅显示实时波形
   * - 全面检测：3分钟，采集完整数据并自动上传分析
   * @param type - 检测类型
   * @param spo2Mode - 是否为血氧检测模式（不上传数据）
   */
  async function startDetect(type: DetectType, spo2Mode = false): Promise<boolean> {
    // 先重置进度和状态，确保重新开始时都是干净的
    collectProgress.value = 0
    remainingTime.value = type === 'full' ? 180 : 60

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

    // 注册蓝牙数据回调
    bluetoothManager.setCallbacks({
      /** 心率血氧数据回调 */
      onHeartRateSpo2: (hr: number, sp: number) => {
        heartRate.value = hr
        spo2.value = sp
      },
      /** 实时波形数据回调，限制最大显示点数防止绘制性能下降 */
      onWaveData: (points: number[]) => {
        // 立即回调页面处理数据（不依赖 setInterval 轮询）
        if (rawDataCallback) {
          rawDataCallback(points)
        }
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
      /** 检测完成回调 */
      onDetectComplete: (data: number[]) => {
        fullWaveData.value = data
        isDetecting.value = false
        isCollectingFullWave.value = false
        collectMode.value = CollectMode.MODE_STOP
        collectProgress.value = 100
        remainingTime.value = 0

        // 血氧检测模式不上传数据
        if (spo2Mode) {
          uni.showToast({ title: '检测完成', icon: 'success' })
          return
        }

        uni.showToast({ title: '检测完成', icon: 'success' })

        // 快速检测和全面检测都上传全部采集数据
        if (data.length > 0) {
          // 延迟 1s 让 toast 先显示完再弹出 loading
          setTimeout(() => {
            uploadFullWaveData(data).catch((err) => {
              // 捕获未处理的异常，防止 Promise 拒绝
              console.error('[onDetectComplete] 上传失败:', err)
            })
          }, 1000)
        } else {
          console.warn('[onDetectComplete] 采集数据为空，跳过上传')
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

    const ok = await bluetoothManager.startDetect(type, spo2Mode)
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
      uni.showLoading({ title: '数据上传中...' })
      // 与 HTML 文件一致的上传预处理：全局均值去直流 → 三次样条插值(200Hz→240Hz) → 映射0-255
      const mapped = prepareWaveDataForUpload(data)

      // 构建上传请求体
      const userStore = useUserStore()
      const payload: UploadWaveData = {
        // customerId: userStore.userInfo?.customerId || 0,
        customerId: 506,
        adminUserId: 49,
        DATA: [],
        PARB: [],
        PARC: mapped,
        testType: detectType.value === 'quick' ? 1 : 2,
      }

      const res = await uploadWaveResult(payload)
      uni.hideLoading()
      if (res.code === 1) {
        uni.redirectTo({ url: `/pages-health/test-report/index?pulseId=${res.data}` })
      }
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
    onRawData,
  }
})
