<template>
  <view class="detect-page">
    <image class="bg-image" src="./bg.png" mode="scaleToFill" />

    <view class="detect-page__content">
      <view class="detect-page__left">
        <template>
          <view class="user-info">
            <view class="info-row">
              <view class="info-label">
                <image class="info-icon" src="./account.png" mode="aspectFit" />
                <text class="info-text">姓名</text>
              </view>
              <input class="info-input" v-model="userInfo.name" placeholder="请输入姓名" placeholder-class="info-input__placeholder" />
            </view>
            <view class="info-row">
              <view class="info-label">
                <view class="info-icon info-icon--num">
                  <text class="info-icon-text">#</text>
                </view>
                <text class="info-text">编号</text>
              </view>
              <input class="info-input" v-model="userInfo.id" placeholder="请输入编号" placeholder-class="info-input__placeholder" />
            </view>
            <view class="info-row">
              <view class="info-label">
                <view class="info-icon info-icon--cake">
                  <text class="info-icon-text">🎂</text>
                </view>
                <text class="info-text">生日</text>
              </view>
              <input class="info-input" v-model="userInfo.birthday" placeholder="请输入生日" placeholder-class="info-input__placeholder" />
            </view>
            <view class="info-row">
              <view class="info-label">
                <image class="info-icon" src="./height.png" mode="aspectFit" />
                <text class="info-text">身高</text>
              </view>
              <input class="info-input" v-model="userInfo.height" placeholder="请输入身高" placeholder-class="info-input__placeholder" />
            </view>
            <view class="info-row">
              <view class="info-label">
                <view class="info-icon info-icon--weight">
                  <text class="info-icon-text">⚖</text>
                </view>
                <text class="info-text">体重</text>
              </view>
              <input class="info-input" v-model="userInfo.weight" placeholder="请输入体重" placeholder-class="info-input__placeholder" />
            </view>
          </view>

          <view class="start-btn" :class="{ 'start-btn--active': isCountingDown }">
          <div class="loader">
            <div class="face"></div>
          </div>
          <image class="start-btn__border" src="./btn-border.png" mode="scaleToFill" />
          <image class="start-btn__bg" src="./btn.png" mode="scaleToFill" />
          <view class="start-btn__content">
            <text class="start-btn__text">{{ progress }}</text>
          </view>
        </view>
        </template>
      </view>
      <view class="detect-page__right">
        <view class="detect-page__bg">
          <image class="bg-image" src="./bg1.png" mode="scaleToFill" />
          <view class="detect-page__bg-content">
            <canvas
              v-show="!paramPanelVisible"
              id="waveformCanvas"
              canvas-id="waveformCanvas"
              class="waveform-canvas"
              :style="canvasStyle"
              :width="canvasWidth"
              :height="canvasHeight"
            />
          </view>
        </view>
      </view>
    </view>

    <view class="top-bar">
      <view class="back-btn" @click="goHome">
        <text class="btn-text">返回首页</text>
      </view>
      <view class="retry-btn" @click="retryDetect">
        <text class="btn-text">重新检测</text>
      </view>
    </view>

    <!-- <view class="progress-center">
      <sar-progress-circle root-class="progress-circle" :percent="progress" :thickness="10" size="66rpx" color="#00D4A4" />
    </view> -->

    <view class="param-entry" @click="openParamPanel">
      <view class="param-entry-text">
        调整参数
      </view>
    </view>

    <sar-popup
      v-model:visible="paramPanelVisible"
      effect="slide-bottom"
      :duration="220"
      :root-style="{ borderRadius: '12rpx 12rpx 0 0' }"
    >
      <view class="param-panel-content">
        <view class="param-panel-header">
          <view class="param-title">
            波形参数
          </view>
          <view class="param-close" @click="closeParamPanel">
            取消
          </view>
        </view>

        <view class="param-list">
          <view v-for="item in paramControls" :key="item.key" class="param-row">
            <view class="param-row-head">
              <view class="param-label">
                {{ item.label }}
              </view>
              <view class="param-value">
                {{ formatParamValue(item.key) }}
              </view>
            </view>
            <view class="param-slider-wrapper">
              <slider
                class="param-slider"
                :value="draftParams[item.key]"
                :min="item.min"
                :max="item.max"
                :step="item.step"
                active-color="#27e0b8"
                background-color="#e0e0e0"
                block-color="#ffffff"
                :block-size="18"
                @changing="onParamSliderChange($event, item.key)"
                @change="onParamSliderChange($event, item.key)"
              />
            </view>
          </view>
        </view>

        <view class="param-actions">
          <view class="param-btn param-btn--ghost" @click="resetDraftParams">
            <view>重置</view>
          </view>
          <view class="param-btn param-btn--primary" @click="applyParamPanel">
            <view>确定</view>
          </view>
        </view>
      </view>
    </sar-popup>
  </view>
</template>

<script lang="ts" setup name="Detect">
import { onBackPress, onHide, onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import { computed, reactive, ref, watch } from 'vue'
import { useBluetoothStore } from '@/store/bluetooth'
import { BASELINE_WINDOW } from '@/utils/bluetooth/constants'

definePage({
  style: {
    navigationBarTitleText: '检测中',
    pageOrientation: 'landscape',
  },
})
interface Point {
  x: number
  y: number
}

const imgs = ref([
  `${__ASSETS__}/pulse/detect-bj.jpg`,
])
interface WaveParams {
  amplitudeRatio: number
  xStep: number
  yStep: number
  filterAlpha: number
  dcCompensationStep: number
  verticalBaseOffset: number
}

type WaveParamKey = keyof WaveParams

interface ParamControl {
  key: WaveParamKey
  label: string
  min: number
  max: number
  step: number
  digits: number
}

const bluetoothStore = useBluetoothStore()

const mode = ref<'quick' | 'full'>('quick')
const canvasWidth = ref(600)
const canvasHeight = ref(300)
const paramPanelVisible = ref(false)

const defaultParams: WaveParams = {
  amplitudeRatio: 0.30,
  xStep: 1,
  yStep: 600,
  filterAlpha: 0.3,
  dcCompensationStep: 0.06,
  verticalBaseOffset: 0,
}

const appliedParams = reactive<WaveParams>({ ...defaultParams })
const draftParams = reactive<WaveParams>({ ...defaultParams })

const paramControls: ParamControl[] = [
  { key: 'amplitudeRatio', label: '波形振幅', min: 0.05, max: 1.0, step: 0.05, digits: 2 },
  { key: 'xStep', label: 'x轴步长', min: 0.5, max: 2.5, step: 0.1, digits: 1 },
  { key: 'yStep', label: 'Y轴步长', min: 200, max: 1000, step: 50, digits: 0 },
  { key: 'filterAlpha', label: '一阶滤波强度', min: 0.05, max: 0.6, step: 0.01, digits: 2 },
  { key: 'dcCompensationStep', label: '垂直补偿步长', min: 0.001, max: 0.08, step: 0.001, digits: 3 },
  { key: 'verticalBaseOffset', label: '垂直补偿值', min: -800, max: 800, step: 20, digits: 0 },
]

const isConnected = computed(() => bluetoothStore.isConnected)
const progress = computed(() => bluetoothStore.collectProgress)
const isDetecting = computed(() => bluetoothStore.isDetecting)
const connectLoading = ref(false)

// ===== 用户基本信息 =====
const userInfo = reactive({
  name: '',
  id: '',
  birthday: '',
  height: '',
  weight: '',
})

const isCountingDown = ref(false)

const canvasStyle = computed(() => ({
  position: 'absolute',
  top: '41rpx',
  left: '12rpx',
  width: `${canvasWidth.value}px`,
  height: `${canvasHeight.value}px`,
  background: 'linear-gradient(180deg, #55d6db 0%, #108a90 100%)',
  borderRadius: '10rpx',
}))

// 监听检测状态，检测完成后立即停止绘制波形
watch(isDetecting, (newVal, oldVal) => {
  // 当从检测中变为非检测中时，停止波形绘制
  if (oldVal === true && newVal === false) {
    stopDrawLoop()
  }
})

// 监听连接状态变化，断开时停止检测和绘制
watch(isConnected, (newVal, oldVal) => {
  if (oldVal === true && newVal === false) {
    stopDrawLoop()
    uni.showToast({ title: '设备连接已断开', icon: 'none' })
  }
})

let animationTimer: ReturnType<typeof setInterval> | null = null
let hasInitedDataHandler = false
let isCleaningUp = false
// ===== 数据处理状态 =====
// 环形缓冲实现基线窗口：120点=0.6秒，快速响应DC漂移
const baselineRing = new Float64Array(BASELINE_WINDOW)
let baselineRingHead = 0
let baselineRingCount = 0
let baselineSum = 0
let smoothBaseline = { value: 0 }
let lastRawVal: number | undefined
let prevRawVal: number | undefined
let lastFilterVal = 0
let lastFilterVal2 = 0
let continueErrorCount = 0
let isFirstDataPoint = true

// 相邻点最大允许跳变值：200Hz采样下指脉波正常相邻点差<100，超过300视为异常
const MAX_SINGLE_JUMP = 300
// 连续异常点上限：超过则保持外推趋势但限制数量
const MAX_CONSECUTIVE_BAD = 6

// ===== 绘制队列：蓝牙回调时放入原始数据，绘制循环中处理并取数 =====
let rawDataQueue: number[] = []
let queueReadIndex = 0

// ===== 周期管理：一个周期 = 从左到右扫描一屏 =====
let currentX = 30
let cyclePoints: Point[] = []

// ===== 匀速绘制：基于实际时间差的浮点累积器，200点/秒 =====
let drawAccumulator = 0
let lastDrawTime = 0

const animationInterval = 30
const maxRawQueue = 1200
let ctx: ReturnType<typeof uni.createCanvasContext> | null = null

let isFirstLoad = true

onLoad((options) => {
  if (options?.mode) {
    mode.value = options.mode === 'full' ? 'full' : 'quick'
  }
  isFirstLoad = true
  isCleaningUp = false
  initCanvas()
  resetWaveState()
  resetDrawState()
  startDetect()
})

onShow(() => {
  if (isFirstLoad) {
    isFirstLoad = false
    return
  }
  initCanvas()
  if (isDetecting.value && isConnected.value) {
    startDrawLoop()
  }
})

/**
 * 页面离开时的完整清理函数（async，确保状态完全重置后再导航）：
 * - 立即停止绘制循环
 * - 重置波形状态
 * - 静默停止蓝牙检测（发停止帧给设备，不弹toast不上传）
 */
async function cleanupOnExit() {
  if (isCleaningUp) return
  isCleaningUp = true
  stopDrawLoop()
  resetWaveState()
  try {
    await bluetoothStore.silentStop()
  }
  catch {
    // ignore errors during cleanup
  }
}

onHide(() => {
  // 页面隐藏（切后台/导航到其他页）时只暂停绘制循环，不停止检测
  // 因为检测停止需要 await silentStop，而 onHide 中不能阻止导航
  // 如果是真正离开页面（retry/goHome/back），由调用方主动 await cleanupOnExit
  stopDrawLoop()
})

onUnload(() => {
  // 页面卸载时确保完整清理（防止用户直接按系统返回键等未经过retry/goHome的情况）
  if (!isCleaningUp) {
    isCleaningUp = true
    stopDrawLoop()
    resetWaveState()
    bluetoothStore.silentStop().catch(() => {})
  }
  isFirstLoad = true
  hasInitedDataHandler = false
})

onBackPress(() => {
  // 系统返回键：不阻止默认行为，让 onHide/onUnload 处理清理
  return false
})

function initCanvas() {
  const sysInfo = uni.getSystemInfoSync()
  const screenW = Math.max(sysInfo.windowWidth, sysInfo.windowHeight)
  const screenH = Math.min(sysInfo.windowWidth, sysInfo.windowHeight)
  canvasWidth.value = screenW - uni.upx2px(291)
  canvasHeight.value = screenH - uni.upx2px(88)
  ctx = uni.createCanvasContext('waveformCanvas')

  // 先绘制画布背景、网格、刻度，不等数据到达
  drawCanvasBackground()

  // 只在第一次初始化时注册数据回调，避免重复注册
  if (!hasInitedDataHandler) {
    hasInitedDataHandler = true

    // 数据回调：原始数据直接入队，处理在绘制循环中进行
    const handleRawData = (points: number[]) => {
      for (const point of points) {
        rawDataQueue.push(point)
      }
      // 队列溢出时丢弃最旧数据，保留最新数据
      if (rawDataQueue.length > maxRawQueue) {
        const discardCount = rawDataQueue.length - maxRawQueue
        rawDataQueue = rawDataQueue.slice(discardCount)
        queueReadIndex = Math.max(0, queueReadIndex - discardCount)
      }
      if (rawDataQueue.length - queueReadIndex > 0) {
        startDrawLoop()
      }
    }

    // 蓝牙模式：注册原始数据回调，数据到达时立即入队
    bluetoothStore.onRawData(handleRawData)
  }
}

function resetWaveState() {
  baselineRingHead = 0
  baselineRingCount = 0
  baselineSum = 0
  smoothBaseline = { value: 0 }
  lastRawVal = undefined
  prevRawVal = undefined
  lastFilterVal = 0
  lastFilterVal2 = 0
  continueErrorCount = 0
  isFirstDataPoint = true
  rawDataQueue = []
  queueReadIndex = 0
  currentX = 35
  cyclePoints = []
  lastDrawTime = 0
  drawAccumulator = 0
}

function resetDrawState() {
  lastDrawTime = 0
  drawAccumulator = 0
}

function syncDraftParams(source: WaveParams) {
  for (const key of Object.keys(source) as WaveParamKey[]) {
    draftParams[key] = source[key]
  }
}

function syncAppliedParams(source: WaveParams) {
  for (const key of Object.keys(source) as WaveParamKey[]) {
    appliedParams[key] = source[key]
  }
}

function openParamPanel() {
  syncDraftParams(appliedParams)
  paramPanelVisible.value = true
}

function closeParamPanel() {
  paramPanelVisible.value = false
}

function resetDraftParams() {
  syncDraftParams(defaultParams)
}

function applyParamPanel() {
  syncAppliedParams(draftParams)
  closeParamPanel()
  drawIncremental()
}

function onParamSliderChange(event: { detail?: { value?: number } }, key: WaveParamKey) {
  const value = Number(event.detail?.value ?? draftParams[key])
  draftParams[key] = value
}

function formatParamValue(key: WaveParamKey) {
  const control = paramControls.find(item => item.key === key)
  const digits = control?.digits ?? 0
  return draftParams[key].toFixed(digits)
}

async function startDetect() {
  if (isDetecting.value || connectLoading.value)
    return

  if (!isConnected.value) {
    await doConnectAndStart()
    return
  }
  doStartDetect()
}

async function doConnectAndStart() {
  connectLoading.value = true
  try {
    const connected = await bluetoothStore.initAndConnect()
    connectLoading.value = false
    if (connected) {
      doStartDetect()
    }

    else {
      uni.showModal({
        title: '连接失败',
        content: '蓝牙设备连接失败，请检查蓝牙是否开启，是否重新尝试连接？',
        success: (res) => {
          if (res.confirm) {
            doConnectAndStart()
          }
        },
      })
    }
  }
  catch {
    connectLoading.value = false
    uni.showToast({ title: '连接失败', icon: 'none' })
  }
}

async function doStartDetect() {
  resetWaveState()
  const ok = await bluetoothStore.startDetect(mode.value)
  if (!ok) {
    if (!isConnected.value) {
      doConnectAndStart()
    }
    else if (bluetoothStore.isDetecting) {
      // 检测已经在运行（可能是快速重入场景），不需要额外操作
    }
    else {
      // 启动失败可能是因为停止操作还在进行，短暂延迟后重试一次
      setTimeout(() => {
        if (!isDetecting.value && isConnected.value) {
          bluetoothStore.startDetect(mode.value)
        }
      }, 300)
    }
  }
}

async function retryDetect() {
  await cleanupOnExit()
  uni.navigateBack()
}

async function goHome() {
  await cleanupOnExit()
  uni.reLaunch({ url: '/pages/index/index' })
}

/**
 * 启动绘制循环：
 * - 基于实际时间差（Date.now()）的浮点累积器，严格匀速 200点/秒
 * - draw(true) 增量绘制：每帧只画新增线段，不累积命令，性能稳定
 * - draw(false) 周期清屏：到达右边界时全量清屏+网格重绘
 */
function startDrawLoop() {
  if (animationTimer)
    return
  lastDrawTime = Date.now()
  animationTimer = setInterval(() => {
    drawIncremental()
  }, animationInterval)
}

function stopDrawLoop() {
  if (animationTimer) {
    clearInterval(animationTimer)
    animationTimer = null
  }
}

/**
 * 增量数据消费 + 增量绘制：
 *
 * 核心设计：
 * 1. 基于实际时间差（Date.now()）累积点数，严格 200点/秒，不受 setInterval 漂移影响
 * 2. draw(true) 增量绘制：每帧只画新增线段，画布保留之前内容，命令不累积
 * 3. draw(false) 周期清屏：到达右边界时全量清屏+网格重绘，重置命令缓冲区
 * 4. lineTo 折线：x 严格单调递增，无贝塞尔过冲/回环
 * 5. 每帧最多 8 点，防止突发消费造成卡顿
 */
function drawIncremental() {
  if (!ctx) {
    return
  }
  const w = canvasWidth.value
  const h = canvasHeight.value

  const waveAreaY = 8
  const waveAreaHeight = h - waveAreaY
  const waveAreaX = 35
  const waveAreaWidth = w - waveAreaX
  const xStep = (waveAreaWidth / 600) * appliedParams.xStep

  const now = Date.now()
  const availablePoints = rawDataQueue.length - queueReadIndex

  // ===== 队列为空：暂停时钟，不累积时间，避免新数据来时猛冲 =====
  if (availablePoints === 0) {
    lastDrawTime = now
    drawAccumulator = 0
    if (cyclePoints.length >= 2)
      return
    // 还没画过任何点，仅绘制背景网格
    ctx.clearRect(0, 0, w, h)
    drawGrid(ctx, w, waveAreaX, waveAreaY, waveAreaWidth, waveAreaHeight)
    ctx.draw(false, () => {})
    return
  }

  // ===== 基于实际时间差的点累积（200点/秒 = 0.2点/ms）=====
  if (lastDrawTime === 0)
    lastDrawTime = now
  const elapsed = Math.min(now - lastDrawTime, 100)
  lastDrawTime = now
  drawAccumulator += elapsed * 0.2

  let pointsToDraw = Math.floor(drawAccumulator)
  drawAccumulator -= pointsToDraw
  pointsToDraw = Math.min(pointsToDraw, 8, availablePoints)

  if (pointsToDraw <= 0)
    return

  // ===== 新周期：到达右边界，重置 =====
  if (currentX >= waveAreaX + waveAreaWidth) {
    cyclePoints = []
    currentX = waveAreaX
    drawAccumulator = 0
    lastDrawTime = now
  }

  // ===== 消费数据点，转换为坐标 =====
  for (let i = 0; i < pointsToDraw; i++) {
    if (queueReadIndex >= rawDataQueue.length)
      break
    if (currentX >= waveAreaX + waveAreaWidth)
      break

    const rawValue = rawDataQueue[queueReadIndex++]
    const processed = normalizeWaveValue(rawValue)
    const y = valueToY(processed, waveAreaY, waveAreaHeight)
    cyclePoints.push({ x: currentX, y })
    currentX += xStep
  }

  // 定期清理已读数据
  if (queueReadIndex > 500) {
    rawDataQueue = rawDataQueue.slice(queueReadIndex)
    queueReadIndex = 0
  }

  if (cyclePoints.length < 2)
    return

  // ===== 全量重绘当前周期：保证贝塞尔曲线绝对平滑，无折线转折 =====
  ctx.clearRect(0, 0, w, h)
  drawGrid(ctx, w, waveAreaX, waveAreaY, waveAreaWidth, waveAreaHeight)

  ctx.setStrokeStyle('rgba(39, 224, 184, 0.95)')
  ctx.setLineWidth(2)
  ctx.setLineCap('round')
  ctx.setLineJoin('round')

  ctx.beginPath()
  ctx.moveTo(cyclePoints[0].x, cyclePoints[0].y)

  if (cyclePoints.length === 2) {
    ctx.lineTo(cyclePoints[1].x, cyclePoints[1].y)
  }
  else {
    // 中点二次贝塞尔曲线：经过所有控制点，C1连续，无尖角无转折
    const m0x = (cyclePoints[0].x + cyclePoints[1].x) / 2
    const m0y = (cyclePoints[0].y + cyclePoints[1].y) / 2
    ctx.lineTo(m0x, m0y)
    for (let i = 1; i < cyclePoints.length - 1; i++) {
      const mx = (cyclePoints[i].x + cyclePoints[i + 1].x) / 2
      const my = (cyclePoints[i].y + cyclePoints[i + 1].y) / 2
      ctx.quadraticCurveTo(cyclePoints[i].x, cyclePoints[i].y, mx, my)
    }
    ctx.lineTo(cyclePoints[cyclePoints.length - 1].x, cyclePoints[cyclePoints.length - 1].y)
  }

  ctx.stroke()
  ctx.draw(false, () => {})
}

/**
 * 中点二次贝塞尔曲线全量绘制（用于onShow恢复/首次绘制）
 * 算法：moveTo(p0) → lineTo(mid(p0,p1)) → 对每个中间点pi，
 * quadraticCurveTo(pi, mid(pi,pi+1)) → 最后lineTo(pn)
 * 曲线经过所有数据点，C1切线连续，无尖角
 */
function drawWavePath(ctx: UniApp.CanvasContext, points: Point[]) {
  if (points.length < 2)
    return
  ctx.setStrokeStyle('rgba(39, 224, 184, 0.95)')
  ctx.setLineWidth(2)
  ctx.setLineCap('round')
  ctx.setLineJoin('round')

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)

  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y)
  }
  else {
    const m0x = (points[0].x + points[1].x) / 2
    const m0y = (points[0].y + points[1].y) / 2
    ctx.lineTo(m0x, m0y)
    for (let i = 1; i < points.length - 1; i++) {
      const mx = (points[i].x + points[i + 1].x) / 2
      const my = (points[i].y + points[i + 1].y) / 2
      ctx.quadraticCurveTo(points[i].x, points[i].y, mx, my)
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y)
  }

  ctx.stroke()
}

/**
 * 数据处理流水线：
 *   ① 异常值处理 → ② 两级一阶IIR低通滤波 → ③ 去直流+慢漂移抑制
 *
 * 关键设计：
 * - 两级 IIR（alpha1=0.5, alpha2=0.3）：平滑但不失真，消除毛刺和转折
 * - smoothBaseline 初始化为首个数据点，消除初始漂移
 * - 基线窗口 400 点(2s) + dcStep=0.005：快速追踪DC漂移，截止频率~0.16Hz
 */
function normalizeWaveValue(value: number): number {
  let v = value

  // 异常检测：数值越界 或 与前值跳变超过阈值
  const isOutOfRange = v < 0 || v > 65535
  const jumpTooBig = lastRawVal !== undefined && Math.abs(v - lastRawVal) > MAX_SINGLE_JUMP

  if (isOutOfRange || jumpTooBig) {
    continueErrorCount++
    if (continueErrorCount > MAX_CONSECUTIVE_BAD) {
      // 连续异常过多（可能字节错位后重新同步），接受新值，但重置历史避免污染滤波器
      continueErrorCount = 0
      prevRawVal = undefined
      lastRawVal = v
      lastFilterVal = v
      lastFilterVal2 = v
      smoothBaseline.value = v
      return 0
    }
    else {
      // 线性外推：基于前两个点的斜率预测当前值，避免平线
      if (prevRawVal !== undefined && lastRawVal !== undefined) {
        const slope = lastRawVal - prevRawVal
        v = lastRawVal + slope
      }
      else if (lastRawVal !== undefined) {
        // 只有一个历史点，保持该值（仅前2个点可能出现）
        v = lastRawVal
      }
      // 没有历史点时用原始值（首点异常）
    }
  }
  else {
    continueErrorCount = 0
  }

  // 更新历史点（外推值也作为历史，保持连续性；外推值是基于前两点算的，不是重复前值）
  prevRawVal = lastRawVal
  lastRawVal = v

  if (isFirstDataPoint) {
    lastFilterVal = v
    lastFilterVal2 = v
    smoothBaseline.value = v
    isFirstDataPoint = false
    return removeDCAndDriftWithStep(v)
  }

  // 两级一阶IIR低通滤波
  const alpha1 = Math.min(appliedParams.filterAlpha + 0.2, 0.65)
  const alpha2 = Math.max(appliedParams.filterAlpha - 0.05, 0.15)
  lastFilterVal = lastFilterVal + alpha1 * (v - lastFilterVal)
  lastFilterVal2 = lastFilterVal2 + alpha2 * (lastFilterVal - lastFilterVal2)

  return removeDCAndDriftWithStep(lastFilterVal2)
}

function removeDCAndDriftWithStep(value: number) {
  // 环形缓冲写入
  if (baselineRingCount >= BASELINE_WINDOW) {
    // 满了，减去即将被覆盖的旧值
    baselineSum -= baselineRing[baselineRingHead]
  }
  else {
    baselineRingCount++
  }
  baselineRing[baselineRingHead] = value
  baselineSum += value
  baselineRingHead = (baselineRingHead + 1) % BASELINE_WINDOW

  const mean = baselineSum / baselineRingCount
  smoothBaseline.value += appliedParams.dcCompensationStep * (mean - smoothBaseline.value)
  return value - smoothBaseline.value
}

/**
 * 将信号值映射为画布 Y 坐标（与参考btsentest逻辑一致）
 * 坐标系设计（canvas y=0在顶部，y增大向下）：
 *   - 刻度 100 在顶部 (y = waveAreaY)
 *   - 刻度 0 在底部 (y = waveAreaY + waveAreaHeight = canvas 底部)
 *   - 基线 value=0 对应刻度 50（垂直居中）
 *   - value<0（收缩期/脉搏波到来，ADC值低于基线）→ y减小 → 向上 → 波峰
 *   - value>0（舒张期，ADC值高于基线）→ y增大 → 向下 → 波谷
 *   - scale = (waveAreaHeight / yStep) * amplitudeRatio
 *   - y = baselineY + value * scale（与参考HTML一致：midY + correctedVal * scale）
 */
function valueToY(value: number, waveAreaY: number, waveAreaHeight: number) {
  const bottomY = waveAreaY + waveAreaHeight
  const baselineY = waveAreaY + waveAreaHeight * 0.5
  const scale = (waveAreaHeight / appliedParams.yStep) * appliedParams.amplitudeRatio
  const y = baselineY + value * scale
  return Math.max(waveAreaY, Math.min(bottomY, y))
}

/**
 * 初始化绘制：画布背景 + 网格 + 刻度，数据到达前就显示
 */
function drawCanvasBackground() {
  if (!ctx)
    return
  const w = canvasWidth.value
  const h = canvasHeight.value
  const waveAreaY = 8
  const waveAreaHeight = h - waveAreaY
  const waveAreaX = 35
  const waveAreaWidth = w - waveAreaX

  drawGrid(ctx, w, waveAreaX, waveAreaY, waveAreaWidth, waveAreaHeight)
  ctx.draw(false, () => {})
}

function drawGrid(
  ctx: UniApp.CanvasContext,
  canvasW: number,
  waveAreaX: number,
  waveAreaY: number,
  waveAreaWidth: number,
  waveAreaHeight: number,
) {
  const gridRows = 6
  const rowHeight = waveAreaHeight / (gridRows - 1)

  ctx.setStrokeStyle('rgba(113, 180, 229, 0.3)')
  ctx.setLineWidth(1)
  for (let i = 0; i < gridRows; i++) {
    const y = waveAreaY + i * rowHeight
    ctx.beginPath()
    ctx.moveTo(waveAreaX, y)
    ctx.lineTo(canvasW, y)
    ctx.stroke()
  }

  ctx.setFillStyle('rgba(255, 255, 255, 0.6)')
  ctx.setFontSize(11)
  ctx.setTextAlign('right')
  const yLabels = ['100', '80', '60', '40', '20', '0']
  for (let i = 0; i < yLabels.length; i++) {
    const y = waveAreaY + i * rowHeight
    if (i === 0) {
      ctx.setTextBaseline('top')
      ctx.fillText(yLabels[i], waveAreaX - 6, y)
    }
    else if (i === yLabels.length - 1) {
      ctx.setTextBaseline('bottom')
      ctx.fillText(yLabels[i], waveAreaX - 6, y)
    }
    else {
      ctx.setTextBaseline('middle')
      ctx.fillText(yLabels[i], waveAreaX - 6, y)
    }
  }
}

function drawLeadingDot(ctx: UniApp.CanvasContext, point: Point) {
  ctx.beginPath()
  ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2)
  ctx.setFillStyle('#27e0b8')
  ctx.fill()
}
</script>

<style lang="scss" scoped>
.bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.detect-page {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    width: 100%;
    height: 100%;
  }

  &__left {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 250rpx;
    height: 100%;
    padding: 30rpx 20rpx 10rpx 42rpx;
    box-sizing: border-box;
    z-index: 10;
  }

  &__right {
    flex: 1;
    position: relative;
    height: 100%;
  }

  &__bg {
    position: absolute;
    z-index: 1;
    left: 0;
    top: 20rpx;
    right: 20rpx;
    bottom: 20rpx;
  }
}

.user-info {
  display: flex;
  flex-direction: column;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rpx 0;
}

.info-label {
  display: flex;
  align-items: center;
  gap: 6rpx;
  flex-shrink: 0;
}

.info-icon {
  width: 20rpx;
  height: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  &--num,
  &--cake,
  &--weight {
    background: rgba(39, 224, 184, 0.2);
    border-radius: 50%;
    border: 1rpx solid rgba(39, 224, 184, 0.4);
  }
}

.info-icon-text {
  font-size: 14rpx;
  color: #27e0b8;
  line-height: 1;
}

.info-text {
  font-size: 10rpx;
  color: #333;
  font-weight: 500;
  letter-spacing: 2rpx;
}

.info-input {
  flex: 1;
  max-width: 110rpx;
  height: 26rpx;
  padding: 0 6rpx;
  margin-left: 8rpx;
  font-size: 10rpx;
  color: #333;
  background: #fff;
  border-radius: 6rpx;
  text-align: left;
  border: 1rpx solid #5a3023;
}

.info-input__placeholder {
  color: #97a3b4;
  font-size: 10rpx;
}

.start-btn {
  position: relative;
  width: 86rpx;
  height: 86rpx;
  margin: 0 auto;
  margin-bottom: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s ease;

  &:active {
    transform: scale(0.96);
  }

  &--active {
    .start-btn__text {
      color: #ff9500;
      font-size: 14rpx;
      font-weight: bold;
      }
  }

  &__border,
  &__bg,
  &__deco {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

   &__bg {
    position: absolute;
    top: 6rpx;
    left: 6rpx;
    width: 74rpx;
    height: 74rpx;
  }

  &__border {
    z-index: 1;
  }

  &__bg {
    z-index: 2;
  }

  &__deco {
    z-index: 3;
  }

  &__content {
    position: relative;
    z-index: 4;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    flex-shrink: 0;
  }

  &__text {
    font-size: 16rpx;
    font-weight: bold;
    letter-spacing: 4rpx;
    text-align: center;
    font-family: 'Courier New', monospace;
    color: transparent;
    background-image: linear-gradient(180deg, #e6b89c, #a05c38);
    background-clip: text;
    -webkit-background-clip: text;
    text-shadow: 0 0 6rpx rgba(200, 120, 70, 0.5);
  }
  }

.top-bar {
  position: absolute;
  top: 12px;
  left: 270px;
  right: 30px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 20;
}

.back-btn,
.retry-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, rgba(0, 212, 164, 0.9), rgba(0, 180, 140, 0.9));
  box-shadow:
    0 2rpx 6rpx rgba(0, 212, 164, 0.3),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  backdrop-filter: blur(5rpx);
}

.back-btn:active,
.retry-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 6rpx rgba(0, 212, 164, 0.2);
}

.btn-text {
  font-size: 12rpx;
  font-weight: 500;
  color: #fff;
  letter-spacing: 2rpx;
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.2);
}

.waveform-canvas {
  z-index: 1;
}

.progress-center {
  position: absolute;
  top: 6rpx;
  left: 50%;
  transform: translateX(-50%);
  z-index: 21;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-circle {
  :deep(.sar-progress-circle__text) {
    font-size: 18rpx;
    font-weight: bold;
  }
}

.param-entry {
  position: absolute;
  right: 15rpx;
  bottom: 15rpx;
  z-index: 998;
  padding: 6rpx 12rpx;
  border: 1rpx solid rgba(39, 224, 184, 0.55);
  border-radius: 24rpx;
  background: rgba(5, 22, 39, 0.76);
}

.param-entry-text {
  color: #dffdf7;
  font-size: 12rpx;
  letter-spacing: 2rpx;
}

.param-panel-content {
  width: 100%;
  background: #ffffff;
  border-radius: 12rpx 12rpx 0 0;
}

.param-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
  padding: 12rpx 40rpx 8rpx 46rpx;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.1);
}

.param-title {
  color: #333333;
  font-size: 14rpx;
  font-weight: 600;
}

.param-close {
  color: #333333;
  font-size: 14rpx;
  padding: 8rpx 16rpx;
}

.param-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12rpx;
  padding: 0 40rpx;
}

.param-row {
  width: calc(50% - 12rpx);
}

.param-row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rpx;
}

.param-label {
  color: #666666;
  font-size: 12rpx;
}

.param-value {
  color: #07c160;
  font-size: 12rpx;
}

.param-slider {
  margin: 0;
}

.param-slider-wrapper {
  width: 100%;
}

.param-actions {
  display: flex;
  justify-content: space-between;
  gap: 18rpx;
  margin-top: 16rpx;
  padding: 0 40rpx 16rpx;
}

.param-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 84rpx;
  height: 36rpx;
  border-radius: 18rpx;
  font-size: 14rpx;
}

.param-btn--ghost {
  color: #06221c;
  border: 1rpx solid #27e0b8;
}

.param-btn--primary {
  color: #06221c;
  background: #27e0b8;
  font-weight: 600;
}

.loader {
  width: 86rpx;
  height: 86rpx;
  font-size: 0px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  .face {
    position: absolute;
    left: 7rpx;
    top: 7rpx;
    border-radius: 50%;
    border-style: solid;
    animation: animate 1s linear infinite;
    z-index: 9;
    }

  .face:nth-child(1) {
    width: 70rpx;
    height: 70rpx;
    color: #27e0b8;
    border-color: currentColor currentColor transparent transparent;
    border-width: 4rpx 0 0 4rpx;
    --deg: -135deg;
    animation-direction: reverse;
  }
}
@keyframes animate {
  to {
    transform: rotate(1turn);
  }
}
</style>
