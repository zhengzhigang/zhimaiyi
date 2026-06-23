<template>
  <LandscapePage>
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
        <sar-progress-circle :percent="progress" :thickness="10" size="80" color="#00D4A4" />
      </view>
    </view>
  </LandscapePage>
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
  left: '30px',
  width: `${canvasWidth.value}px`,
  height: `${canvasHeight.value}px`,
}))

let drawTimer: ReturnType<typeof setInterval> | null = null
let baselineQueue: number[] = []
let smoothBaseline = { value: 32768 }
let lastFilterVal = 0
let continueErrorCount = 0
let currentPoints: number[] = []
let currentX = 0

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
  console.log('startDetect', mode.value)
  await bluetoothStore.startDetect(mode.value)
}

function retryDetect() {
  bluetoothStore.resetDetect()
  currentPoints = []
  currentX = 0
  startDetect()
}

function goHome() {
  bluetoothStore.stopCollect()
  uni.reLaunch({ url: '/pages/index/index' })
}

function startDrawLoop() {
  stopDrawLoop()
  drawTimer = setInterval(() => {
    processNewData()
    drawWaveform()
  }, 50)
}

function stopDrawLoop() {
  if (drawTimer) {
    clearInterval(drawTimer)
    drawTimer = null
  }
}

function processNewData() {
  const points = bluetoothStore.wavePoints
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
    
    if (currentPoints.length >= canvasWidth.value) {
      currentPoints = []
      currentX = 0
    }
    currentPoints.push(lastFilterVal)
  }
}

function drawWaveform() {
  const ctx = uni.createCanvasContext('waveformCanvas')
  const w = canvasWidth.value
  const h = canvasHeight.value
  
  // y轴刻度区域宽度
  const yAxisWidth = 50
  // 波形绘制区域
  const waveAreaX = yAxisWidth
  const waveAreaWidth = w - yAxisWidth
  const waveAreaHeight = h
  
  // 绘制背景（深绿色）
  ctx.setFillStyle('#0a4a48')
  ctx.fillRect(0, 0, w, h)
  
  // 绘制y轴刻度
  ctx.setFillStyle('rgba(255, 255, 255, 0.7)')
  ctx.setFontSize(12)
  ctx.setTextAlign('right')
  ctx.setTextBaseline('middle')
  
  const yLabels = ['100', '80', '60', '40', '20', '0']
  const labelCount = yLabels.length
  
  for (let i = 0; i < labelCount; i++) {
    const y = (waveAreaHeight / (labelCount - 1)) * i
    ctx.fillText(yLabels[i], yAxisWidth - 10, y)
  }
  
  // 绘制水平网格线
  ctx.setStrokeStyle('rgba(255, 255, 255, 0.3)')
  ctx.setLineWidth(1)
  
  for (let i = 0; i < labelCount; i++) {
    const y = (waveAreaHeight / (labelCount - 1)) * i
    ctx.beginPath()
    ctx.moveTo(waveAreaX, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
  
  if (currentPoints.length < 2) {
    ctx.draw()
    return
  }
  
  const minVal = Math.min(...currentPoints)
  const maxVal = Math.max(...currentPoints)
  const range = maxVal - minVal || 1
  
  // 计算波形点坐标
  const stepX = waveAreaWidth / Math.max(currentPoints.length, 1)
  const amplitude = waveAreaHeight * 0.85
  
  // 绘制波形（白色线条）
  ctx.beginPath()
  
  for (let i = 0; i < currentPoints.length; i++) {
    const normalized = (currentPoints[i] - minVal) / range
    const y = waveAreaHeight - (normalized * amplitude) - (waveAreaHeight * 0.075)
    const x = waveAreaX + i * stepX
    
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  
  ctx.setStrokeStyle('#ffffff')
  ctx.setLineWidth(2)
  ctx.setLineCap('round')
  ctx.setLineJoin('round')
  ctx.stroke()
  
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
  height: 100%;
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
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 4rpx;
}

.waveform-canvas {
  z-index: 10;
}

.progress-center {
  position: absolute;
  top: 170rpx;
  left: 50%;
  transform: translateX(-50%);
  z-index: 21;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
