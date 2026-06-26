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
      <sar-progress-circle root-class="progress-circle" :percent="progress" :thickness="10" size="70rpx" color="#00D4A4" />
    </view>

    <cover-view class="param-entry" @click="openParamPanel">
      <cover-view class="param-entry-text">调整参数</cover-view>
    </cover-view>

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
  amplitudeRatio: 1,
  xStep: 1,
  yStep: 80,
  filterAlpha: 0.22,
  dcCompensationStep: 0.015,
  verticalBaseOffset: 0,
}

const appliedParams = reactive<WaveParams>({ ...defaultParams })
const draftParams = reactive<WaveParams>({ ...defaultParams })

const paramControls: ParamControl[] = [
  { key: 'amplitudeRatio', label: '波形振幅', min: 0.5, max: 2.5, step: 0.1, digits: 1 },
  { key: 'xStep', label: 'x轴步长', min: 0.5, max: 2.5, step: 0.1, digits: 1 },
  { key: 'yStep', label: 'Y轴步长', min: 40, max: 160, step: 5, digits: 0 },
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

let drawTimer: ReturnType<typeof setInterval> | null = null
let animationTimer: ReturnType<typeof setInterval> | null = null
let baselineQueue: number[] = []
let smoothBaseline = { value: 32768 }
let lastRawVal: number | undefined
let lastFilterVal = 0
let continueErrorCount = 0
let pendingPoints: number[] = []
let cyclePoints: number[] = []
let drawProgress = 0
let lastCycleEndValue = 0

const animationInterval = 16
const bluetoothPollInterval = 40
const sampleRate = 50
const sweepDuration = 4
const baseCyclePointCount = sampleRate * sweepDuration
const baselineWindow = 150
const displayAmplitude = 2400

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

  resetWaveState()
  startDrawLoop()

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
  pendingPoints = []
  drawProgress = 0
  lastCycleEndValue = 0
  cyclePoints = [lastCycleEndValue]
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
  trimCycleForCurrentXStep()
  closeParamPanel()
  drawWaveform()
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

function getCyclePointCount() {
  return Math.max(40, Math.round(baseCyclePointCount / appliedParams.xStep))
}

function getDrawSpeed() {
  return getCyclePointCount() / ((sweepDuration * 1000) / animationInterval)
}

function trimCycleForCurrentXStep() {
  const maxPoints = getCyclePointCount()
  if (cyclePoints.length > maxPoints) {
    cyclePoints = cyclePoints.slice(0, maxPoints)
  }
  drawProgress = Math.min(drawProgress, maxPoints - 1)
}

async function startDetect() {
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
  bluetoothStore.resetDetect()
  resetWaveState()
  startDetect()
}

function goHome() {
  bluetoothStore.stopCollect()
  uni.reLaunch({ url: '/pages/index/index' })
}

function startDrawLoop() {
  stopDrawLoop()
  drawTimer = setInterval(processBluetoothData, bluetoothPollInterval)
  animationTimer = setInterval(() => {
    advanceDrawProgress()
    drawWaveform()
  }, animationInterval)
}

function stopDrawLoop() {
  if (drawTimer) {
    clearInterval(drawTimer)
    drawTimer = null
  }
  if (animationTimer) {
    clearInterval(animationTimer)
    animationTimer = null
  }
}

function processBluetoothData() {
  const points = bluetoothStore.wavePoints.slice()
  if (points.length === 0) return
  bluetoothStore.wavePoints = []
  pushWaveData(points)
}

function pushWaveData(points: number[]) {
  for (const point of points) {
    const processedPoint = normalizeWaveValue(point)
    if (processedPoint === null) continue
    pendingPoints.push(processedPoint)
  }

  const maxPendingPoints = getCyclePointCount() * 3
  if (pendingPoints.length > maxPendingPoints) {
    pendingPoints = pendingPoints.slice(pendingPoints.length - maxPendingPoints)
  }
}

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

  v = removeDCAndDriftWithStep(v)
  lastFilterVal = firstOrderFilter(v, lastFilterVal, appliedParams.filterAlpha)
  return lastFilterVal
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

function advanceDrawProgress() {
  const cyclePointCount = getCyclePointCount()
  fillCyclePoints(Math.ceil(drawProgress) + 2)

  if (cyclePoints.length > 1) {
    drawProgress = Math.min(drawProgress + getDrawSpeed(), cyclePoints.length - 1, cyclePointCount - 1)
  }

  if (drawProgress >= cyclePointCount - 1) {
    lastCycleEndValue = cyclePoints[cyclePointCount - 1]
    cyclePoints = [lastCycleEndValue]
    drawProgress = 0
    fillCyclePoints(3)
  }
}

function fillCyclePoints(targetLength: number) {
  const cyclePointCount = getCyclePointCount()
  while (cyclePoints.length < Math.min(targetLength, cyclePointCount) && pendingPoints.length > 0) {
    cyclePoints.push(pendingPoints.shift()!)
  }
}

function valueToY(value: number, waveAreaY: number, waveAreaHeight: number) {
  const centerY = waveAreaY + waveAreaHeight / 2
  const drawableHalfHeight = Math.min(waveAreaHeight * 0.48, appliedParams.yStep * 2.2)
  const compensatedValue = value + appliedParams.verticalBaseOffset
  const normalized = Math.max(-1, Math.min(1, compensatedValue / displayAmplitude))
  return centerY - normalized * drawableHalfHeight * appliedParams.amplitudeRatio
}

function getDrawablePoints(waveAreaX: number, waveAreaY: number, waveAreaWidth: number, waveAreaHeight: number): Point[] {
  const cyclePointCount = getCyclePointCount()
  const drawLength = Math.floor(drawProgress)
  const drawFraction = drawProgress - drawLength
  const stepX = waveAreaWidth / (cyclePointCount - 1)
  const values = cyclePoints.slice(0, Math.min(drawLength + 1, cyclePoints.length))

  const points = values.map((value, index) => ({
    x: waveAreaX + index * stepX,
    y: valueToY(value, waveAreaY, waveAreaHeight),
  }))

  if (cyclePoints.length > drawLength + 1 && points.length > 0) {
    const current = points[points.length - 1]
    const next = {
      x: waveAreaX + (drawLength + 1) * stepX,
      y: valueToY(cyclePoints[drawLength + 1], waveAreaY, waveAreaHeight),
    }
    points.push({
      x: current.x + (next.x - current.x) * drawFraction,
      y: current.y + (next.y - current.y) * drawFraction,
    })
  }

  return points
}

function drawWaveform() {
  const ctx = uni.createCanvasContext('waveformCanvas')
  const w = canvasWidth.value
  const h = canvasHeight.value

  const paddingTop = 20
  const paddingBottom = 36
  const waveAreaHeight = h - paddingTop - paddingBottom
  const waveAreaY = paddingTop
  const waveAreaX = 70
  const waveAreaWidth = w - waveAreaX - 8

  ctx.setFillStyle('#071527')
  ctx.fillRect(0, 0, w, h)
  drawGrid(ctx, w, waveAreaX, waveAreaY, waveAreaWidth, waveAreaHeight)

  const points = getDrawablePoints(waveAreaX, waveAreaY, waveAreaWidth, waveAreaHeight)
  console.log('===points===', points)
  if (points.length < 2) {
    ctx.draw()
    return
  }

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
  }

  const gradient = ctx.createLinearGradient(waveAreaX, 0, w, 0)
  gradient.addColorStop(0, 'rgba(14, 203, 255, 0.7)')
  gradient.addColorStop(0.55, 'rgba(39, 224, 184, 0.95)')
  gradient.addColorStop(1, 'rgba(177, 255, 116, 1)')
  ctx.setStrokeStyle(gradient)
  ctx.setLineWidth(2)
  ctx.setLineCap('round')
  ctx.setLineJoin('round')
  ctx.stroke()

  drawLeadingDot(ctx, points[points.length - 1])
  ctx.draw()
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
  const gridCols = 10
  const rowHeight = waveAreaHeight / (gridRows - 1)
  const colWidth = waveAreaWidth / gridCols

  ctx.setStrokeStyle('rgba(113, 180, 229, 0.16)')
  ctx.setLineWidth(1)
  for (let i = 0; i < gridRows; i++) {
    const y = waveAreaY + i * rowHeight
    ctx.beginPath()
    ctx.moveTo(waveAreaX, y)
    ctx.lineTo(canvasW, y)
    ctx.stroke()
  }

  for (let i = 0; i <= gridCols; i++) {
    const x = waveAreaX + i * colWidth
    ctx.beginPath()
    ctx.moveTo(x, waveAreaY)
    ctx.lineTo(x, waveAreaY + waveAreaHeight)
    ctx.stroke()
  }

  ctx.setStrokeStyle('rgba(113, 180, 229, 0.36)')
  const centerY = waveAreaY + waveAreaHeight / 2
  ctx.beginPath()
  ctx.moveTo(waveAreaX, centerY)
  ctx.lineTo(canvasW, centerY)
  ctx.stroke()

  ctx.setFillStyle('rgba(255, 255, 255, 0.68)')
  ctx.setFontSize(12)
  ctx.setTextAlign('right')
  ctx.setTextBaseline('middle')
  const yLabels = ['100', '80', '60', '40', '20', '0']
  for (let i = 0; i < yLabels.length; i++) {
    ctx.fillText(yLabels[i], waveAreaX - 10, waveAreaY + i * rowHeight)
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
  top: 15px;
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
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 21;
  display: flex;
  align-items: center;
  justify-content: center;
}


.progress-circle {
  ::v-deep .sar-progress-circle__text {
    font-size: 18rpx;
    font-weight: bold;
  }
}

.param-entry {
  position: absolute;
  right: 15rpx;
  bottom: 15rpx;
  z-index: 998;
  padding: 6rpx 18rpx;
  border: 1rpx solid rgba(39, 224, 184, 0.55);
  border-radius: 24rpx;
  background: rgba(5, 22, 39, 0.76);
}

.param-entry-text {
  color: #dffdf7;
  font-size: 14rpx;
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
