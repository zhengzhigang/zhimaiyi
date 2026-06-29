<template>
  <view>
    <view class="select-mode-page">
      <view class="header">
        <text class="title">检测模式选择</text>
      </view>

      <view class="btn-container">
        <view class="detect-btn quick-btn" @click="goToGuide('quick')">
          <text class="btn-text">快速检测</text>
        </view>

        <view class="detect-btn full-btn" @click="goToGuide('full')">
          <text class="btn-text">全面检测</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup name="SelectMode">

const goToGuide = (mode: 'quick' | 'full') => {
  uni.navigateTo({
    url: `/pages-detect/guide/index?mode=${mode}`,
  })
}
</script>

<style scoped>
.select-mode-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #148a86;
}

.header {
  margin-bottom: 80rpx;
}

.title {
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
}

.btn-container {
  display: flex;
  justify-content: space-between;
  gap: 80rpx;
  margin-bottom: 50rpx;
}

.detect-btn {
  width: 180rpx;
  height: 60rpx;
  border-radius: 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}

.detect-btn:active {
  opacity: 0.8;
}

.quick-btn {
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
}

.full-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.btn-text {
  font-size: 26rpx;
  font-weight: bold;
  color: #ffffff;
}
</style>
