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
    
    <view class="chart-container">
      <ec-canvas 
        canvas-id="waveformCanvas" 
        id="waveformCanvas"
        :ec="ec"
        class="waveform-chart"
      ></ec-canvas>
    </view>
    
    <view class="progress-center">
      <sar-progress-circle :percent="progress" :thickness="10" size="70rpx" color="#00D4A4" />
    </view>
  </view>
</template>

<script lang="ts" setup name="Detect">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useBluetoothStore } from '@/store/bluetooth'
import { removeDCAndDrift, firstOrderFilter, isWaveValueValid } from '@/utils/bluetooth/algorithms'
import * as echarts from '@/wxcomponents/ec-canvas/echarts'
import { 
  DEFAULT_FILTER_ALPHA, 
  DEFAULT_VERTICAL_BASE_OFFSET 
} from '@/utils/bluetooth/constants'

const bluetoothStore = useBluetoothStore()

const mode = ref<'quick' | 'full'>('quick')
const isConnected = computed(() => bluetoothStore.isConnected)
const progress = computed(() => bluetoothStore.collectProgress)
const isDetecting = computed(() => bluetoothStore.isDetecting)

const useMock = ref(true)

const cycleDuration = 5
const drawInterval = 50
const totalDraws = cycleDuration * 1000 / drawInterval
const pointsPerDraw = 3
const totalPoints = Math.floor(totalDraws * pointsPerDraw)

let drawTimer: ReturnType<typeof setInterval> | null = null
let baselineQueue: number[] = []
let smoothBaseline = { value: DEFAULT_VERTICAL_BASE_OFFSET }
let lastFilterVal = 55
let continueErrorCount = 0
let currentPoints: number[] = []

let chart: any = null

const ec = ref({
  lazyLoad: true,
  onInit: (canvas: any, width: number, height: number) => {
    chart = echarts.init(canvas, undefined, { width, height })
    chart.setOption(getChartOption())
    startDrawLoop()
    return chart
  }
})

onLoad((options) => {
  if (options?.mode) {
    mode.value = options.mode === 'full' ? 'full' : 'quick'
  }
})

onMounted(() => {
  startDetect()
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
  smoothBaseline.value = DEFAULT_VERTICAL_BASE_OFFSET
  lastFilterVal = 0
  continueErrorCount = 0
  currentPoints = []
  console.log('startDetect', mode.value)
  await bluetoothStore.startDetect(mode.value)
}

function retryDetect() {
  bluetoothStore.resetDetect()
  currentPoints = []
  if (chart) {
    chart.setOption({
      series: [{ data: [] }]
    })
  }
  startDetect()
}

function goHome() {
  bluetoothStore.stopCollect()
  uni.reLaunch({ url: '/pages/index/index' })
}

function getChartOption() {
  return {
    // backgroundColor: '#0a1628',
    grid: {
      left: 60,
      right: 10,
      top: 20,
      bottom: 50
    },
    xAxis: {
      type: 'value',
      show: false,
      min: 0,
      max: totalPoints
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      interval: 20,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(100, 150, 200, 0.15)'
        }
      }
    },
    series: [{
      type: 'line',
      data: [],
      smooth: true,
      symbol: 'none',
      lineStyle: {
        width: 2,
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: 'rgba(0, 200, 255, 0.6)' },
            { offset: 0.5, color: 'rgba(0, 200, 255, 0.9)' },
            { offset: 1, color: 'rgba(0, 255, 200, 1)' }
          ]
        }
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(0, 200, 255, 0.2)' },
            { offset: 1, color: 'rgba(0, 200, 255, 0.05)' }
          ]
        }
      }
    }]
  }
}

function startDrawLoop() {
  stopDrawLoop()
  
  let mockTime = 0
  const timeStep = cycleDuration / totalPoints
  
  drawTimer = setInterval(() => {
    if (useMock.value) {
      for (let i = 0; i < pointsPerDraw; i++) {
        const val = generateMockWavePoint(mockTime)
        bluetoothStore.wavePoints.push(val)
        mockTime += timeStep
        
        if (mockTime >= cycleDuration) {
          mockTime = 0
        }
      }
    }
    
    processNewData()
    updateChart()
  }, drawInterval)
}

function stopDrawLoop() {
  if (drawTimer) {
    clearInterval(drawTimer)
    drawTimer = null
  }
}

function generateMockWavePoint(t: number): number {
  const beatPeriod = 1.0
  const phase = (t % beatPeriod) / beatPeriod
  
  let value = 55
  
  if (phase < 0.15) {
    const riseProgress = phase / 0.15
    value += Math.pow(riseProgress, 0.5) * 40
  } else if (phase < 0.25) {
    const fallProgress = (phase - 0.15) / 0.1
    value += 40 * (1 - Math.pow(fallProgress, 0.8))
    value -= 8 * Math.sin(fallProgress * Math.PI)
  } else if (phase < 0.45) {
    const diastolicProgress = (phase - 0.25) / 0.2
    value += 32 * Math.exp(-Math.pow((diastolicProgress - 0.3) * 5, 2))
  } else {
    const decayProgress = (phase - 0.45) / 0.55
    value += 15 * Math.exp(-decayProgress * 3)
  }
  
  value += Math.sin(t * 0.3) * 2
  value += (Math.random() - 0.5) * 0.5
  
  return Math.round(Math.max(0, Math.min(100, value)))
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

    if (useMock.value) {
      lastFilterVal = firstOrderFilter(v, lastFilterVal, 0.15)
    } else {
      v = removeDCAndDrift(v, baselineQueue, smoothBaseline)
      lastFilterVal = firstOrderFilter(v, lastFilterVal, DEFAULT_FILTER_ALPHA)
    }
    
    if (currentPoints.length >= totalPoints) {
      currentPoints = []
      lastFilterVal = 55
    }
    currentPoints.push(lastFilterVal)
  }
}

function updateChart() {
  if (!chart || currentPoints.length === 0) return
  
  chart.setOption({
    series: [{
      data: currentPoints
    }]
  })
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

.chart-container {
  position: absolute;
  top: 80px;
  left: 70rpx;
  right: 70rpx;
  bottom: 30px;
  z-index: 10;
}

.waveform-chart {
  width: 100%;
  height: 100%;
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
