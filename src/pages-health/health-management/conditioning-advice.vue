<template>
  <view class="advice-page">
    <view v-if="!loading && !adviceList.length" class="empty">
      暂无调理建议
    </view>
    <view v-for="item in adviceList" :key="item.key" class="advice-card">
      <view class="card-header">
        <image class="advice-icon" :src="item.icon" mode="aspectFit" />
        <text class="card-title">{{ item.title }}</text>
      </view>
      <text class="card-content">{{ item.content }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { getConditioningSuggestion, getSuggestionList } from './api'
import { buildAdviceList, showError } from './shared'

definePage({
  style: {
    navigationBarTitleText: '调理建议',
    navigationBarBackgroundColor: '#f3f3f8',
  },
})

const loading = ref(false)
const adviceList = ref<any[]>([])

onLoad(async (options) => {
  const constitutionId = options?.constitutionId
  let typeId = options?.typeId
  if (!typeId && !constitutionId) {
    showError('体质参数错误')
    return
  }
  loading.value = true
  try {
    if (!typeId) {
      const types = (await getSuggestionList(constitutionId)).data || []
      typeId = types[0]?.typeId
    }
    adviceList.value = typeId
      ? buildAdviceList((await getConditioningSuggestion(typeId)).data || {})
      : []
  }
  catch (error) {
    console.warn('获取调理建议失败', error)
  }
  finally {
    loading.value = false
  }
})
</script>

<style scoped>
.advice-page {
  min-height: 100vh;
  padding: 42rpx 38rpx;
  background: #f3f3f8;
  box-sizing: border-box;
}
.empty {
  padding-top: 160rpx;
  color: #888;
  text-align: center;
}
.advice-card {
  margin-bottom: 38rpx;
  padding: 56rpx 44rpx 48rpx;
  border-radius: 34rpx;
  background: #fff;
}
.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 34rpx;
}
.advice-icon {
  width: 42rpx;
  height: 42rpx;
  margin-right: 18rpx;
}
.card-title {
  color: #111;
  font-size: 34rpx;
  font-weight: 700;
}
.card-content {
  display: block;
  color: #2d2d2d;
  font-size: 31rpx;
  line-height: 1.72;
  text-align: justify;
  white-space: pre-wrap;
}
</style>
