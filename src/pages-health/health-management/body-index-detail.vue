<template>
  <view class="detail-page">
    <view v-if="!loading && !detail" class="empty">
      暂无指标详情
    </view>
    <view v-if="detail" class="detail-card">
      <view class="history-chart">
        <health-line-chart
          :values="chartValues"
          :categories="chartCategories"
          :max="chartMax"
          :areas="chartAreas"
          show-symbol
          show-x-axis
        />
      </view>
      <view class="divider" />
      <view class="summary-row">
        <image class="summary-icon" :src="detail.icon" mode="aspectFit" />
        <view class="summary-content">
          <view class="summary-main">
            <text>{{ detail.title }}</text>
            <text class="summary-value">{{ detail.value }}</text>
          </view>
          <text class="summary-line">检测日期：{{ detail.date }}</text>
          <text class="summary-line">{{ detail.title }}正常范围：{{ detail.normalRange }}</text>
        </view>
      </view>
      <view class="analysis">
        数据分析：{{ detail.title }}{{ detail.statusText }}
      </view>
      <view class="description">
        <text class="description-title">{{ detail.title }}说明</text>
        <text class="description-text">{{ detail.describe }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import HealthLineChart from '../components/HealthLineChart.vue'
import { getBodyIndexHistoryList } from './api'
import { formatNumber, getIndexStatus, resolveBodyIndexIcon, showError } from './shared'

definePage({
  style: {
    navigationBarTitleText: '健康档案',
  },
})

const loading = ref(false)
const detail = ref<any>(null)
const chartValues = computed(() => {
  const history = detail.value?.historyValuesOfDate
  return history?.length
    ? history.map((point: any) => Number(point.bodyIndexValue) || 0)
    : detail.value
      ? [detail.value.rawValue]
      : []
})
const chartCategories = computed(() => {
  const history = detail.value?.historyValuesOfDate
  return history?.length
    ? history.map((point: any) => point.bodyIndexDate || '')
    : detail.value
      ? [detail.value.date]
      : []
})
const chartMax = computed(() => {
  const boundaries = detail.value?.boundaryValue
  return Number(boundaries?.[boundaries.length - 1]) || Math.max(100, ...chartValues.value)
})
const chartAreas = computed<Array<{ from: number, to: number, color: string }>>(() => {
  const boundaries = Array.isArray(detail.value?.boundaryValue) ? detail.value.boundaryValue : []
  const colors = Array.isArray(detail.value?.boundaryValueColor) ? detail.value.boundaryValueColor : []
  return boundaries.slice(0, -1).map((from: number, index: number) => ({
    from,
    to: Number(boundaries[index + 1]),
    color: colors[index] === 1 ? '#f1fbf4' : colors[index] === 2 ? '#fffbf3' : '#fff3f3',
  }))
})

onLoad(async (options) => {
  if (!options?.pulseId) {
    showError('指标参数错误')
    return
  }
  loading.value = true
  try {
    const list = (await getBodyIndexHistoryList(options.pulseId)).data || []
    const raw = list.find((item: any) =>
      (options.indexLabel && item.indexLabel === options.indexLabel)
      || (options.id && String(item.id) === String(options.id)),
    )
    if (raw) {
      const history = Array.isArray(raw.historyValuesOfDate) ? raw.historyValuesOfDate : []
      const latest = history[history.length - 1] || {}
      const value = latest.bodyIndexValue ?? raw.value
      detail.value = {
        ...raw,
        title: raw.title || raw.indexName || '',
        value: formatNumber(value),
        rawValue: Number(value),
        date: latest.bodyIndexDate || '',
        normalRange: `${formatNumber(raw.greenMin)} ~ ${formatNumber(raw.greenMax)}`,
        statusText: getIndexStatus(raw).text,
        icon: resolveBodyIndexIcon(raw),
      }
    }
  }
  catch (error) {
    console.warn('获取指标详情失败', error)
  }
  finally {
    loading.value = false
  }
})
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  padding: 28rpx 22rpx 56rpx;
  background: #f5f5fa;
  box-sizing: border-box;
}
.empty {
  padding-top: 220rpx;
  color: #888;
  text-align: center;
}
.detail-card {
  padding: 46rpx 32rpx 42rpx;
  border-radius: 28rpx;
  background: #fff;
  box-shadow: 0 8rpx 24rpx rgba(38, 44, 58, 0.08);
}
.history-chart {
  display: block;
  width: 100%;
  height: 462rpx;
  margin: 0 auto;
}
.divider {
  margin: 28rpx -32rpx 54rpx;
  border-top: 2rpx dashed #e1e1e1;
}
.summary-row {
  display: flex;
  align-items: center;
  padding: 0 22rpx;
}
.summary-icon {
  width: 112rpx;
  height: 112rpx;
  margin-right: 28rpx;
}
.summary-content {
  flex: 1;
}
.summary-main {
  display: flex;
  align-items: baseline;
}
.summary-value {
  margin-left: 18rpx;
  font-size: 58rpx;
}
.summary-line {
  display: block;
  margin-top: 10rpx;
  color: #969696;
  font-size: 28rpx;
}
.analysis {
  margin: 40rpx 20rpx 0;
  padding: 18rpx 22rpx;
  border-radius: 18rpx;
  color: #1cbac3;
  background: #e8fbfc;
  font-size: 30rpx;
}
.description {
  margin-top: 36rpx;
  padding: 0 20rpx;
}
.description-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
}
.description-text {
  display: block;
  margin-top: 22rpx;
  font-size: 30rpx;
  line-height: 1.78;
  text-align: justify;
  white-space: pre-wrap;
}
</style>
