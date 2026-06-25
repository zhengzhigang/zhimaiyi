<template>
  <!-- <LandscapePage> -->
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
        canvas-id="waveformCanvas" 
        id="waveformCanvas"
        class="waveform-canvas"
        :style="canvasStyle"
      ></canvas>
      
      <view class="progress-center">
        <sar-progress-circle :percent="progress" :thickness="10" size="70rpx" color="#00D4A4" />
      </view>
    </view>
  <!-- </LandscapePage> -->
</template>

<script lang="ts" setup name="Detect">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import LandscapePage from '@/components/layout/LandscapePage.vue'
import { useBluetoothStore } from '@/store/bluetooth'
import { removeDCAndDrift, firstOrderFilter, isWaveValueValid } from '@/utils/bluetooth/algorithms'

const bluetoothStore = useBluetoothStore()

const mode = ref<'quick' | 'full'>('quick')
const canvasWidth = ref(600)
const canvasHeight = ref(300)

const isConnected = computed(() => bluetoothStore.isConnected)
const progress = computed(() => bluetoothStore.collectProgress)
const isDetecting = computed(() => bluetoothStore.isDetecting)

const canvasStyle = computed(() => ({
  position: 'absolute',
  top: '80px',
  left: '70rpx',
  right: '70rpx',
  width: 'auto',
  height: `${canvasHeight.value}px`,
}))

let drawTimer: ReturnType<typeof setInterval> | null = null
let animationTimer: ReturnType<typeof setInterval> | null = null
let baselineQueue: number[] = []
let smoothBaseline = { value: 32768 }
let lastFilterVal = 55
let continueErrorCount = 0
let currentPoints: number[] = []
let currentX = 0
let drawProgress = 0
const animationInterval = 16

// 周期配置
const cycleDuration = 5 // 5秒一个周期
const drawInterval = 50 // 50ms 绘制一次
const totalDraws = cycleDuration * 1000 / drawInterval // 5秒内绘制次数 = 100
const pointsPerDraw = 3 // 每次绘制新增的数据点数
const totalPoints = Math.floor(totalDraws * pointsPerDraw) // 5秒内总数据点数 = 300

onLoad((options) => {
  if (options?.mode) {
    mode.value = options.mode === 'full' ? 'full' : 'quick'
  }
})

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync()
  // 横屏时 windowWidth/windowHeight 不会自动交换，取大值为宽、小值为高
  const screenW = Math.max(sysInfo.windowWidth, sysInfo.windowHeight)
  const screenH = Math.min(sysInfo.windowWidth, sysInfo.windowHeight)
  // canvas 左右距边30px，顶部距80px，底部距30px
  canvasWidth.value = screenW - 60
  canvasHeight.value = screenH - 110
  
  startDetect()
  startDrawLoop()
})

onUnmounted(() => {
  stopDrawLoop()
  bluetoothStore.stopCollect()
})

async function startDetect() {
  if (!isConnected.value) {
    uni.showModal({
      title: '提示',
      content: '蓝牙设备未连接，是否尝试连接？',
      success: (res) => {
        if (res.confirm) {
          bluetoothStore.initAndConnect('PULSE').then(() => {
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
  baselineQueue = []
  smoothBaseline.value = 32768
  lastFilterVal = 0
  continueErrorCount = 0
  currentPoints = []
  currentX = 0
  drawProgress = 0
  console.log('startDetect', mode.value)
  await bluetoothStore.startDetect(mode.value)
}

function retryDetect() {
  bluetoothStore.resetDetect()
  currentPoints = []
  currentX = 0
  drawProgress = 0
  startDetect()
}

function goHome() {
  bluetoothStore.stopCollect()
  uni.reLaunch({ url: '/pages/index/index' })
}

function startDrawLoop() {
  stopDrawLoop()
  drawTimer = setInterval(processNewData, drawInterval)
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

function advanceDrawProgress() {
  // 只在有足够数据时才推进绘制进度
  if (currentPoints.length <= drawProgress) {
    return
  }
  
  // 固定速度推进（每帧推进2个点）
  drawProgress += 2
  
  // 循环重置：到达最右端时等待新数据从头开始
  if (drawProgress >= totalPoints) {
    drawProgress = 0
    currentPoints = []
  }
}

function processNewData() {
  const points = bluetoothStore.wavePoints
  console.log('&&&&&&&', points)
  if (points.length === 0) return
  
  const newPoints = points.slice()
  bluetoothStore.wavePoints = []
  
  for (const val of newPoints) {
    let v = val
    if (!isWaveValueValid(v)) {
      continueErrorCount++
      if (continueErrorCount > 5 && currentPoints.length > 0) {
        v = currentPoints[currentPoints.length - 1]
      } else {
        continue
      }
    } else {
      continueErrorCount = 0
    }

    v = removeDCAndDrift(v, baselineQueue, smoothBaseline)
    lastFilterVal = firstOrderFilter(v, lastFilterVal, 0.3)
    
    if (currentPoints.length >= totalPoints * 2) {
      currentPoints = currentPoints.slice(currentPoints.length - totalPoints)
    }
    currentPoints.push(lastFilterVal)
  }
}

function drawWaveform() {
  const ctx = uni.createCanvasContext('waveformCanvas')
  const w = canvasWidth.value
  const h = canvasHeight.value
  
  const paddingTop = 20
  const paddingBottom = 50
  const waveAreaHeight = h - paddingTop - paddingBottom
  const waveAreaY = paddingTop
  const waveAreaWidth = w - 60
  const waveAreaX = 60
  
  // 绘制背景（深蓝色）
  ctx.setFillStyle('#0a1628')
  ctx.fillRect(0, 0, w, h)
  
  // 绘制网格线
  ctx.setStrokeStyle('rgba(100, 150, 200, 0.15)')
  ctx.setLineWidth(1)
  
  const gridRows = 6
  const gridCols = 10
  const rowHeight = waveAreaHeight / (gridRows - 1)
  const colWidth = waveAreaWidth / gridCols
  
  for (let i = 0; i < gridRows; i++) {
    const y = waveAreaY + i * rowHeight
    ctx.beginPath()
    ctx.moveTo(waveAreaX, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
  
  for (let i = 0; i <= gridCols; i++) {
    const x = waveAreaX + i * colWidth
    ctx.beginPath()
    ctx.moveTo(x, waveAreaY)
    ctx.lineTo(x, waveAreaY + waveAreaHeight)
    ctx.stroke()
  }
  
  // 中央参考线
  ctx.setStrokeStyle('rgba(100, 150, 200, 0.4)')
  const centerY = waveAreaY + waveAreaHeight / 2
  ctx.beginPath()
  ctx.moveTo(waveAreaX, centerY)
  ctx.lineTo(w, centerY)
  ctx.stroke()
  
  // 绘制 Y 轴刻度标签
  ctx.setFillStyle('rgba(255, 255, 255, 0.7)')
  ctx.setFontSize(12)
  ctx.setTextAlign('right')
  ctx.setTextBaseline('middle')
  
  const yLabels = ['100', '80', '60', '40', '20', '0']
  for (let i = 0; i < yLabels.length; i++) {
    const y = waveAreaY + i * rowHeight
    ctx.fillText(yLabels[i], waveAreaX - 10, y)
  }
  
  const drawLength = Math.floor(drawProgress)
  const drawFraction = drawProgress - drawLength
  
  const stepX = waveAreaWidth / totalPoints
  
  if (currentPoints.length < 2) {
    ctx.draw()
    return
  }
  
  // 只使用已有数据，不填充
  const displayPoints = currentPoints.slice(0, drawLength + 1)
  
  const minVal = Math.min(...displayPoints)
  const maxVal = Math.max(...displayPoints)
  const range = maxVal - minVal || 1
  const amplitude = waveAreaHeight * 0.8
  
  const points: { x: number; y: number }[] = []
  
  for (let i = 0; i < displayPoints.length; i++) {
    const normalized = (displayPoints[i] - minVal) / range
    const y = waveAreaY + waveAreaHeight - (normalized * amplitude) - (waveAreaHeight * 0.1)
    const x = waveAreaX + i * stepX
    points.push({ x, y })
  }
  
  // 插值（如果数据足够）
  if (currentPoints.length > drawLength + 1) {
    const nextVal = currentPoints[drawLength + 1]
    const nextNormalized = (nextVal - minVal) / range
    const nextY = waveAreaY + waveAreaHeight - (nextNormalized * amplitude) - (waveAreaHeight * 0.1)
    const nextX = waveAreaX + (drawLength + 1) * stepX
    
    const interpX = points[points.length - 1].x + (nextX - points[points.length - 1].x) * drawFraction
    const interpY = points[points.length - 1].y + (nextY - points[points.length - 1].y) * drawFraction
    
    points.push({ x: interpX, y: interpY })
  }
  
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
    
    const tension = 0.3
    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension
    
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
  }
  
  const gradient = ctx.createLinearGradient(waveAreaX, 0, w, 0)
  gradient.addColorStop(0, 'rgba(0, 200, 255, 0.6)')
  gradient.addColorStop(0.5, 'rgba(0, 200, 255, 0.9)')
  gradient.addColorStop(1, 'rgba(0, 255, 200, 1)')
  
  ctx.setStrokeStyle(gradient)
  ctx.setLineWidth(2)
  ctx.setLineCap('round')
  ctx.setLineJoin('round')
  ctx.stroke()
  
  if (points.length > 0) {
    const lastPoint = points[points.length - 1]
    
    ctx.beginPath()
    ctx.arc(lastPoint.x, lastPoint.y, 6, 0, Math.PI * 2)
    ctx.setFillStyle('rgba(0, 200, 255, 0.3)')
    ctx.fill()
    
    ctx.beginPath()
    ctx.arc(lastPoint.x, lastPoint.y, 4, 0, Math.PI * 2)
    ctx.setFillStyle('#00d4ff')
    ctx.fill()
    
    ctx.beginPath()
    ctx.arc(lastPoint.x, lastPoint.y, 8, 0, Math.PI * 2)
    ctx.setStrokeStyle('rgba(0, 200, 255, 0.4)')
    ctx.setLineWidth(2)
    ctx.stroke()
  }
  
  ctx.draw()
}
</script>

<style scoped>
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
}

.top-bar {
  position: absolute;
  top: 30px;
  left: 30px;
  right: 30px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 20;
}

.back-btn, .retry-btn {
  padding: 8rpx 16rpx;
}

.btn-text {
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 4rpx;
}

.waveform-canvas {
  z-index: 10;
}

.progress-center {
  position: absolute;
  top: 30rpx;
  left: 50%;
  transform: translateX(-50%);
  z-index: 21;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
