<template>
  <view class="advice-page">
    <view v-if="pulseName" class="summary">
      您当前需调理的脉象为<text class="pulse-name">{{ pulseName }}</text>，请参考以下意见进行调理
    </view>
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
import { getPulseDiagnosisInfoDetail } from './api'
import { buildAdviceList, showError } from './shared'

definePage({ style: { navigationBarTitleText: '调理建议' } })

const loading = ref(false)
const pulseName = ref('')
const adviceList = ref<any[]>([])

onLoad(async (options) => {
  if (!options?.pulseId) {
    showError('脉象参数错误')
    return
  }
  loading.value = true
  try {
    const detail = (await getPulseDiagnosisInfoDetail(options.pulseId)).data || {}
    pulseName.value = detail.pulseManifestationName || ''
    adviceList.value = buildAdviceList(detail.constitutionReportEntity || {})
  }
  catch (error) {
    console.warn('获取脉象调理建议失败', error)
  }
  finally {
    loading.value = false
  }
})
</script>

<style scoped>
.advice-page {
  min-height: 100vh;
  padding: 28rpx 38rpx 50rpx;
  background: #f3f3f8;
  box-sizing: border-box;
}
.summary {
  margin-bottom: 38rpx;
  padding: 28rpx 34rpx;
  border-radius: 24rpx;
  background: #fff;
  font-size: 30rpx;
  line-height: 1.45;
}
.pulse-name {
  color: #f18450;
}
.empty {
  padding-top: 160rpx;
  color: #888;
  text-align: center;
}
.advice-card {
  margin-bottom: 38rpx;
  padding: 56rpx 44rpx 48rpx;
  border-radius: 28rpx;
  background: #fff;
}
.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 34rpx;
}
.advice-icon {
  width: 42rpx;
  height: 44rpx;
  margin-right: 18rpx;
}
.card-title {
  font-size: 32rpx;
  font-weight: 700;
}
.card-content {
  display: block;
  font-size: 31rpx;
  line-height: 1.76;
  text-align: justify;
  white-space: pre-wrap;
}
</style>
