<template>
  <view class="player-page">
    <image class="player-bg" :src="backgroundImage" mode="scaleToFill" />
    <view class="player-content">
      <text class="music-title">{{ currentMusic.name }}</text>
      <view class="controls">
        <view class="arrow left" @click="playPrevious" />
        <view class="play-button" @click="togglePlay">
          {{ playing ? 'Ⅱ' : '▶' }}
        </view>
        <view class="arrow right" @click="playNext" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import backgroundImage from '../assets/health-report/music-player/bg.jpg'

definePage({
  style: {
    navigationBarTitleText: '音乐调理',
    disableScroll: true,
  },
})

const musicList = ref<any[]>([])
const currentIndex = ref(0)
const currentMusic = computed(() => musicList.value[currentIndex.value] || {})
const playing = ref(false)
let audio: UniApp.BackgroundAudioManager | UniApp.InnerAudioContext | undefined

onLoad((options) => {
  musicList.value = uni.getStorageSync(options?.cacheKey || '') || []
  currentIndex.value = normalizeIndex(Number(options?.index || 0))
  if (!musicList.value.length) {
    uni.showToast({ title: '暂无可播放音乐', icon: 'none' })
    return
  }
  initAudio()
})

function initAudio() {
  // #ifdef H5
  const innerAudio = uni.createInnerAudioContext()
  innerAudio.autoplay = false
  innerAudio.obeyMuteSwitch = false
  audio = innerAudio
  // #endif

  // #ifndef H5
  audio = uni.getBackgroundAudioManager()
  // #endif

  audio.onPlay(() => playing.value = true)
  audio.onPause(() => playing.value = false)
  audio.onStop(() => playing.value = false)
  audio.onEnded(playNext)
  // #ifndef H5
  audio.onPrev(playPrevious)
  audio.onNext(playNext)
  // #endif
  audio.onError((error: any) => {
    console.warn('音乐播放失败', error)
    playing.value = false
    uni.showToast({ title: '音乐播放失败，请检查音频地址', icon: 'none' })
  })
  prepareCurrent()
}

onUnload(() => {
  if (!audio)
    return
  audio.stop()
  // #ifdef H5
  ;(audio as UniApp.InnerAudioContext).destroy()
  // #endif
})

function normalizeIndex(index: number) {
  if (!musicList.value.length)
    return 0
  if (index < 0)
    return musicList.value.length - 1
  if (index >= musicList.value.length)
    return 0
  return index
}

function prepareCurrent(shouldPlay = false) {
  const music = currentMusic.value
  if (!audio || !music.url) {
    uni.showToast({ title: '音频地址为空', icon: 'none' })
    return
  }
  const src = encodeURI(music.url)

  // #ifdef H5
  audio.src = src
  if (shouldPlay)
    audio.play()
  // #endif

  // #ifndef H5
  const backgroundAudio = audio as UniApp.BackgroundAudioManager
  backgroundAudio.title = music.name || '音乐调理'
  backgroundAudio.epname = music.name || '音乐调理'
  backgroundAudio.singer = '情绪调理'
  backgroundAudio.src = src
  if (shouldPlay)
    backgroundAudio.play()
  // #endif
}

function switchMusic(index: number) {
  currentIndex.value = normalizeIndex(index)
  nextTick(() => prepareCurrent(true))
}

function playPrevious() {
  switchMusic(currentIndex.value - 1)
}

function playNext() {
  switchMusic(currentIndex.value + 1)
}

function togglePlay() {
  if (!audio)
    return
  if (playing.value) {
    audio.pause()
    return
  }
  if (!audio.src)
    prepareCurrent(true)
  else
    audio.play()
}
</script>

<style scoped>
.player-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0b2a48;
}
.player-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.player-content {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100vh;
}
.music-title {
  position: absolute;
  left: 80rpx;
  right: 80rpx;
  top: 12%;
  display: block;
  color: #fff;
  font-size: 72rpx;
  text-align: center;
}
.controls {
  position: absolute;
  left: 100rpx;
  right: 100rpx;
  bottom: 12%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.arrow {
  width: 112rpx;
  height: 112rpx;
  position: relative;
}
.arrow::before {
  position: absolute;
  left: 28rpx;
  top: 18rpx;
  width: 56rpx;
  height: 56rpx;
  border-left: 12rpx solid #fff;
  border-bottom: 12rpx solid #fff;
  border-radius: 6rpx;
  content: '';
}
.left::before {
  transform: rotate(45deg);
}
.right::before {
  transform: rotate(-135deg);
}
.play-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 116rpx;
  height: 116rpx;
  border: 8rpx solid #fff;
  border-radius: 50%;
  color: #fff;
  font-size: 48rpx;
  box-sizing: border-box;
}
</style>
