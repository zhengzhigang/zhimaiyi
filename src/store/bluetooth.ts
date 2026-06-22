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
  const isConnected = ref(false)
  const deviceName = ref('')
  const deviceId = ref('')

  // ========== 检测状态 ==========
  const collectMode = ref<CollectMode>(CollectMode.MODE_STOP)
  const detectType = ref<DetectType>('quick')
  const isDetecting = ref(false)
  const isCollectingFullWave = ref(false)

  // ========== 数据 ==========
  const heartRate = ref(0)
  const spo2 = ref(0)
  const wavePoints = ref<number[]>([])
  const filterPoints = ref<number[]>([])
  const fullWaveData = ref<number[]>([])

  // ========== 采样统计 ==========
  const instantSampleRate = ref(0)
  const avgSampleRate = ref(0)

  // ========== 进度 ==========
  const collectProgress = ref(0)
  const remainingTime = ref(0)

  // ========== 调试参数 ==========
  const amplitudeRatio = ref(0.1)
  const xStep = ref(1)
  const yStep = ref(80)
  const filterAlpha = ref(0.3)
  const verticalBaseOffset = ref(32768)

  // ========== 计算属性 ==========
  const connectionText = computed(() => (isConnected.value ? '设备已连接' : '请连接检测设备'))

  // ========== 内部辅助 ==========
  function updateConnectionState() {
    const state = bluetoothManager.getConnectionState()
    isConnected.value = state.isConnected
    deviceName.value = state.deviceName
    deviceId.value = state.deviceId
  }

  function updateDetectState() {
    const state = bluetoothManager.getDetectState()
    isDetecting.value = state.isDetecting
    collectMode.value = state.collectMode
    detectType.value = state.detectType
  }

  // ========== 蓝牙连接相关 ==========
  async function initAndConnect(targetDeviceName?: string): Promise<boolean> {
    console.log('开始初始化')
    const ok = await bluetoothManager.initBluetooth()
    console.log('初始化蓝牙', ok)
    if (!ok) return false

    const devices = await bluetoothManager.startScan()
    console.log('devices', targetDeviceName, devices)
    const target = targetDeviceName
      ? devices.find((d) => d.deviceId?.includes(targetDeviceName))
      : devices[0]
    console.log('target', target)

    if (!target) {
      uni.showToast({ title: '未找到设备', icon: 'none' })
      return false
    }

    const connected = await bluetoothManager.connectDevice(target.deviceId, target.name || '')
    console.log('connected', connected)
    if (connected) {
      updateConnectionState()
    }
    return connected
  }

  async function connectDevice(deviceId: string, name = ''): Promise<boolean> {
    const ok = await bluetoothManager.initBluetooth()
    if (!ok) return false
    const connected = await bluetoothManager.connectDevice(deviceId, name)
    if (connected) {
      updateConnectionState()
    }
    return connected
  }

  async function disconnectDevice() {
    await bluetoothManager.disconnect()
    updateConnectionState()
    resetState()
  }

  // ========== 检测相关 ==========
  async function startQuickDetect(): Promise<boolean> {
    return startDetect('quick')
  }

  async function startFullDetect(): Promise<boolean> {
    return startDetect('full')
  }

  async function startDetect(type: DetectType): Promise<boolean> {
    updateDetectState()
    if (isDetecting.value) {
      uni.showToast({ title: '检测正在进行中', icon: 'none' })
      return false
    }

    detectType.value = type
    isCollectingFullWave.value = type === 'full'
    wavePoints.value = []
    filterPoints.value = []
    fullWaveData.value = []
    collectProgress.value = 0
    remainingTime.value = type === 'full' ? 180 : 120

    // 注册回调
    bluetoothManager.setCallbacks({
      onWaveData: (points: number[]) => {
        // 控制显示点数
        const maxDisplay = 600
        const current = wavePoints.value
        const combined = [...current, ...points]
        if (combined.length > maxDisplay) {
          wavePoints.value = combined.slice(combined.length - maxDisplay)
        } else {
          wavePoints.value = combined
        }
      },
      onProgress: (progress: number, remaining: number) => {
        collectProgress.value = progress
        remainingTime.value = remaining
      },
      onDetectComplete: (data: number[]) => {
        fullWaveData.value = data
        isDetecting.value = false
        isCollectingFullWave.value = false
        collectMode.value = CollectMode.MODE_STOP
        uni.showToast({ title: '检测完成', icon: 'success' })

        // 全面检测结束后自动上传数据
        if (detectType.value === 'full' && data.length > 0) {
          uploadFullWaveData(data)
        }
      },
      onError: (err: string) => {
        uni.showToast({ title: err, icon: 'none' })
      },
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

  async function stopCollect() {
    await bluetoothManager.stopDetect()
    updateDetectState()
  }

  async function powerOff() {
    await bluetoothManager.powerOff()
  }

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

  function resetDetect() {
    bluetoothManager.reset()
    resetState()
  }

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
