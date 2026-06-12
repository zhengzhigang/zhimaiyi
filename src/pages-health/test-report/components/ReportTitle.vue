<template>
  <view class="ornament-title">
    <image class="title-ornament" :src="titleLeft" mode="scaleToFill" />
    <slot />
    <image class="title-ornament" :src="titleRight" mode="scaleToFill" />
  </view>
</template>

<script setup lang="ts">
import titleLeft from '../../assets/health-report/check-report/title-left.png'
import titleRight from '../../assets/health-report/check-report/title-right.png'
</script>

<style scoped>
.ornament-title {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 38rpx 0 28rpx;
  color: #2e2521;
  font-size: 27rpx;
  font-weight: 700;
  gap: 18rpx;
  letter-spacing: 14rpx;
  white-space: nowrap;
}

.title-ornament {
  flex: 1;
  min-width: 0;
  height: 22rpx;
}
</style>
