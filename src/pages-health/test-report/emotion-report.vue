<template>
  <view class="emotion-page">
    <text class="heading">负面情绪诊断报告</text>
    <view v-if="level" class="level-bar">
      {{ level }}
    </view>

    <view v-for="item in sections" :key="item.title" class="report-card">
      <view class="card-title">
        <image :src="item.icon" mode="aspectFit" />
        <text>{{ item.title }}</text>
      </view>
      <text class="card-content">{{ item.content }}</text>
    </view>

    <view v-if="musicList.length" class="report-card">
      <view class="card-title">
        <image :src="musicIcon" mode="aspectFit" />
        <text>听音乐进行调理</text>
      </view>
      <view class="music-list">
        <view v-for="(item, index) in musicList" :key="item.id" class="music-item" @click="openMusic(index)">
          <text>{{ item.name }}</text>
          <view class="music-play">
            ▷
          </view>
        </view>
      </view>
    </view>

    <text v-if="tips" class="tips">{{ tips }}</text>
  </view>
</template>

<script setup lang="ts">
import { getEnvBaseUrl } from '@/utils'
import bodyIcon from '../assets/health-report/emotion-report/body.png'
import dailyIcon from '../assets/health-report/emotion-report/daily.png'
import mindIcon from '../assets/health-report/emotion-report/mind.png'
import musicIcon from '../assets/health-report/emotion-report/music.png'
import thoughtIcon from '../assets/health-report/emotion-report/thought.png'
import { getEmotionTestDetail } from './api'

definePage({ style: { navigationBarTitleText: '情绪测评' } })

const cacheKey = 'vv_emotion_music_player_list'
const level = ref('')
const sections = ref<any[]>([])
const musicList = ref<any[]>([])
const tips = ref('')

onLoad(async (options) => {
  if (!options?.id) {
    uni.showToast({ title: '报告参数错误', icon: 'none' })
    return
  }
  try {
    const data = (await getEmotionTestDetail(options.id)).data || {}
    const result = parseMaybeJson(data.result) || data.result || {}
    const conclusionWrap = parseMaybeJson(result.conclusion) || {}
    const conclusion = parseMaybeJson(conclusionWrap.conclusion) || conclusionWrap || {}
    level.value = conclusionWrap.level || result.level || ''
    sections.value = buildSections(conclusion)
    musicList.value = buildMusicList(data.musicList || result.musicList)
    tips.value = conclusion.tips || conclusionWrap.tips || ''
  }
  catch (error) {
    console.warn('获取情绪报告失败', error)
  }
})

function parseMaybeJson(value: any) {
  if (!value || typeof value !== 'string')
    return value
  try {
    return JSON.parse(value)
  }
  catch {
    return null
  }
}

function buildSections(conclusion: Record<string, any>) {
  const fields = [
    { key: 'plan1', icon: thoughtIcon, title: '从思想认知上扩展', fallback: ['thought1'] },
    { key: 'plan2', icon: bodyIcon, title: '从身体层面上清理', fallback: ['body', 'body1', 'body2'] },
    { key: 'plan3', icon: mindIcon, title: '从心智层面去提升', fallback: ['noema1', 'noema2'] },
    { key: 'plan4', icon: dailyIcon, title: '从日常养护中获得', fallback: ['day1', 'day2', 'day3'] },
  ]
  return fields.map((field, index) => ({
    icon: field.icon,
    title: String(conclusion[`plantitle${index + 1}`] || field.title).replace(/^\s*\d+[、.．]\s*/, '').replace(/：$/, ''),
    content: conclusion[field.key] || field.fallback.map(key => conclusion[key]).filter(Boolean).join('\n'),
  })).filter(item => item.content)
}

function buildMusicList(list: any[]) {
  const baseUrl = getEnvBaseUrl()
  return (Array.isArray(list) ? list : []).map(item => ({
    id: item.id,
    name: item.musicName || item.categoryName || '音乐',
    url: /^https?:\/\//.test(item.musicUrl || '')
      ? item.musicUrl
      : `${baseUrl}${String(item.musicUrl || '').startsWith('/') ? '' : '/'}${item.musicUrl || ''}`,
  }))
}

function openMusic(index: number) {
  uni.setStorageSync(cacheKey, musicList.value)
  uni.navigateTo({
    url: `/pages-health/test-report/music-player?index=${index}&cacheKey=${cacheKey}`,
  })
}
</script>

<style scoped>
.emotion-page {
  min-height: 100vh;
  padding: 30rpx 26rpx 54rpx;
  background: #f2f2f2;
  box-sizing: border-box;
}
.heading {
  display: block;
  font-size: 34rpx;
  text-align: center;
}
.level-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48rpx;
  margin: 16rpx 0 34rpx;
  border-radius: 10rpx;
  color: #fff;
  background: #10b4b5;
  font-size: 34rpx;
  font-weight: 700;
}
.report-card {
  margin-bottom: 28rpx;
  padding: 26rpx 28rpx 30rpx;
  border-radius: 14rpx;
  background: #fff;
}
.card-title {
  display: flex;
  align-items: center;
  margin-bottom: 18rpx;
  font-size: 32rpx;
  font-weight: 700;
}
.card-title image {
  width: 40rpx;
  height: 42rpx;
  margin-right: 18rpx;
}
.card-content {
  display: block;
  font-size: 27rpx;
  line-height: 1.86;
  text-align: justify;
  white-space: pre-wrap;
}
.music-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64rpx;
  margin: 6rpx;
  padding: 12rpx 18rpx 12rpx 54rpx;
  border-radius: 12rpx;
  color: #fff;
  background: #00adab;
  font-size: 26rpx;
}
.music-play {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30rpx;
  height: 30rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.75);
  border-radius: 50%;
}
.tips {
  display: block;
  margin: 42rpx 12rpx 0;
  color: #16aab2;
  font-size: 24rpx;
  line-height: 1.9;
  text-align: justify;
  white-space: pre-wrap;
}
</style>
