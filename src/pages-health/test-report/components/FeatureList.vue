<template>
  <view class="feature-list">
    <view v-for="item in items" :key="item.title" class="feature-item">
      <view class="capsule-title">
        {{ item.title }}
      </view>
      <text>{{ item.content || '暂无建议' }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  items: Array<{ title: string, content: string }>
}>()
</script>

<style scoped>
.feature-item {
  margin-bottom: 30rpx;
}

.feature-item text {
  display: block;
  padding: 10rpx 8rpx 0;
  font-size: 21rpx;
  line-height: 1.8;
  text-align: justify;
  white-space: pre-wrap;
}

.capsule-title {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 150rpx;
  height: 30rpx;
  padding: 0 26rpx;
  border: 2rpx solid #e3ad92;
  border-radius: 99rpx;
  color: #fff;
  background: #d9a087;
  font-size: 17rpx;
  box-sizing: border-box;
}
</style>
