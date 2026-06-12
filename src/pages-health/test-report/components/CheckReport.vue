<template>
  <view class="report-paper">
    <image class="report-header" :class="{ tall: pageNo === 4 }" :src="reportHeaders[pageNo - 1]" mode="scaleToFill" />

    <template v-if="pageNo === 1">
      <text class="cover-title">指脉波检测报告</text>
      <view class="profile-table">
        <view class="profile-row">
          <text>账号</text><text>{{ data.profile.account }}</text>
          <text>记录时间</text><text>{{ data.diagnosisTime || '--' }}</text>
        </view>
        <view class="profile-row profile-columns">
          <text>姓名 {{ data.profile.name }}</text>
          <text>性别 {{ data.profile.gender }}</text>
          <text>年龄 {{ data.profile.age }}</text>
          <text>身高 {{ data.profile.height }} cm</text>
          <text>体重 {{ data.profile.weight }} kg</text>
        </view>
      </view>
      <report-title>脉 象 图 谱</report-title>
      <view class="green-chart">
        <health-line-chart
          class="report-canvas"
          :values="data.pulseValues"
          :max="pulseMax"
          line-color="#fff"
          axis-color="rgba(255,255,255,.35)"
          split-line-color="rgba(255,255,255,.35)"
          label-color="rgba(255,255,255,.95)"
        />
      </view>
      <report-title>测 量 结 果</report-title>
      <view class="measure-grid">
        <view v-for="item in data.indexes" :key="item.id" class="measure-item">
          <view class="measure-value">
            <view class="measure-color" :style="{ background: item.color }" />
            <text>{{ item.value }}{{ item.symbol }}</text>
          </view>
          <text>{{ item.title }}</text>
        </view>
      </view>
    </template>

    <template v-else-if="pageNo === 2">
      <report-title>
        结 果 建 议
      </report-title>
      <view class="suggestion-list">
        <text v-for="item in data.suggestions" :key="item">{{ item }}</text>
      </view>
      <report-title>
        脉 象 说 明
      </report-title>
      <feature-list :items="data.features" />
    </template>

    <template v-else-if="pageNo >= 3 && pageNo <= 5">
      <report-title v-if="pageNo === 3">
        指 标 说 明
      </report-title>
      <view class="index-description-list">
        <view v-for="item in pageIndexes" :key="item.id" class="index-description">
          <view class="index-scale">
            <view class="scale-lines">
              <i /><i /><i />
            </view>
            <view class="capsule-title">
              {{ item.title }}
            </view>
          </view>
          <text>{{ item.describe || '暂无指标说明' }}</text>
        </view>
      </view>
    </template>

    <template v-else-if="pageNo === 6">
      <report-title>调 理 建 议</report-title>
      <feature-list :items="firstAdvice" />
    </template>

    <template v-else>
      <feature-list :items="lastAdvice" />
    </template>
  </view>
</template>

<script setup lang="ts">
import type { CheckReportData } from '../shared'
import HealthLineChart from '../../components/HealthLineChart.vue'
import { reportHeaders } from '../shared'
import FeatureList from './FeatureList.vue'
import ReportTitle from './ReportTitle.vue'

const props = defineProps<{
  pageNo: number
  data: CheckReportData
}>()

const pageIndexes = computed(() => props.data.indexes.slice((props.pageNo - 3) * 4, (props.pageNo - 2) * 4))
const pulseMax = computed(() => Math.max(100, ...props.data.pulseValues))
const firstAdvice = computed(() => [
  { title: '膳食选择', content: props.data.advice.stapleDiet },
  { title: '日常生活', content: props.data.advice.life },
  { title: '四季养生', content: props.data.advice.seasonsDiet },
  { title: '情志调摄', content: props.data.advice.emotionalAdjustment },
])
const lastAdvice = computed(() => [
  { title: '居家保健', content: props.data.advice.homeHealthCare },
  { title: '药物调养', content: props.data.advice.drugCare },
])
</script>

<style scoped lang="scss">
.report-paper {
  position: relative;
  min-height: 1050rpx;
  padding: 0 50rpx 76rpx;
  background: #fff;
  overflow: hidden;
  box-sizing: border-box;
}
.report-header {
  display: block;
  width: calc(100% + 100rpx);
  height: 192rpx;
  margin: 0 -50rpx 34rpx;
}
.report-header.tall {
  height: 396rpx;
  margin-bottom: 0;
}
.cover-title {
  display: block;
  margin: 22rpx 0 26rpx;
  color: #1c1715;
  font-family: serif;
  font-size: 42rpx;
  font-weight: 700;
  letter-spacing: 12rpx;
  text-align: center;
}
.profile-table {
  color: #47372f;
  font-size: 18rpx;
}
.profile-row {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr 2fr;
  margin-bottom: 10rpx;
  background: #ead0c2;
}
.profile-row text {
  padding: 7rpx 10rpx;
  border-right: 2rpx solid #fff;
}
.profile-columns {
  grid-template-columns: 1.3fr 1fr 1fr 1.3fr 1.3fr;
}
.green-chart {
  height: 380rpx;
  padding: 14rpx;
  border-radius: 22rpx;
  background: #78b99d;
  overflow: hidden;
  box-sizing: border-box;
}
.report-canvas {
  width: 100%;
  height: 352rpx;
}
.measure-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 22rpx 14rpx;
}
.measure-item {
  min-width: 0;
  color: #2a2624;
  font-size: 17rpx;
  text-align: center;
}
.measure-value {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48rpx;
  margin-bottom: 8rpx;
  background: linear-gradient(180deg, #f8f8f8, #e1e1e1);
  font-size: 15rpx;
}
.measure-color {
  position: absolute;
  left: 18rpx;
  right: 18rpx;
  top: 7rpx;
  height: 4rpx;
}
.suggestion-list {
  margin: 10rpx 20rpx 70rpx;
}
.suggestion-list text {
  display: block;
  margin-bottom: 18rpx;
  font-size: 21rpx;
  line-height: 1.65;
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
.index-description-list {
  margin-top: 24rpx;
}
.index-description {
  display: grid;
  grid-template-columns: 160rpx 1fr;
  gap: 32rpx;
  align-items: center;
  margin-bottom: 48rpx;
}
.index-description > text {
  font-size: 19rpx;
  line-height: 1.75;
  text-align: justify;
}
.index-scale {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.scale-lines {
  display: flex;
  align-items: flex-end;
  gap: 14rpx;
  height: 46rpx;
  margin-bottom: 10rpx;
}
.scale-lines i {
  width: 28rpx;
  border-top: 5rpx solid;
}
.scale-lines i:nth-child(1) {
  height: 10rpx;
  border-color: #68a920;
}
.scale-lines i:nth-child(2) {
  height: 24rpx;
  border-color: #f0ad00;
}
.scale-lines i:nth-child(3) {
  height: 38rpx;
  border-color: #e51a33;
}
</style>
