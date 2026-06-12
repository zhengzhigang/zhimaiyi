<template>
  <view class="test-page">
    <view class="tips">
      {{ currentPage === 1 ? '请您根据自身情况回答以下问题，辅助医生辨识身体情况' : '请您根据自身情况回答以下问题，所有问题均为单选' }}
    </view>
    <user-card v-if="currentPage === 1" :user="user" @edit="openUserInfo" />
    <view v-else class="progress-wrap">
      <view class="progress-track">
        <view class="progress-line" :style="{ width: `${progress}%` }" />
        <view class="progress-dot" :style="{ left: `${progress}%` }" />
      </view>
    </view>

    <view class="question-list">
      <view v-for="question in currentQuestions" :key="question.id" class="question-card">
        <view class="question-number">
          {{ question.number }}
        </view>
        <text class="question-title">{{ question.title }}</text>
        <view class="option-row">
          <view v-for="option in options" :key="option.value" class="option" @click="answers[question.id] = option.value">
            <view class="radio" :class="{ checked: answers[question.id] === option.value }" />
            <text>{{ option.label }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="bottom-actions">
      <button class="footer-button finish" @click="finish">
        结束作答
      </button>
      <button v-if="currentPage > 1" class="footer-button prev" @click="changePage(-1)">
        上一页
      </button>
      <button v-if="currentPage < totalPages" class="footer-button next" @click="nextPage">
        下一页
      </button>
      <button v-else class="footer-button next" @click="submit">
        提交问卷
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user'
import { submitConstitutionExam } from './api'
import UserCard from './components/UserCard.vue'
import { buildUser, confirmAction, showMessage } from './shared'

definePage({ style: { navigationBarTitleText: '体质检测', navigationBarBackgroundColor: '#f4f3f8' } })

const questionTexts = [
  '您是否感到气短',
  '您是否感到说话无力',
  '您是否容易感冒',
  '您是否腹部肥大',
  '您是否胸闷胀满',
  '您是否大便溏稀',
  '您是否心悸、失眠或潮热盗汗',
  '您是否容易心慌',
  '您是否头晕耳鸣',
  '您是否腰膝酸软无力',
  '您是否小便次数多有尿不尽的感觉',
  '您是否面部潮红',
  '您是否感到眼睛干涩',
  '口干咽燥总想喝水',
  '您是否干咳少痰',
  '胃口不佳，有时干呕、呃逆',
  '您是否感到手脚发凉',
  '喜欢吃温热的食物、腹部喜温暖',
  '您是否无法耐受寒冷',
  '您是否五更泻（早晨5-7点排大便，稀且不成形）',
  '您是否小便发热尿色浓',
  '您是否大便粘滞解不尽',
  '您是否身体沉重、不轻松或不爽快',
  '您是否嘴里有粘粘的感觉',
  '您是否上眼睑比别人肿',
  '额部油脂过多',
  '您是否阴囊潮湿',
  '容易忘事',
  '身上出现紫斑现象',
  '无故常叹气',
  '您是否两胁肋骨胀痛',
  '您是否季节变化有咳喘的现象',
  '您是否容易过敏、起荨麻疹或皮肤抓痕',
  '您是否精力旺盛',
]
const options = [
  { label: '从不', value: '1' },
  { label: '有时', value: '3' },
  { label: '经常', value: '5' },
]
const questions = questionTexts.map((title, index) => ({
  id: index + 1,
  number: String(index + 1).padStart(2, '0'),
  title,
}))
const userStore = useUserStore()
const user = computed(() => buildUser(userStore.userInfo))
const currentPage = ref(1)
const totalPages = 3
const answers = reactive<Record<number, string>>({})
const currentQuestions = computed(() => {
  const start = (currentPage.value - 1) * 10
  return questions.slice(start, currentPage.value === totalPages ? questions.length : start + 10)
})
const progress = computed(() => currentPage.value / totalPages * 100)

function validatePage() {
  const missed = currentQuestions.value.find(question => !answers[question.id])
  if (missed) {
    showMessage(`请完成第${missed.number}题`)
    return false
  }
  return true
}

function changePage(offset: number) {
  currentPage.value += offset
  uni.pageScrollTo({ scrollTop: 0, duration: 200 })
}

function nextPage() {
  if (validatePage())
    changePage(1)
}

async function finish() {
  if (await confirmAction('确认结束作答？未完成的问卷不会提交', '结束作答'))
    uni.navigateBack()
}

async function submit() {
  if (!validatePage() || !await confirmAction('确认提交作答？', '提交作答'))
    return
  const params: Record<string, unknown> = { user_id: String(userStore.userInfo.id) }
  for (let index = 1; index <= 35; index++)
    params[`que${index}`] = answers[index] || (index === 35 ? '3' : '')
  try {
    const res = await submitConstitutionExam(params)
    showMessage(res.msg || '提交成功')
    if (res.data?.id)
      uni.redirectTo({ url: `/pages-health/health-management/constitution-detail?id=${res.data.id}` })
  }
  catch (error) {
    console.warn('提交体质自测失败', error)
  }
}

function openUserInfo() {
  uni.navigateTo({ url: '/pages-user/info/index' })
}
</script>

<style scoped lang="scss">
.test-page {
  min-height: 100vh;
  padding-bottom: 120rpx;
  background: #f4f3f8;
}
.tips {
  padding: 24rpx 30rpx;
  color: #1fb3bd;
  background: #dff4f8;
  font-size: 27rpx;
  font-weight: 600;
  line-height: 1.65;
}
.progress-wrap {
  padding: 50rpx 48rpx 28rpx;
}
.progress-track {
  position: relative;
  height: 8rpx;
  border-radius: 99rpx;
  background: rgba(38, 190, 196, 0.22);
}
.progress-line {
  height: 8rpx;
  border-radius: 99rpx;
  background: #76d5d9;
}
.progress-dot {
  position: absolute;
  top: 50%;
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #76d5d9;
  transform: translate(-50%, -50%);
}
.question-list {
  padding: 0 30rpx;
}
.question-card {
  position: relative;
  margin-bottom: 34rpx;
  padding: 40rpx 34rpx 34rpx 120rpx;
  border-radius: 16rpx;
  background: #fff;
}
.question-number {
  position: absolute;
  top: 30rpx;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 86rpx;
  height: 66rpx;
  border-radius: 0 34rpx 34rpx 0;
  color: #fff;
  background: #a7e5e7;
  font-size: 30rpx;
  font-weight: 700;
}
.question-title {
  display: block;
  font-size: 31rpx;
  font-weight: 700;
  line-height: 1.35;
}
.option-row {
  display: flex;
  justify-content: space-between;
  margin-top: 34rpx;
}
.option {
  display: flex;
  align-items: center;
  font-size: 30rpx;
}
.radio {
  width: 36rpx;
  height: 36rpx;
  margin-right: 14rpx;
  border: 2rpx solid #d8d8d8;
  border-radius: 50%;
}
.radio.checked {
  border-color: #28bec6;
  background: radial-gradient(circle, #28bec6 0, #28bec6 45%, #fff 48%, #fff 100%);
}
.bottom-actions {
  position: fixed;
  z-index: 5;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  gap: 20rpx;
  padding: 18rpx 40rpx calc(18rpx + env(safe-area-inset-bottom));
  background: #fff;
}
.footer-button {
  flex: 1;
  height: 78rpx;
  border-radius: 99rpx;
  font-size: 29rpx;
}
.footer-button::after {
  border: 0;
}
.finish {
  color: #e79275;
  background: #fdece4;
}
.prev {
  color: #555;
  background: #f4f4f4;
}
.next {
  color: #fff;
  background: #20b7bf;
}
</style>
