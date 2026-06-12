<template>
  <view class="emotion-page">
    <image class="page-bg" :src="backgroundImage" mode="scaleToFill" />
    <view class="emotion-list">
      <view v-for="item in tests" :key="item.id" class="emotion-button" @click="openTest(item)">
        <image class="button-bg" :src="buttonImage" mode="scaleToFill" />
        <text>{{ item.title }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import backgroundImage from '../assets/health-assessment/emotion-test/bg.jpg'
import buttonImage from '../assets/health-assessment/emotion-test/btn.png'

definePage({ style: { navigationBarTitleText: '情绪测评' } })

const tests = [
  { title: '不耐烦测试', id: 18 },
  { title: '易怒测试', id: 33 },
  { title: '焦虑测试', id: 36 },
  { title: '抑郁测试', id: 32 },
  { title: '压力测试', id: 20 },
]

function openTest(item: { title: string, id: number }) {
  uni.navigateTo({
    url: `/pages-health/health-assessment/emotion-question?id=${item.id}&title=${encodeURIComponent(item.title)}`,
  })
}
</script>

<style scoped>
.emotion-page {
  position: relative;
  min-height: 100vh;
  padding: 20vh 112rpx 80rpx;
  background: #f6f0e8;
  overflow: hidden;
  box-sizing: border-box;
}
.page-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.emotion-list {
  position: relative;
  z-index: 1;
}
.emotion-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 122rpx;
  margin-bottom: 42rpx;
}
.button-bg {
  width: 100%;
  height: 100%;
}
.emotion-button text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #14b2ba;
  font-size: 36rpx;
  font-weight: 700;
}
</style>
