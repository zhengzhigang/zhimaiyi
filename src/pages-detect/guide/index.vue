<template>
  <LandscapePage>
    <view class="guide-page">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">←</text>
        <text class="back-text">返回</text>
      </view>

      <view class="image-container">
        <image class="step-image" src="/static/images/detect/step1.png" mode="aspectFit" />
        <image class="step-image" src="/static/images/detect/step2.png" mode="aspectFit" />
        <image class="step-image" src="/static/images/detect/step3.png" mode="aspectFit" />
        <image class="step-image" src="/static/images/detect/step4.png" mode="aspectFit" />
      </view>

      <view class="tip-container">
        <text class="tip-text">请按照提示将手指放置在传感器，</text>
        <text class="tip-text">然后点击开始检测</text>
      </view>

      <view class="start-btn" :class="{ 'start-btn--loading': loading }" @click="startDetect">
        <text class="start-btn-text">{{ loading ? '连接中...' : '开始检测' }}</text>
      </view>
    </view>
  </LandscapePage>
</template>

<script lang="ts" setup name="Guide">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import LandscapePage from '@/components/layout/LandscapePage.vue'
import { useBluetoothStore } from '@/store/bluetooth'

const bluetoothStore = useBluetoothStore()
const mode = ref<'quick' | 'full'>('quick')
const loading = ref(false)

onLoad((options) => {
  if (options?.mode) {
    mode.value = options.mode === 'full' ? 'full' : 'quick'
  }
})

const goBack = () => {
  uni.navigateBack()
}

const startDetect = () => {
  if (loading.value) return
  // if (!bluetoothStore.isConnected) {
  //   uni.showToast({
  //     title: '请正确连接检测设备后检测！',
  //     icon: 'none',
  //   })
  //   return
  // }

  if (!bluetoothStore.isConnected) {
    tryConnect()
    return
  }

  navigateToDetect()
}

const tryConnect = () => {
  loading.value = true
  // 真机上需要使用设备名称匹配，不能用 MAC 地址
  // 可选：传入设备名称关键字如 'Redmi'、'AirDots'、'PULSE' 等
  // 传空则连接扫描到的第一个设备
  bluetoothStore.initAndConnect('0A49855F-C3D9-498B-234D-CCB9FD82EFC9').then(() => {
    loading.value = false
    if (bluetoothStore.isConnected) {
      navigateToDetect()
    } else {
      uni.showModal({
        title: '连接失败',
        content: '蓝牙设备连接失败，是否重新尝试连接？',
        success: (res) => {
          if (res.confirm) {
            tryConnect()
          }
        },
      })
    }
  })
}

const navigateToDetect = () => {
  uni.navigateTo({
    url: `/pages-detect/detect/index?mode=${mode.value}`,
  })
}
</script>

<style scoped>
.guide-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24rpx 32rpx;
  background-color: #148a86;
  box-sizing: border-box;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 16rpx;
  padding: 12rpx 20rpx;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 12rpx;
  align-self: flex-start;
}

.back-icon {
  font-size: 32rpx;
  color: #ffffff;
}

.back-text {
  font-size: 28rpx;
  color: #ffffff;
}

.image-container {
  flex: 1;
  display: flex;
  flex-direction: row;
  gap: 16rpx;
  margin: 16rpx 0;
  justify-content: center;
  align-items: center;
}

.step-image {
  width: 22%;
  height: 80%;
  border-radius: 12rpx;
  background-color: #ffffff;
}

.tip-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20rpx 0;
}

.tip-text {
  font-size: 28rpx;
  color: #ffffff;
  line-height: 1.6;
}

.start-btn {
  align-self: center;
  width: 320rpx;
  height: 100rpx;
  background-color: #9b59b6;
  border-radius: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
}

.start-btn:active {
  background-color: #8e44ad;
}

.start-btn--loading {
  opacity: 0.7;
  pointer-events: none;
}

.start-btn-text {
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
}
</style>
