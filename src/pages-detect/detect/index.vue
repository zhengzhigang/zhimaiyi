<template>
  <view class="detect-page">
    <image class="bg-image" src="/static/images/detect/detect-bj.jpg" mode="scaleToFill" />

    <view class="top-bar">
      <view class="back-btn" @click="goHome">
        <text class="btn-text">返回首页</text>
      </view>
      <view class="retry-btn" @click="retryDetect">
        <text class="btn-text">重新检测</text>
      </view>
    </view>

    <canvas
      v-show="!paramPanelVisible"
      canvas-id="waveformCanvas"
      id="waveformCanvas"
      class="waveform-canvas"
      :style="canvasStyle"
    ></canvas>

    <view class="progress-center">
      <sar-progress-circle root-class="progress-circle" :percent="progress" :thickness="10" size="66rpx" color="#00D4A4" />
    </view>

    <view class="param-entry" @click="openParamPanel">
      <view class="param-entry-text">调整参数</view>
    </view>

    <sar-popup
      v-model:visible="paramPanelVisible"
      effect="slide-bottom"
      :duration="220"
      :root-style="{ borderRadius: '12rpx 12rpx 0 0' }"
    >
      <view class="param-panel-content">
        <view class="param-panel-header">
          <view class="param-title">波形参数</view>
          <view class="param-close" @click="closeParamPanel">取消</view>
        </view>

        <view class="param-list">
          <view v-for="item in paramControls" :key="item.key" class="param-row">
            <view class="param-row-head">
              <view class="param-label">{{ item.label }}</view>
              <view class="param-value">{{ formatParamValue(item.key) }}</view>
            </view>
            <view class="param-slider-wrapper">
              <slider
                class="param-slider"
                :value="draftParams[item.key]"
                :min="item.min"
                :max="item.max"
                :step="item.step"
                activeColor="#27e0b8"
                backgroundColor="#e0e0e0"
                block-color="#ffffff"
                block-size="18"
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
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useBluetoothStore } from '@/store/bluetooth'
import { firstOrderFilter, isWaveValueValid } from '@/utils/bluetooth/algorithms'
import { CHARACTERISTIC_UUID } from '@/utils/bluetooth/constants'

// ===== 开发模式：设为 true 使用 mock 数据，无需蓝牙设备 =====
const MOCK_MODE = false

interface Point {
  x: number
  y: number
}

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
  amplitudeRatio: 0.6,
  xStep: 1,
  yStep: 600,
  filterAlpha: 0.3,
  dcCompensationStep: 0.02,
  verticalBaseOffset: 0,
}

const appliedParams = reactive<WaveParams>({ ...defaultParams })
const draftParams = reactive<WaveParams>({ ...defaultParams })

const paramControls: ParamControl[] = [
  { key: 'amplitudeRatio', label: '波形振幅', min: 0.05, max: 1.0, step: 0.05, digits: 2 },
  { key: 'xStep', label: 'x轴步长', min: 0.5, max: 2.5, step: 0.1, digits: 1 },
  { key: 'yStep', label: 'Y轴步长', min: 100, max: 1000, step: 50, digits: 0 },
  { key: 'filterAlpha', label: '一阶滤波强度', min: 0.05, max: 0.6, step: 0.01, digits: 2 },
  { key: 'dcCompensationStep', label: '直补偿步长', min: 0.001, max: 0.08, step: 0.001, digits: 3 },
  { key: 'verticalBaseOffset', label: '垂直补偿值', min: -800, max: 800, step: 20, digits: 0 },
]

const isConnected = computed(() => bluetoothStore.isConnected)
const progress = computed(() => bluetoothStore.collectProgress)

const canvasStyle = computed(() => ({
  position: 'absolute',
  top: '80px',
  left: '70rpx',
  width: `${canvasWidth.value}px`,
  height: `${canvasHeight.value}px`,
}))

let animationTimer: ReturnType<typeof setInterval> | null = null
// ===== 数据处理状态 =====
let baselineQueue: number[] = []
let smoothBaseline = { value: 32768 }
let lastRawVal: number | undefined
let lastFilterVal = 0
let continueErrorCount = 0
let isFirstDataPoint = true
const baselineWindow = 120

// ===== 绘制队列：蓝牙回调时立即处理数据并放入此队列，绘制循环从此队列取数 =====
let drawQueue: number[] = []

// ===== 周期管理：一个周期 = 从左到右扫描一屏 =====
let currentX = 30 // 当前绘制 X 坐标（waveAreaX，留出刻度标签空间）
let cyclePoints: Point[] = [] // 当前周期已绘制的坐标点

// ===== 绘制速率控制：严格匹配 200Hz 数据率，保证一屏 ≈ 5 个心跳 =====
const DRAW_RATE = 200 // 点/秒，与数据源一致
let drawVirtualTime = 0 // 虚拟时间（秒），控制绘制进度
let drawLastRealTime = 0 // 上次绘制真实时间戳

const animationInterval = 16
const maxDrawQueue = 850 // 队列上限：约 5 个心跳周期（72BPM × 4.2s × 200Hz ≈ 840 点）
let ctx: ReturnType<typeof uni.createCanvasContext> | null = null

onLoad((options) => {
  if (options?.mode) {
    mode.value = options.mode === 'full' ? 'full' : 'quick'
  }
})

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync()
  const screenW = Math.max(sysInfo.windowWidth, sysInfo.windowHeight)
  const screenH = Math.min(sysInfo.windowWidth, sysInfo.windowHeight)
  canvasWidth.value = screenW - uni.upx2px(140)
  canvasHeight.value = screenH - 110
  ctx = uni.createCanvasContext('waveformCanvas')

  // 先绘制画布背景、网格、刻度，不等数据到达
  drawCanvasBackground()

  // 数据处理回调：蓝牙或 Mock 数据共用
  const handleRawData = (points: number[]) => {
    let pushedCount = 0
    for (const point of points) {
      const processed = normalizeWaveValue(point)
      if (processed !== null) {
        drawQueue.push(processed)
        pushedCount++
      }
    }
    if (drawQueue.length > maxDrawQueue) {
      drawQueue = drawQueue.slice(drawQueue.length - maxDrawQueue)
    }
    if (drawQueue.length > 0) {
      startDrawLoop()
    }
  }

  // 蓝牙模式：注册原始数据回调，数据到达时立即处理
  bluetoothStore.onRawData(handleRawData)

  resetWaveState()
  startDetect()
})

onUnmounted(() => {
  stopDrawLoop()
  bluetoothStore.stopCollect()
})

function resetWaveState() {
  baselineQueue = []
  smoothBaseline = { value: 32768 }
  lastRawVal = undefined
  lastFilterVal = 0
  continueErrorCount = 0
  isFirstDataPoint = true
  drawQueue = []
  currentX = 30
  cyclePoints = []
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
  const control = paramControls.find((item) => item.key === key)
  const digits = control?.digits ?? 0
  return draftParams[key].toFixed(digits)
}

async function startDetect() {
  if (MOCK_MODE) {
    // Mock 模式：无需蓝牙连接，直接开始检测
    doStartDetect()
    return
  }

  if (!isConnected.value) {
    uni.showModal({
      title: '提示',
      content: '蓝牙设备未连接，是否尝试连接？',
      success: (res) => {
        if (res.confirm) {
          bluetoothStore.initAndConnect(CHARACTERISTIC_UUID).then(() => {
            if (isConnected.value) {
              doStartDetect()
            }
          })
        }
      },
    })
    return
  }
  doStartDetect()
}

async function doStartDetect() {
  resetWaveState()
  await bluetoothStore.startDetect(mode.value)
}

function retryDetect() {
  stopDrawLoop()
  bluetoothStore.resetDetect()
  resetWaveState()
  // 清空画布，恢复初始背景
  drawCanvasBackground()
  startDetect()
}

function goHome() {
  bluetoothStore.stopCollect()
  uni.reLaunch({ url: '/pages/index/index' })
}

/**
 * 启动绘制循环：
 * - 蓝牙数据通过回调已放入 drawQueue，此处只负责从队列取数绘制
 * - 每帧取 2 个点，动态从左到右扫描
 * - 绘制到 canvas 最右侧时，立即从左侧开始新周期
 */
function startDrawLoop() {
  stopDrawLoop()
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
 * 增量绘制：从 drawQueue 取点，一个周期 = 从左到右扫描一屏
 * - 贝塞尔曲线平滑渲染
 */
function drawIncremental() {
  if (!ctx) {
    return
  }
  const w = canvasWidth.value
  const h = canvasHeight.value

  const paddingTop = 20
  const paddingBottom = 36
  const waveAreaHeight = h - paddingTop - paddingBottom
  const waveAreaY = paddingTop
  const waveAreaX = 30
  const waveAreaWidth = w - waveAreaX
  const xStep = appliedParams.xStep

  // 虚拟时钟：按 200Hz 速率匀速消耗队列，数据不够就等，保证一屏 ≈ 5 个心跳
  const now = Date.now()
  if (drawLastRealTime === 0) drawLastRealTime = now
  const elapsed = (now - drawLastRealTime) / 1000
  drawLastRealTime = now
  const pointsToDraw = Math.min(Math.floor(elapsed * DRAW_RATE), drawQueue.length)
  if (pointsToDraw <= 0) return // 数据还没到，跳过本帧
  for (let i = 0; i < pointsToDraw; i++) {
    const value = drawQueue.shift()!

    // 绘制到 canvas 最右侧 → 立即从左侧开始新周期
    if (currentX >= waveAreaX + waveAreaWidth) {
      cyclePoints = []
      currentX = waveAreaX
    }
    
    const y = valueToY(value, waveAreaY, waveAreaHeight)
    cyclePoints.push({ x: currentX, y })
    currentX += xStep
  }

  // 全量绘制当前周期
  drawGrid(ctx, w, waveAreaX, waveAreaY, waveAreaWidth, waveAreaHeight)

  if (cyclePoints.length < 2) {
    ctx.draw(false, () => {})
    return
  }

  ctx.setStrokeStyle('rgba(39, 224, 184, 0.95)')
  ctx.setLineWidth(2)
  ctx.setLineCap('round')
  ctx.setLineJoin('round')

  // Catmull-Rom → 三次贝塞尔曲线
  ctx.beginPath()
  ctx.moveTo(cyclePoints[0].x, cyclePoints[0].y)

  for (let i = 0; i < cyclePoints.length - 1; i++) {
    const p0 = cyclePoints[Math.max(0, i - 1)]
    const p1 = cyclePoints[i]
    const p2 = cyclePoints[i + 1]
    const p3 = cyclePoints[Math.min(cyclePoints.length - 1, i + 2)]

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
  }

  ctx.stroke()

  // 引导点
  drawLeadingDot(ctx, cyclePoints[cyclePoints.length - 1])

  ctx.draw(false, () => {})
}

/**
 * 数据处理流水线（与 btsentest抑制漂移200hz.html 一致）：
 *   ① 拼包解析 → ② 异常过滤 → ③ 一阶滤波 → ④ 去直流+抑漂移 → ⑤ 映射画布
 * 关键：先滤波再去直流，滤波后的平滑信号做基线追踪更稳定，不会因噪声抖动导致漂移
 */
function normalizeWaveValue(value: number): number | null {
  let v = value
  if (!isWaveValueValid(v, lastRawVal)) {
    continueErrorCount++
    if (continueErrorCount > 5) {
      v = lastRawVal ?? 32768
    } else {
      return null
    }
  } else {
    continueErrorCount = 0
    lastRawVal = v
  }

  // 首数据点：直接赋值，跳过滤波器收敛期，同时初始化基线到当前值避免 DC 漂移
  if (isFirstDataPoint) {
    lastFilterVal = v
    smoothBaseline.value = v
    isFirstDataPoint = false
  } else {
    lastFilterVal = firstOrderFilter(v, lastFilterVal, appliedParams.filterAlpha)
  }
  // 去直流+抑漂移：对滤波后的平滑信号做基线追踪
  return removeDCAndDriftWithStep(lastFilterVal)
}

function removeDCAndDriftWithStep(value: number) {
  baselineQueue.push(value)
  if (baselineQueue.length > baselineWindow) {
    baselineQueue.shift()
  }
  const mean = baselineQueue.reduce((acc, cur) => acc + cur, 0) / baselineQueue.length
  smoothBaseline.value += appliedParams.dcCompensationStep * (mean - smoothBaseline.value)
  return value - smoothBaseline.value
}

/**
 * 将信号值映射为画布 Y 坐标
 * 与 btsentest抑制漂移200hz.html 一致：
 *   scale = (waveAreaHeight / yStep) * amplitudeRatio
 *   y = centerY + value * scale
 * 去直流后信号以 0 为中心，yStep 越大波形越小，amplitudeRatio 为额外振幅系数
 */
function valueToY(value: number, waveAreaY: number, waveAreaHeight: number) {
  const centerY = waveAreaY + waveAreaHeight / 2
  const scale = (waveAreaHeight / appliedParams.yStep) * appliedParams.amplitudeRatio
  return centerY + value * scale
}

/**
 * 初始化绘制：画布背景 + 网格 + 刻度，数据到达前就显示
 */
function drawCanvasBackground() {
  if (!ctx) return
  const w = canvasWidth.value
  const h = canvasHeight.value
  const paddingTop = 20
  const paddingBottom = 36
  const waveAreaHeight = h - paddingTop - paddingBottom
  const waveAreaY = paddingTop
  const waveAreaX = 30
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

  ctx.setFillStyle('rgba(255, 255, 255, 0.5)')
  ctx.setFontSize(11)
  ctx.setTextAlign('left')
  ctx.setTextBaseline('middle')
  const yLabels = ['100', '80', '60', '40', '20', '0']
  for (let i = 0; i < yLabels.length; i++) {
    ctx.fillText(yLabels[i], 4, waveAreaY + i * rowHeight)
  }
}

function drawLeadingDot(ctx: UniApp.CanvasContext, point: Point) {
  ctx.beginPath()
  ctx.arc(point.x, point.y, 6, 0, Math.PI * 2)
  ctx.setFillStyle('rgba(39, 224, 184, 0.24)')
  ctx.fill()

  ctx.beginPath()
  ctx.arc(point.x, point.y, 3.5, 0, Math.PI * 2)
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
}

.top-bar {
  position: absolute;
  top: 12px;
  left: 30px;
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
  box-shadow: 0 2rpx 6rpx rgba(0, 212, 164, 0.3), inset 0 1rpx 0 rgba(255, 255, 255, 0.2);
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
</style>
