<template>
  <view class="report-page">
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

    <view class="main-card">
      <view class="section-title">
        <i />体质判断
      </view>
      <view class="body-panel">
        <image class="body-image" :src="bodyImage" mode="widthFix" />
        <template v-for="item in organMarkers" :key="item.key">
          <view
            class="organ-marker"
            :class="[item.side, { abnormal: item.abnormal }]"
            :style="getMarkerStyle(item)"
          >
            <image
              v-if="item.abnormal"
              class="organ-status-icon"
              :src="abnormalIcon"
              mode="aspectFit"
            />
            <text>{{ item.label }}</text>
          </view>
          <view
            class="organ-dot"
            :class="{ abnormal: item.abnormal }"
            :style="getDotStyle(item)"
          />
          <view class="organ-line" :class="[`line-${item.key}`, item.side]">
            <view
              class="organ-line-segment"
              :style="{ animationDelay: `${item.animationDelay}ms` }"
            />
          </view>
        </template>
      </view>

      <view class="score-chart">
        <health-line-chart
          type="bar"
          :values="scoreValues"
          :categories="scoreCategories"
          :max="100"
          axis-color="#333"
          split-line-color="#d6d6d6"
          label-color="#333"
          bar-color="#fb814b"
          :bar-width="20"
        />
      </view>
      <text class="comment">评价说明：根据个人问卷结果进行分析，得到此数据。</text>

      <view class="result-title">
        <i />诊断结果<i />
      </view>
      <view class="result-block">
        <text class="result-label">主体质类型为：</text>
        <constitution-types :items="constitution.primaryTypes" />
      </view>
      <view v-if="constitution.secondaryTypes.length" class="result-block">
        <text class="result-label">次体质类型为：</text>
        <constitution-types :items="constitution.secondaryTypes" />
      </view>
    </view>

    <view class="bottom-actions">
      <button class="action ghost" @click="openAdvice">
        调理建议
      </button>
      <button class="action primary" @click="showError('医生问诊页面暂未接入当前项目')">
        医生问诊
      </button>
    </view>

    <view v-if="selectorVisible" class="selector-mask" @click="selectorVisible = false">
      <view class="selector" @click.stop>
        <text class="selector-title">选择一项</text>
        <button
          v-for="item in suggestionTypes"
          :key="item.typeId"
          class="selector-option"
          @click="navigateAdvice(item)"
        >
          {{ item.typeName }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user'
import bodyImage from '../assets/health-management/constitution-body-bg.webp'
import abnormalIcon from '../assets/health-management/constitution-detail/abnormal.png'
import causeIcon from '../assets/health-management/constitution-detail/cause.png'
import detailIcon from '../assets/health-management/constitution-detail/detail.png'
import diseaseIcon from '../assets/health-management/constitution-detail/disease.png'
import HealthLineChart from '../components/HealthLineChart.vue'
import { getBodyFeature, getSuggestionList } from './api'
import ConstitutionTypes from './components/ConstitutionTypes.vue'
import { buildProfile, profileIcons, showError } from './shared'

definePage({ style: { navigationBarTitleText: '体质结果', navigationBarBackgroundColor: '#20bec5', navigationBarTextStyle: 'white' } })

const scoreFields = [
  ['yinDeficiency', '阴虚'],
  ['qiStasis', '气郁'],
  ['phlegmWet', '痰湿'],
  ['greatQuality', '特禀'],
  ['yangDeficiency', '阳虚'],
  ['bloodStasis', '血瘀'],
  ['qiDeficiency', '气虚'],
  ['dampHeat', '湿热'],
]
const organDefinitions = [
  { key: 'lung', label: '肺', aliases: ['lung', '肺'], side: 'left', labelTop: 247, labelOffset: 42, dotTop: 345, dotLeft: 286 },
  { key: 'heart', label: '心', aliases: ['heart', '心'], side: 'left', labelTop: 348, labelOffset: 52, dotTop: 387, dotLeft: 311 },
  { key: 'liver', label: '肝', aliases: ['liver', '肝'], side: 'left', labelTop: 446, labelOffset: 52, dotTop: 432, dotLeft: 274 },
  { key: 'gall', label: '胆', aliases: ['gallbladder', 'gall', '胆'], side: 'left', labelTop: 528, labelOffset: 52, dotTop: 484, dotLeft: 262 },
  { key: 'kidney-left', label: '肾', aliases: ['kidney', '肾'], side: 'left', labelTop: 612, labelOffset: 42, dotTop: 540, dotLeft: 302 },
  { key: 'spleen', label: '脾', aliases: ['spleen', '脾'], side: 'right', labelTop: 247, labelOffset: 42, dotTop: 421, dotLeft: 363 },
  { key: 'stomach', label: '胃', aliases: ['stomach', '胃'], side: 'right', labelTop: 612, labelOffset: 42, dotTop: 456, dotLeft: 345 },
] as const
const userStore = useUserStore()
const profile = ref(buildProfile(userStore.userInfo))
const constitutionId = ref<number | string>('')
const scores = ref<any[]>([])
const scoreValues = computed(() => scores.value.map(item => item.value))
const scoreCategories = computed(() => scores.value.map(item => item.label))
const organMarkers = ref<any[]>(buildOrganMarkers(''))
const constitution = ref({ primaryTypes: [] as any[], secondaryTypes: [] as any[] })
const suggestionTypes = ref<any[]>([])
const selectorVisible = ref(false)

onLoad(async (options) => {
  constitutionId.value = options?.id || ''
  if (!constitutionId.value) {
    showError('体质参数错误')
    return
  }
  try {
    const feature = (await getBodyFeature(constitutionId.value)).data || {}
    scores.value = scoreFields
      .map(([key, label], index) => {
        const value = Number(feature[key])
        const safeValue = Number.isFinite(value) ? value : 0
        return { label, value: Math.max(0, Math.min(100, safeValue)), index }
      })
      .sort((a, b) => b.value - a.value || a.index - b.index)
    organMarkers.value = buildOrganMarkers(feature.bodyPart)
    constitution.value = {
      primaryTypes: buildTypes(feature.qualityTypePrimaryInfo || feature.qualityTypePrimary),
      secondaryTypes: buildTypes(feature.qualityTypeSecondary),
    }
  }
  catch (error) {
    console.warn('获取体质详情失败', error)
  }
})

function normalizeBodyPart(bodyPart: any): string {
  if (Array.isArray(bodyPart))
    return bodyPart.map(normalizeBodyPart).join(',')
  if (bodyPart && typeof bodyPart === 'object')
    return Object.keys(bodyPart).filter(key => bodyPart[key]).join(',')
  return String(bodyPart || '').toLowerCase()
}

function buildOrganMarkers(bodyPart: any) {
  const normalized = normalizeBodyPart(bodyPart)
  return organDefinitions.map((item, index) => ({
    ...item,
    abnormal: item.aliases.some(alias => normalized.includes(alias)),
    animationDelay: index * 120,
  }))
}

function getMarkerStyle(item: any) {
  return {
    top: `${item.labelTop}rpx`,
    [item.side]: `${item.labelOffset}rpx`,
    animationDelay: `${item.animationDelay}ms`,
  }
}

function getDotStyle(item: any) {
  return {
    top: `${item.dotTop}rpx`,
    left: `${item.dotLeft}rpx`,
    animationDelay: `${item.animationDelay + 520}ms`,
  }
}

function buildTypes(list: any) {
  return (Array.isArray(list) ? list : []).map((item, index) => ({
    key: `${item.qualityTypeName || 'type'}-${item.id || item.typeId || index}`,
    name: item.qualityTypeName || '暂无体质结果',
    sections: [
      { key: 'detail', title: '详细说明', icon: detailIcon, content: item.qualityTypeExplain },
      { key: 'cause', title: '体质成因', icon: causeIcon, content: item.qualityTypeCause },
      { key: 'disease', title: '易患疾病', icon: diseaseIcon, content: item.qualityTypeLiabilityDisease },
    ].filter(section => section.content),
  }))
}

async function openAdvice() {
  try {
    suggestionTypes.value = (await getSuggestionList(constitutionId.value)).data || []
    if (!suggestionTypes.value.length) {
      showError('暂无调理建议')
      return
    }
    if (suggestionTypes.value.length === 1)
      navigateAdvice(suggestionTypes.value[0])
    else
      selectorVisible.value = true
  }
  catch {
    showError('获取调理建议失败')
  }
}

function navigateAdvice(item: any) {
  selectorVisible.value = false
  uni.navigateTo({
    url: `/pages-health/health-management/conditioning-advice?constitutionId=${constitutionId.value}&typeId=${item.typeId}`,
  })
}
</script>

<style scoped lang="scss">
.report-page {
  min-height: 100vh;
  padding-bottom: 140rpx;
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
  font-size: 28rpx;
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
.main-card {
  position: relative;
  z-index: 2;
  margin: -40rpx 24rpx 0;
  padding: 34rpx 42rpx 50rpx;
  border-radius: 28rpx 28rpx 0 0;
  background: #fff;
}
.section-title {
  display: flex;
  align-items: center;
  font-size: 30rpx;
  font-weight: 700;
}
.section-title i {
  width: 6rpx;
  height: 36rpx;
  margin-right: 12rpx;
  border-radius: 99rpx;
  background: #16b9bf;
}
.body-panel {
  position: relative;
  width: 100%;
  margin-top: 22rpx;
  overflow: hidden;
}
.body-image {
  display: block;
  width: 100%;
}
.organ-marker {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 76rpx;
  height: 34rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  color: #18aeb6;
  background: rgba(255, 255, 255, 0.94);
  font-size: 19rpx;
  font-weight: 700;
  line-height: 34rpx;
  opacity: 0;
  animation: marker-fade-in 260ms ease-out forwards;
}
.organ-marker.abnormal {
  color: #ff8200;
}
.organ-status-icon {
  width: 28rpx;
  height: 28rpx;
  margin-right: 2rpx;
}
.organ-line {
  position: absolute;
  height: 2rpx;
  transform-origin: left center;
}
.organ-line-segment {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.94);
  transform: scaleX(0);
  transform-origin: left center;
  animation: organ-line-grow 520ms ease-out forwards;
}
.organ-line.right .organ-line-segment {
  transform-origin: right center;
}
.organ-dot {
  position: absolute;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #fff;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.4);
  animation: organ-dot-pop 260ms ease-out forwards;
}
.organ-dot.abnormal {
  background: #ff8200;
}
.line-lung {
  left: 110rpx;
  top: 264rpx;
  width: 194rpx;
  transform: rotate(24deg);
}
.line-heart {
  left: 120rpx;
  top: 365rpx;
  width: 194rpx;
  transform: rotate(7deg);
}
.line-liver {
  left: 120rpx;
  top: 463rpx;
  width: 155rpx;
  transform: rotate(-11deg);
}
.line-gall {
  left: 120rpx;
  top: 545rpx;
  width: 155rpx;
  transform: rotate(-24deg);
}
.line-spleen {
  left: 363rpx;
  top: 421rpx;
  width: 235rpx;
  transform: rotate(-42deg);
}
.line-stomach {
  left: 345rpx;
  top: 456rpx;
  width: 224rpx;
  transform: rotate(47deg);
}
.line-kidney-left {
  left: 110rpx;
  top: 629rpx;
  width: 204rpx;
  transform: rotate(-25deg);
}
@keyframes organ-line-grow {
  to {
    transform: scaleX(1);
  }
}
@keyframes organ-dot-pop {
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
@keyframes marker-fade-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.score-chart {
  width: 610rpx;
  height: 418rpx;
  margin: 96rpx auto 0;
}
.comment {
  display: block;
  margin-top: 86rpx;
  color: #555;
  font-size: 27rpx;
}
.result-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 36rpx;
  margin-top: 56rpx;
  color: #e08b65;
  font-size: 32rpx;
}
.result-title i {
  width: 160rpx;
  height: 2rpx;
  background: #e2b29e;
}
.result-block {
  margin-top: 46rpx;
}
.result-label {
  font-size: 30rpx;
  font-weight: 700;
}
:deep(.type-group) {
  margin-top: 34rpx;
}
:deep(.result-value) {
  display: block;
  color: #e08b65;
  font-size: 32rpx;
  font-weight: 700;
}
:deep(.detail-card) {
  margin-top: 28rpx;
  padding: 28rpx;
  background: #f8f8f8;
}
:deep(.detail-title) {
  display: flex;
  align-items: center;
  color: #25bfc4;
  font-size: 30rpx;
}
:deep(.detail-icon) {
  width: 34rpx;
  height: 34rpx;
  margin-right: 18rpx;
}
:deep(.detail-divider) {
  height: 2rpx;
  margin: 24rpx 0;
  background: #e0e0e0;
}
:deep(.detail-text) {
  display: block;
  font-size: 28rpx;
  line-height: 1.72;
  text-align: justify;
  white-space: pre-wrap;
}
:deep(.empty-result) {
  display: block;
  margin-top: 28rpx;
  color: #999;
}
.bottom-actions {
  position: fixed;
  z-index: 10;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 20rpx;
  padding: 18rpx 44rpx calc(18rpx + env(safe-area-inset-bottom));
  background: #fff;
}
.action {
  flex: 1;
  height: 72rpx;
  border-radius: 99rpx;
  font-size: 28rpx;
}
.action::after {
  border: 0;
}
.ghost {
  color: #16b7c0;
  background: #fff;
  border: 2rpx solid #16b7c0;
}
.primary {
  color: #fff;
  background: #17b8c0;
}
.selector-mask {
  position: fixed;
  z-index: 30;
  inset: 0;
  display: flex;
  align-items: center;
  padding: 48rpx;
  background: rgba(0, 0, 0, 0.48);
}
.selector {
  width: 100%;
  max-height: 78vh;
  padding: 50rpx;
  border-radius: 28rpx;
  background: #fff;
  overflow-y: auto;
}
.selector-title {
  display: block;
  margin-bottom: 40rpx;
  font-size: 34rpx;
  font-weight: 700;
  text-align: center;
}
.selector-option {
  width: 360rpx;
  margin: 0 auto 28rpx;
  border-radius: 99rpx;
  background: #fff;
  box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.14);
}
</style>
