<template>
  <view class="page">
    <view class="hero">
      <text class="page-title">健康管理</text>
      <view class="decor decor-back" />
      <view class="decor decor-front" />

      <view class="card-row">
        <view v-for="card in cards" :key="card.type" class="health-card" @click="handleCard(card.type)">
          <view class="card-title-row">
            <view class="card-icon">
              {{ card.type === 'constitution' ? '✦' : '⌁' }}
            </view>
            <text class="card-title">{{ card.title }}</text>
          </view>
          <text class="card-value">{{ card.value }}</text>
        </view>
      </view>
    </view>

    <view class="content">
      <view v-if="bodyIndexes.length" class="index-grid">
        <view
          v-for="item in bodyIndexes"
          :key="item.id"
          class="index-card"
          @click="openBodyIndex(item)"
        >
          <view class="index-value-row">
            <text class="index-value">{{ item.value }}</text>
            <text v-if="item.symbol" class="index-symbol">{{ item.symbol }}</text>
          </view>
          <view class="index-title-row">
            <image v-if="item.icon" class="index-icon" :src="item.icon" mode="aspectFit" />
            <view v-else class="index-icon fallback">
              ⌁
            </view>
            <text class="index-title">{{ item.title }}</text>
          </view>
          <text class="index-status" :class="item.statusClass">{{ item.statusText }}</text>
        </view>
      </view>
      <view v-else-if="!loading" class="empty">
        暂无健康指标
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user'
import { getBodyIndexHistoryList, getHealthSummary } from './api'
import { buildBodyIndexes, showError } from './shared'

definePage({
  style: {
    navigationBarTitleText: '健康管理',
  },
})

const userStore = useUserStore()
const loading = ref(false)
const constitutionId = ref<number | string>('')
const pulseDiagnosisId = ref<number | string>('')
const cards = ref([
  { type: 'constitution', title: '体质', value: '未检测' },
  { type: 'pulse', title: '脉象', value: '未检测' },
])
const bodyIndexes = ref<any[]>([])

onLoad(fetchHealthSummary)

async function fetchHealthSummary() {
  const userId = userStore.userInfo.id
  if (!userId) {
    showError('用户信息不存在')
    return
  }

  loading.value = true
  try {
    const res = await getHealthSummary(userId)
    const detail = res.data || {}
    const constitution = detail.constitutionVo || {}
    constitutionId.value = constitution.id || ''
    pulseDiagnosisId.value = detail.pulseDiagnosisId || ''
    cards.value = [
      { type: 'constitution', title: '体质', value: constitution.name || '未检测' },
      { type: 'pulse', title: '脉象', value: detail.pulseDiagnosisName || '未检测' },
    ]
    bodyIndexes.value = pulseDiagnosisId.value
      ? buildBodyIndexes((await getBodyIndexHistoryList(pulseDiagnosisId.value)).data || [])
      : []
  }
  catch (error) {
    console.warn('获取健康管理信息失败', error)
    bodyIndexes.value = []
  }
  finally {
    loading.value = false
  }
}

function handleCard(type: string) {
  if (type === 'constitution') {
    if (!constitutionId.value) {
      showError('体质暂未检测')
      return
    }
    uni.navigateTo({
      url: `/pages-health/health-management/constitution-detail?id=${constitutionId.value}`,
    })
    return
  }
  if (!pulseDiagnosisId.value) {
    showError('脉象暂未检测')
    return
  }
  uni.navigateTo({
    url: `/pages-health/health-management/pulse-result?pulseId=${pulseDiagnosisId.value}`,
  })
}

function openBodyIndex(item: any) {
  if (!pulseDiagnosisId.value)
    return
  uni.navigateTo({
    url: `/pages-health/health-management/body-index-detail?pulseId=${pulseDiagnosisId.value}&indexLabel=${item.indexLabel}&id=${item.rawId}`,
  })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #f7f6fb;
}
.hero {
  position: relative;
  min-height: 320rpx;
  padding: 92rpx 24rpx 36rpx;
  border-radius: 0 0 46rpx 46rpx;
  background: linear-gradient(180deg, #28c9cf, #18adb6);
  overflow: hidden;
  box-sizing: border-box;
}
.page-title {
  position: relative;
  z-index: 2;
  color: #fff;
  font-size: 48rpx;
  font-weight: 700;
}
.decor {
  position: absolute;
  right: 30rpx;
  top: 120rpx;
  width: 120rpx;
  height: 86rpx;
  border-radius: 10rpx;
  background: rgba(255, 255, 255, 0.16);
  transform: rotate(12deg);
}
.decor-back {
  right: 78rpx;
  top: 104rpx;
}
.card-row {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 16rpx;
  margin-top: 54rpx;
}
.health-card {
  flex: 1;
  height: 148rpx;
  padding: 30rpx 24rpx;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 10rpx 24rpx rgba(21, 121, 128, 0.16);
  box-sizing: border-box;
}
.card-title-row,
.index-title-row,
.index-value-row {
  display: flex;
  align-items: center;
}
.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34rpx;
  height: 34rpx;
  border-radius: 50%;
  color: #fff;
  background: #36c3c9;
  font-size: 22rpx;
}
.card-title {
  margin-left: 10rpx;
  color: #12aeba;
  font-size: 30rpx;
  font-weight: 600;
}
.card-value {
  display: block;
  margin-top: 18rpx;
  color: #222;
  font-size: 28rpx;
}
.content {
  padding: 28rpx 22rpx 40rpx;
}
.index-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.index-card {
  width: calc((100% - 16rpx) / 2);
  min-height: 176rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 10rpx 26rpx rgba(38, 44, 58, 0.12);
  box-sizing: border-box;
}
.index-value {
  max-width: 150rpx;
  overflow: hidden;
  color: #333;
  font-size: 48rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.index-symbol {
  margin-left: 8rpx;
  color: #333;
  font-size: 25rpx;
}
.index-title-row {
  margin-top: 20rpx;
}
.index-icon {
  width: 38rpx;
  height: 38rpx;
}
.fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  background: #23bfca;
}
.index-title {
  margin-left: 10rpx;
  overflow: hidden;
  color: #666;
  font-size: 28rpx;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.index-status {
  display: block;
  margin-top: 10rpx;
  font-size: 34rpx;
}
.normal {
  color: #00c853;
}
.warning {
  color: #ef7d45;
}
.high {
  color: #d81e06;
}
.empty {
  padding-top: 180rpx;
  color: #888;
  text-align: center;
}
</style>
