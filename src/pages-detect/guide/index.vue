<template>
  <view>
    <view class="guide-page">
      <view class="image-container">
        <image v-for="(img, index) in imgs" :key="index" class="step-image" :src="img" mode="aspectFill" />
      </view>

      <view class="tip-container">
        <text class="tip-text">请按照提示将手指放置在传感器，然后点击开始检测</text>
        <text class="tip-text" style="font-size: 14rpx;">为保证顺利检测，请设置手机息屏时间不低于3分钟</text>
      </view>

      <view class="start-btn" :class="{ 'start-btn--loading': loading }" @click="startDetect">
        <text class="start-btn-text">{{ loading ? '连接中...' : '开始检测' }}</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup name="Guide">
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import { ref, watch } from 'vue'
import { useBluetoothStore } from '@/store/bluetooth'

definePage({
  style: {
    navigationBarTitleText: '检测引导',
    pageOrientation: 'landscape',
  },
})
const bluetoothStore = useBluetoothStore()
const mode = ref<'quick' | 'full'>('quick')
const loading = ref(false)

const imgs = ref([
  `${__ASSETS__}/pulse/guide-01.jpg`,
  `${__ASSETS__}/pulse/guide-02.jpg`,
  `${__ASSETS__}/pulse/guide-03.jpg`,
  `${__ASSETS__}/pulse/guide-04.jpg`,
  `${__ASSETS__}/pulse/guide-05.jpg`,
])
onLoad((options) => {
  if (options?.mode) {
    mode.value = options.mode === 'full' ? 'full' : 'quick'
  }
})

onShow(() => {
  loading.value = false
})

onUnload(() => {
  loading.value = false
})

// 监听连接状态变化，断开时自动停止 loading
watch(
  () => bluetoothStore.isConnected,
  (connected) => {
    if (!connected && loading.value) {
      loading.value = false
    }
  },
)

function startDetect() {
  if (loading.value)
    return

  if (!bluetoothStore.isConnected) {
    tryConnect()
    return
  }

  navigateToDetect()
}

function tryConnect() {
  loading.value = true
  bluetoothStore.initAndConnect().then((connected) => {
    loading.value = false
    if (connected) {
      navigateToDetect()
    }
    else {
      uni.showModal({
        title: '连接失败',
        content: '蓝牙设备连接失败，请检查蓝牙是否开启，是否重新尝试连接？',
        success: (res) => {
          if (res.confirm) {
            tryConnect()
          }
        },
      })
    }
  }).catch(() => {
    loading.value = false
    uni.showToast({ title: '连接失败', icon: 'none' })
  })
}

function navigateToDetect() {
  uni.navigateTo({
    url: `/pages-detect/detect/index?mode=${mode.value}`,
  })
}
</script>

<style scoped>
.guide-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 15rpx;
  background-color: #21a1ae;
  box-sizing: border-box;
}

.image-container {
  flex: 1;
  display: flex;
  flex-direction: row;
  gap: 0;
  margin: 16rpx 0;
  justify-content: center;
  align-items: center;
}

.step-image {
  width: 16%;
  height: 100rpx;
  background-color: #ffffff;
}

.tip-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 16rpx 0 15px 0;
}

.tip-text {
  font-size: 18rpx;
  color: #ffffff;
  line-height: 1.6;
}

.start-btn {
  align-self: center;
  width: 200rpx;
  height: 48rpx;
  margin-bottom: 10rpx;
  background-color: #6849fe;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.start-btn:active {
  background-color: #6849fe;
}

.start-btn--loading {
  opacity: 0.7;
  pointer-events: none;
}

.start-btn-text {
  font-size: 18rpx;
  font-weight: bold;
  color: #ffffff;
}
</style>
