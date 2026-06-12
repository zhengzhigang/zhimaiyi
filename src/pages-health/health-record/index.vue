<template>
  <view class="record-page">
    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="tab"
        :class="{ active: activeTab === tab.value }"
        @click="handleTab(tab.value)"
      >
        {{ tab.label }}
      </view>
    </view>

    <view class="content">
      <view
        v-for="record in records"
        :key="`${record.type}-${record.id}`"
        class="record-card"
        @click="openRecord(record)"
      >
        <view class="record-main">
          <view class="record-title-row">
            <view class="date-badge">
              <text>{{ record.dateMonth }}</text>
              <view class="date-divider" />
              <text>{{ record.dateDay }}</text>
            </view>
            <text class="record-title">{{ record.title }}</text>
          </view>
          <view class="time-row">
            <text class="time-label">检测时间：</text>
            <text class="time-value">{{ record.testTime }}</text>
          </view>
        </view>
        <view v-if="record.type === 'constitution'" class="mood-icon">
          <i class="eye left" />
          <i class="eye right" />
          <i class="mouth" />
        </view>
      </view>

      <text v-if="!loading" class="empty-text">
        {{ records.length ? '没有更多了~' : '暂无数据' }}
      </text>
    </view>

    <view class="bottom-bar">
      <button
        v-if="activeTab === 'pulse'"
        class="self-test-button"
        :loading="loading"
        :disabled="loading"
        @click="fetchRecords()"
      >
        获取最新数据
      </button>
      <button v-else class="self-test-button" @click="openSelfTest">
        {{ actionText }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { constitutionList, dailyList, emotionList, pulseList } from '@/api/health'
import { useUserStore } from '@/store/user'

definePage({
  style: {
    navigationBarTitleText: '健康档案',
    enablePullDownRefresh: true,
  },
})

type TabValue = 'constitution' | 'pulse' | 'daily' | 'emotion'

interface HealthRecord {
  id: number | string
  type: TabValue
  title: string
  testTime: string
  dateMonth: string
  dateDay: string
  score?: number
}

const tabs: Array<{ label: string, value: TabValue }> = [
  { label: '体质诊断', value: 'constitution' },
  { label: '脉象诊断', value: 'pulse' },
  { label: '日常表现', value: 'daily' },
  { label: '情绪测评', value: 'emotion' },
]

const userStore = useUserStore()
const activeTab = ref<TabValue>('constitution')
const records = ref<HealthRecord[]>([])
const loading = ref(false)
const hasLoaded = ref(false)

const actionText = computed(() => {
  if (activeTab.value === 'daily')
    return '日常表现测试'
  if (activeTab.value === 'emotion')
    return '情绪测评'
  return '体质问卷自测'
})

onLoad(() => fetchRecords())
onShow(() => {
  if (hasLoaded.value)
    fetchRecords(false)
})
onPullDownRefresh(async () => {
  await fetchRecords(false)
  uni.stopPullDownRefresh()
})

function handleTab(value: TabValue) {
  activeTab.value = value
  fetchRecords()
}

async function fetchRecords(showLoading = true) {
  if (!userStore.userInfo.id) {
    uni.showToast({ title: '用户信息不存在', icon: 'none' })
    return
  }
  loading.value = true
  if (showLoading)
    uni.showLoading({ title: '加载中', mask: true })
  try {
    if (activeTab.value === 'constitution') {
      const res = await constitutionList({ page: 1, size: 20 })
      records.value = buildConstitutionRecords(Array.isArray(res.data) ? res.data : [])
    }
    else if (activeTab.value === 'pulse') {
      const res = await pulseList({ page: 1, size: 10 })
      records.value = buildPulseRecords(Array.isArray(res.data?.historyList) ? res.data.historyList : [])
    }
    else if (activeTab.value === 'daily') {
      const res = await dailyList({ page: 1, size: 20 })
      records.value = buildDailyRecords(Array.isArray(res.data) ? res.data : [])
    }
    else {
      const res = await emotionList({ page: 1, size: 20 })
      records.value = buildEmotionRecords(Array.isArray(res.data) ? res.data : [])
    }
  }
  catch (error) {
    console.warn('获取健康档案列表失败', error)
    records.value = []
  }
  finally {
    loading.value = false
    hasLoaded.value = true
    if (showLoading)
      uni.hideLoading()
  }
}

function parseDateParts(value: unknown) {
  const match = String(value || '').match(/^\d{4}-(\d{2})-(\d{2})/)
  return {
    dateMonth: match?.[1] || '--',
    dateDay: match?.[2] || '--',
  }
}

function formatBeijingTime(value: unknown) {
  if (!value)
    return ''
  const text = String(value)
  const timestamp = Date.parse(text)
  if (!Number.isFinite(timestamp) || !/(?:Z|[+-]\d{2}:\d{2})$/i.test(text))
    return text.replace('T', ' ').replace(/\.\d{3}$/, '')
  const date = new Date(timestamp + 8 * 60 * 60 * 1000)
  const pad = (number: number) => String(number).padStart(2, '0')
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
}

function buildConstitutionRecords(list: any[]): HealthRecord[] {
  return list.map(item => ({
    ...parseDateParts(item.addDateStr),
    id: item.id,
    type: 'constitution',
    title: item.qualityTypeName || '暂无体质结果',
    testTime: item.addDateStr || '',
  }))
}

function buildPulseRecords(list: any[]): HealthRecord[] {
  return list.map(item => ({
    ...parseDateParts(item.diagnosisTimeStr),
    id: item.id,
    type: 'pulse',
    title: item.pulseManifestationName || '暂无脉象结果',
    testTime: item.diagnosisTimeStr || '',
  }))
}

function buildDailyRecords(list: any[]): HealthRecord[] {
  return list.map((item) => {
    const testTime = formatBeijingTime(item.addTime)
    return {
      ...parseDateParts(testTime),
      id: item.id,
      type: 'daily',
      title: '日常表现',
      testTime,
    }
  })
}

function buildEmotionRecords(list: any[]): HealthRecord[] {
  return list.map(item => ({
    ...parseDateParts(item.addTime),
    id: item.id,
    type: 'emotion',
    title: item.level || '情绪测评',
    testTime: item.addTime || '',
    score: item.score,
  }))
}

function openRecord(record: HealthRecord) {
  if (record.type === 'constitution') {
    uni.navigateTo({ url: `/pages-health/health-management/constitution-detail?id=${record.id}` })
    return
  }
  if (record.type === 'pulse') {
    uni.navigateTo({ url: `/pages-health/health-management/pulse-result?pulseId=${record.id}` })
    return
  }
  if (record.type === 'emotion') {
    uni.navigateTo({ url: `/pages-health/test-report/emotion-report?id=${record.id}` })
    return
  }
  uni.navigateTo({ url: `/pages-health/health-assessment/daily-test?mode=view&id=${record.id}` })
}

function openSelfTest() {
  if (activeTab.value === 'constitution') {
    uni.navigateTo({ url: '/pages-health/health-assessment/constitution-test' })
    return
  }
  if (activeTab.value === 'daily') {
    uni.navigateTo({ url: '/pages-health/health-assessment/daily-test' })
    return
  }
  uni.navigateTo({ url: '/pages-health/health-assessment/emotion-test' })
}
</script>

<style scoped lang="scss">
.record-page {
  min-height: 100vh;
  padding-bottom: 140rpx;
  background: #f3f3f3;
}

.tabs {
  display: flex;
  height: 78rpx;
  background: #fff;
  box-shadow: 0 4rpx 16rpx rgba(23, 32, 51, 0.04);
}

.tab {
  position: relative;
  flex: 1;
  height: 78rpx;
  color: #686868;
  font-size: 28rpx;
  line-height: 78rpx;
  text-align: center;
}

.tab.active {
  color: #12aeba;
  font-weight: 600;
}

.tab.active::after {
  position: absolute;
  right: 34rpx;
  bottom: 0;
  left: 34rpx;
  height: 5rpx;
  border-radius: 99rpx;
  background: #16b7c0;
  content: '';
}

.content {
  padding: 24rpx 40rpx 0;
}

.record-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  min-height: 156rpx;
  margin-bottom: 20rpx;
  padding: 44rpx 40rpx 28rpx 48rpx;
  border-radius: 34rpx;
  background: #fff;
  overflow: hidden;
  box-sizing: border-box;
}

.record-card::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 8rpx;
  background: #14b7c0;
  content: '';
}

.record-main {
  min-width: 0;
  flex: 1;
}

.record-title-row,
.time-row {
  display: flex;
  align-items: center;
}

.date-badge {
  display: flex;
  align-items: center;
  height: 38rpx;
  padding: 0 8rpx;
  border: 2rpx solid #16b7c0;
  border-radius: 8rpx;
  color: #13aeb9;
  font-size: 30rpx;
  font-weight: 600;
}

.date-divider {
  width: 2rpx;
  height: 24rpx;
  margin: 0 10rpx;
  background: #16b7c0;
}

.record-title {
  min-width: 0;
  margin-left: 12rpx;
  overflow: hidden;
  color: #13aeb9;
  font-size: 30rpx;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time-row {
  margin-top: 26rpx;
  font-size: 28rpx;
}

.time-label {
  color: #999;
}

.time-value {
  min-width: 0;
  overflow: hidden;
  color: #2c2c2c;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mood-icon {
  position: relative;
  width: 38rpx;
  height: 38rpx;
  border-radius: 50%;
  background: #52cdd1;
}

.eye {
  position: absolute;
  top: 11rpx;
  width: 5rpx;
  height: 5rpx;
  border-radius: 50%;
  background: #fff;
}

.eye.left {
  left: 10rpx;
}

.eye.right {
  right: 10rpx;
}

.mouth {
  position: absolute;
  top: 21rpx;
  left: 11rpx;
  width: 16rpx;
  height: 7rpx;
  border-bottom: 4rpx solid #fff;
  border-radius: 0 0 16rpx 16rpx;
}

.empty-text {
  display: block;
  margin-top: 64rpx;
  color: #9e9e9e;
  font-size: 28rpx;
  text-align: center;
}

.bottom-bar {
  position: fixed;
  right: 0;
  bottom: 22rpx;
  left: 0;
  display: flex;
  justify-content: center;
  padding-bottom: env(safe-area-inset-bottom);
}

.self-test-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 238rpx;
  height: 88rpx;
  padding: 0;
  border-radius: 99rpx;
  color: #fff;
  background: #59cbd1;
  font-size: 28rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 18rpx rgba(55, 181, 188, 0.24);
}

.self-test-button::after {
  border: 0;
}
</style>
