<template>
  <view>
    <template v-if="items.length">
      <view v-for="item in items" :key="item.key" class="type-group">
        <text class="result-value">{{ item.name }}</text>
        <view v-for="section in item.sections" :key="section.key" class="detail-card">
          <view class="detail-title">
            <image class="detail-icon" :src="section.icon" mode="aspectFit" />
            <text>{{ section.title }}</text>
          </view>
          <view class="detail-divider" />
          <text class="detail-text">{{ section.content }}</text>
        </view>
      </view>
    </template>
    <text v-else class="empty-result">暂无体质结果</text>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  items: any[]
}>()
</script>
