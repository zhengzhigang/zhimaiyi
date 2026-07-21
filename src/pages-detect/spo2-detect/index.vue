<template>
  <view>
    <view class="spo2-page">
      <!-- 顶部：数据显示区域（水平排列） -->
      <view class="data-section">
        <view class="data-card">
          <view class="data-label">心率</view>
          <view class="data-value">
            <text class="value-number">{{ heartRate }}</text>
            <text class="value-unit">bpm</text>
          </view>
        </view>
        <view class="data-card">
          <view class="data-label">血氧</view>
          <view class="data-value">
            <text class="value-number">{{ spo2 }}</text>
            <text class="value-unit">%</text>
          </view>
        </view>
      </view>

      <!-- 中间：状态提示 -->
      <view class="status-container">
        <text class="status-text">{{ statusText }}</text>
      </view>

      <!-- 底部：操作按钮（水平排列） -->
      <view class="btn-container">
        <view
          class="action-btn start-btn"
          :class="{ 'action-btn--disabled': isDetecting }"
          @click="startDetect"
        >
          <text class="action-btn-text">{{ connectLoading ? '连接中...' : '开始检测' }}</text>
        </view>
        <view
          class="action-btn stop-btn"
          :class="{ 'action-btn--disabled': !isDetecting }"
          @click="stopDetect"
        >
          <text class="action-btn-text">停止检测</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup name="Spo2Detect">
import { ref, computed, watch } from 'vue'
import { onUnload } from '@dcloudio/uni-app'
import { useBluetoothStore } from '@/store/bluetooth'

const bluetoothStore = useBluetoothStore()

const connectLoading = ref(false)

// 从 store 获取心率和血氧数据
const heartRate = computed(() => bluetoothStore.heartRate)
const spo2 = computed(() => bluetoothStore.spo2)
const isDetecting = computed(() => bluetoothStore.isDetecting)
const isConnected = computed(() => bluetoothStore.isConnected)

// 状态文本
const statusText = computed(() => {
  if (connectLoading.value) return '正在连接设备...'
  if (isDetecting.value) return '检测中...'
  if (!isConnected.value) return '请连接设备后开始检测'
  return '准备就绪'
})

// 监听心率血氧数据变化，更新显示
watch(
  () => [bluetoothStore.heartRate, bluetoothStore.spo2],
  ([newHR, newSpo2]) => {
    console.log('心率血氧更新:', newHR, newSpo2)
  },
)

// 开始检测
const startDetect = async () => {
  if (isDetecting.value || connectLoading.value) return

  // 如果未连接，先连接设备
  if (!isConnected.value) {
    connectLoading.value = true
    try {
      const connected = await bluetoothStore.initAndConnect()
      connectLoading.value = false
      if (!connected) {
        uni.showModal({
          title: '连接失败',
          content: '蓝牙设备连接失败，请检查蓝牙是否开启，是否重新尝试连接？',
          success: (res) => {
            if (res.confirm) {
              startDetect()
            }
          },
        })
        return
      }
    } catch (err) {
      connectLoading.value = false
      uni.showToast({ title: '连接失败', icon: 'none' })
      return
    }
  }

  // 开始检测（血氧模式，不上传数据）
  uni.showToast({ title: '开始检测', icon: 'success' })
  await bluetoothStore.startDetect('quick', true)
}

// 停止检测
const stopDetect = async () => {
  if (!isDetecting.value) return
  await bluetoothStore.stopCollect()
  uni.showToast({ title: '检测已停止', icon: 'none' })
}

// 页面卸载时清理
onUnload(() => {
  if (isDetecting.value) {
    bluetoothStore.stopCollect()
  }
})
</script>

<style scoped>
.spo2-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 16rpx 40rpx;
  background-color: #21a1ae;
  box-sizing: border-box;
}

/* 顶部数据区域 */
.data-section {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 60rpx;
  padding: 20rpx 0;
}

.data-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16rpx 40rpx;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 12rpx;
  min-width: 180rpx;
}

.data-label {
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 6rpx;
}

.data-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
}

.value-number {
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
  margin-right: 4rpx;
}

.value-unit {
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.7);
}

/* 中间状态提示 */
.status-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.status-text {
  font-size: 18rpx;
  color: #ffffff;
  text-align: center;
  padding: 10rpx 28rpx;
}

/* 底部按钮区域 */
.btn-container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 40rpx;
  padding: 16rpx 0 20rpx;
}

.action-btn {
  width: 200rpx;
  height: 48rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.action-btn:active {
  transform: scale(0.95);
}

.start-btn {
  background-color: #6849fe;
}

.stop-btn {
  background-color: #ff6b6b;
}

.action-btn--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.action-btn-text {
  font-size: 18rpx;
  font-weight: bold;
  color: #ffffff;
}
</style>
