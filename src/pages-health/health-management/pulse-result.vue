<template>
  <view class="pulse-page" @click="closeTips">
    <view class="hero">
      <view class="avatar-wrap">
        <image v-if="profile.avatar" class="avatar" :src="profile.avatar" mode="aspectFill" />
        <text v-else class="avatar-text">in</text>
      </view>
      <text class="profile-name">{{ profile.name }}</text>
      <text class="profile-id">ID:{{ profile.id }}</text>
      <view class="profile-meta">
        <view><image :src="profileIcons.gender" />性别 <b>{{ profile.gender }}</b></view>
        <view><image :src="profileIcons.age" />年龄 <b>{{ profile.age }}</b></view>
      </view>
    </view>

    <view v-if="!loading && !hasData" class="empty">
      暂无脉象结果
    </view>
    <template v-if="hasData">
      <view class="section-card">
        <view class="section-title">
          <i />脉象图谱
        </view>
        <view class="pulse-chart">
          <health-line-chart :values="pulseValues" />
        </view>
        <view class="pulse-pill">
          <image :src="pulseNameIcon" mode="aspectFit" />
          <text>{{ summary.pulseName }}</text>
        </view>
        <text class="report-time">检测日期：{{ summary.diagnosisTime }}</text>
        <view v-if="summary.suggestion.length" class="suggestions">
          <text class="suggestion-title">结果建议：</text>
          <text v-for="text in summary.suggestion" :key="text" class="suggestion-text">{{ text }}</text>
        </view>
      </view>

      <view v-if="featureList.length" class="feature-section">
        <view class="section-title large">
          <i />体质变化过程
        </view>
        <view class="feature-card">
          <image class="feature-flow" :src="flowImage" mode="widthFix" />
          <view v-for="item in featureList" :key="item.key" class="feature-item">
            <image :src="item.icon" mode="aspectFit" />
            <view><text class="feature-title">{{ item.title }}</text><text class="feature-text">{{ item.content }}</text></view>
          </view>
        </view>
      </view>

      <view v-if="bodyIndexes.length" class="health-section">
        <view class="section-title large">
          <i />健康状况
        </view>
        <view
          v-for="(item, index) in bodyIndexes"
          :key="item.id"
          class="index-card"
          @click="openBodyIndex(item)"
        >
          <view class="index-header" @click.stop="toggleIndex(index)">
            <view class="index-title-row">
              <image v-if="item.icon" :src="item.icon" mode="aspectFit" />
              <text>{{ item.title }}{{ item.symbol }}</text>
              <view class="question" @click.stop="toggleTip(index)">
                ?
              </view>
              <view v-if="item.showTip && item.describe" class="tip" @click.stop>
                {{ item.describe }}
              </view>
            </view>
            <view class="index-value-row">
              <text>{{ item.value }}</text>
              <view class="fold">
                <sar-icon
                  family="sari"
                  :name="item.expanded ? 'caret-up' : 'caret-down'"
                  size="34rpx"
                  color="#666"
                />
              </view>
            </view>
          </view>
          <view v-if="item.expanded" class="range-chart">
            <health-line-chart
              v-if="item.chartReady"
              type="range"
              :values="[getIndexValue(item)]"
              :min="getIndexMin(item)"
              :max="getIndexMax(item)"
              :areas="getIndexAreas(item)"
              axis-color="#505458"
              split-line-color="rgba(183,189,193,.6)"
              line-color="#29bbc2"
            />
          </view>
        </view>
      </view>
    </template>

    <view v-if="hasData" class="bottom-actions">
      <button class="action ghost" @click="openAdvice">
        ♨ 调理建议
      </button>
      <button class="action primary" @click="showError('医生问诊页面暂未接入当前项目')">
        ＋ 医生问诊
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user'
import detailIcon from '../assets/health-management/pulse-result/feature-detail.png'
import diagnosisIcon from '../assets/health-management/pulse-result/feature-diagnosis.png'
import diseaseIcon from '../assets/health-management/pulse-result/feature-disease.png'
import symptomsIcon from '../assets/health-management/pulse-result/feature-symptoms.png'
import flowImage from '../assets/health-management/pulse-result/flow.webp'
import pulseNameIcon from '../assets/health-management/pulse-result/pulse-name-icon.png'
import HealthLineChart from '../components/HealthLineChart.vue'
import { getPulseDiagnosisInfoDetail } from './api'
import { buildBodyIndexes, buildProfile, profileIcons, showError } from './shared'

definePage({
  style: {
    navigationBarTitleText: '脉象结果',
    navigationBarBackgroundColor: '#20bec5',
    navigationBarTextStyle: 'white',
  },
})

const userStore = useUserStore()
const profile = ref(buildProfile(userStore.userInfo))
const loading = ref(false)
const hasData = ref(false)
const pulseId = ref<number | string>('')
const pulseValues = ref<number[]>([])
const bodyIndexes = ref<any[]>([])
const featureList = ref<any[]>([])
const summary = ref({ pulseName: '', diagnosisTime: '', suggestion: [] as string[] })

onLoad(async (options) => {
  pulseId.value = options?.pulseId || ''
  if (!pulseId.value) {
    showError('脉象参数错误')
    return
  }
  loading.value = true
  try {
    const detail = (await getPulseDiagnosisInfoDetail(pulseId.value)).data || {}
    hasData.value = Boolean(detail.id)
    pulseValues.value = Array.isArray(detail.pluseData) ? detail.pluseData : []
    summary.value = {
      pulseName: detail.pulseManifestationName || '暂无脉象',
      diagnosisTime: detail.diagnosisTimeStr || '',
      suggestion: String(detail.suggestion || '').split(/\n+/).map(item => item.trim()).filter(Boolean),
    }
    bodyIndexes.value = buildBodyIndexes(detail.bodyIndexList || [])
    featureList.value = [
      { key: 'problemComment', icon: detailIcon, title: '详细特点', content: detail.problemComment },
      { key: 'constitutionDiagnosis', icon: diagnosisIcon, title: '体质诊断', content: detail.constitutionDiagnosis },
      { key: 'susceptibleSymptoms', icon: symptomsIcon, title: '易感症状', content: detail.susceptibleSymptoms },
      { key: 'susceptibleDisease', icon: diseaseIcon, title: '易患疾病', content: detail.susceptibleDisease },
    ].filter(item => item.content)
  }
  catch (error) {
    console.warn('获取脉象结果失败', error)
  }
  finally {
    loading.value = false
  }
})

function getIndexMin(item: any) {
  const values = Array.isArray(item.boundaryValue) ? item.boundaryValue : []
  return Number(values[0]) || 0
}

function getIndexMax(item: any) {
  const values = Array.isArray(item.boundaryValue) ? item.boundaryValue : []
  const max = Number(values[values.length - 1])
  return max > getIndexMin(item) ? max : 100
}

function getIndexValue(item: any) {
  return Math.max(getIndexMin(item), Math.min(getIndexMax(item), Number(item.value) || 0))
}

function getIndexAreas(item: any) {
  const values = Array.isArray(item.boundaryValue) ? item.boundaryValue : []
  const colors = Array.isArray(item.boundaryValueColor) ? item.boundaryValueColor : []
  return values.slice(0, -1).map((from: number, index: number) => ({
    from: Number(from),
    to: Number(values[index + 1]),
    color: colors[index] === 1
      ? 'rgba(233,249,237,.7)'
      : colors[index] === 2
        ? 'rgba(255,247,227,.66)'
        : 'rgba(254,230,229,.62)',
  }))
}

function toggleIndex(index: number) {
  const item = bodyIndexes.value[index]
  item.expanded = !item.expanded
  item.chartReady = false
  if (item.expanded) {
    nextTick(() => {
      setTimeout(() => {
        if (item.expanded)
          item.chartReady = true
      }, 50)
    })
  }
}
function toggleTip(index: number) {
  bodyIndexes.value.forEach((item, itemIndex) => item.showTip = itemIndex === index ? !item.showTip : false)
}
function closeTips() {
  bodyIndexes.value.forEach(item => item.showTip = false)
}
function openBodyIndex(item: any) {
  uni.navigateTo({ url: `/pages-health/health-management/body-index-detail?pulseId=${pulseId.value}&indexLabel=${item.indexLabel}&id=${item.rawId}` })
}
function openAdvice() {
  uni.navigateTo({ url: `/pages-health/health-management/pulse-advice?pulseId=${pulseId.value}` })
}
</script>

<style scoped lang="scss">
.pulse-page {
  min-height: 100vh;
  padding-bottom: 154rpx;
  background: #f3f5f8;
}
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 32rpx 100rpx;
  color: #fff;
  background: linear-gradient(180deg, #21c8cc, #16aeb7);
}
.avatar-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 148rpx;
  height: 148rpx;
  border-radius: 50%;
  overflow: hidden;
  background: #113a3a;
}
.avatar {
  width: 100%;
  height: 100%;
}
.avatar-text {
  font-size: 48rpx;
  font-style: italic;
  font-weight: 700;
}
.profile-name {
  margin-top: 22rpx;
  font-size: 38rpx;
  font-weight: 700;
}
.profile-id {
  margin-top: 14rpx;
}
.profile-meta {
  display: flex;
  gap: 54rpx;
  margin-top: 22rpx;
}
.profile-meta view {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.profile-meta image {
  width: 42rpx;
  height: 44rpx;
}
.profile-meta b {
  font-size: 34rpx;
}
.empty {
  padding-top: 180rpx;
  color: #888;
  text-align: center;
}
.section-card {
  position: relative;
  z-index: 2;
  margin: -50rpx 38rpx 66rpx;
  padding: 44rpx 36rpx;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 8rpx 22rpx rgba(32, 45, 54, 0.08);
}
.section-title {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  font-weight: 700;
}
.section-title i {
  width: 6rpx;
  height: 30rpx;
  margin-right: 12rpx;
  border-radius: 99rpx;
  background: #20bec5;
}
.large {
  margin-bottom: 26rpx;
  font-size: 34rpx;
}
.pulse-chart {
  display: block;
  width: 100%;
  height: 430rpx;
  margin: 60rpx auto 0;
}
.pulse-pill {
  display: flex;
  align-items: center;
  margin-top: 30rpx;
  padding: 16rpx 48rpx;
  border-radius: 99rpx;
  color: #f27f45;
  background: #fff7f3;
  font-size: 34rpx;
  font-weight: 700;
}
.pulse-pill image {
  width: 58rpx;
  height: 58rpx;
  margin-right: 36rpx;
}
.report-time {
  display: block;
  margin-top: 36rpx;
  text-align: center;
}
.suggestions {
  margin-top: 44rpx;
}
.suggestion-title {
  display: block;
  color: #ef8751;
  font-size: 32rpx;
}
.suggestion-text {
  display: block;
  margin-top: 26rpx;
  font-size: 30rpx;
  line-height: 1.58;
}
.feature-section,
.health-section {
  margin: 0 38rpx 66rpx;
}
.feature-card {
  padding: 36rpx 34rpx;
  border-radius: 18rpx;
  background: #fff;
}
.feature-flow {
  width: 100%;
}
.feature-item {
  display: flex;
  align-items: center;
  margin-top: 30rpx;
  padding: 26rpx;
  border-radius: 10rpx;
  background: #fff8f4;
}
.feature-item > image {
  width: 82rpx;
  height: 82rpx;
  margin-right: 30rpx;
}
.feature-title {
  display: block;
  color: #f27f45;
  font-size: 31rpx;
  font-weight: 700;
}
.feature-text {
  display: block;
  margin-top: 16rpx;
  font-size: 29rpx;
  line-height: 1.55;
  white-space: pre-wrap;
}
.health-section {
  margin: 0 28rpx;
}
.index-card {
  position: relative;
  margin-bottom: 28rpx;
  padding: 34rpx 32rpx;
  border-radius: 28rpx;
  background: #fff;
}
.index-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.index-title-row,
.index-value-row {
  position: relative;
  display: flex;
  align-items: center;
}
.index-title-row image {
  width: 50rpx;
  height: 52rpx;
  margin-right: 24rpx;
}
.index-title-row > text {
  font-size: 32rpx;
  font-weight: 700;
}
.question {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32rpx;
  height: 32rpx;
  margin-left: 10rpx;
  border: 3rpx solid #ffbd91;
  border-radius: 50%;
  color: #ff9b64;
}
.tip {
  position: absolute;
  z-index: 8;
  left: 80rpx;
  bottom: 50rpx;
  width: 460rpx;
  padding: 24rpx;
  border-radius: 14rpx;
  color: #fff;
  background: rgba(55, 58, 58, 0.96);
  font-size: 27rpx;
  line-height: 1.45;
}
.index-value-row > text:first-child {
  font-size: 40rpx;
  font-weight: 700;
}
.fold {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44rpx;
  height: 44rpx;
  margin-left: 26rpx;
}
.range-chart {
  width: 100%;
  height: 300rpx;
  margin-top: 32rpx;
}
.bottom-actions {
  position: fixed;
  z-index: 20;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 24rpx;
  padding: 18rpx 76rpx calc(18rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
}
.action {
  flex: 1;
  height: 76rpx;
  border-radius: 99rpx;
  font-size: 28rpx;
}
.action::after {
  border: 0;
}
.ghost {
  color: #1bb5bd;
  background: #fff;
  border: 2rpx solid #1bb5bd;
}
.primary {
  color: #fff;
  background: #1db8c1;
}
</style>
