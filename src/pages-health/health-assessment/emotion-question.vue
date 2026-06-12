<template>
  <view class="question-page">
    <view class="tips">
      请您根据自身情况回答以下问题，辅助医生辨识身体情况
    </view>
    <view class="question-list">
      <view v-for="question in questions" :key="question.id" class="question-card">
        <view class="question-number">
          {{ question.number }}
        </view>
        <view class="question-content">
          <text class="question-title">{{ question.title }}</text>
          <view class="option-row">
            <view
              v-for="option in question.options"
              :key="`${option.label}-${option.score}`"
              class="option"
              @click="answers[question.id] = option"
            >
              <view class="radio" :class="{ checked: answers[question.id]?.label === option.label }" />
              <text>{{ option.content }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    <view class="bottom-actions">
      <button class="submit-button" @click="submit">
        提交问卷
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user'
import { getEmotionTestQuestion, submitEmotionTestAnswer } from './api'
import { confirmAction, showMessage } from './shared'

definePage({ style: { navigationBarTitleText: '情绪测评' } })

interface EmotionOption {
  label: string
  content: string
  score: string
}

const userStore = useUserStore()
const testId = ref('')
const testTitle = ref('')
const questions = ref<any[]>([])
const answers = reactive<Record<string, EmotionOption>>({})

onLoad(async (options) => {
  testId.value = options?.id || ''
  testTitle.value = decodeURIComponent(options?.title || '')
  if (!testId.value) {
    showMessage('评测参数错误')
    return
  }
  try {
    const data = (await getEmotionTestQuestion(testId.value)).data || {}
    const rawQuestions = Array.isArray(data.result?.question) ? data.result.question : []
    questions.value = rawQuestions.map((item: any, index: number) => ({
      id: String(index),
      number: String(index + 1),
      title: String(item.title || '').replace(/^\s*\d+[.．、]\s*/, ''),
      options: (Array.isArray(item.answer_content) ? item.answer_content : []).map((option: any) => ({
        label: option.label,
        content: option.content,
        score: String(option.score),
      })),
    }))
  }
  catch (error) {
    console.warn('获取情绪评测问题失败', error)
  }
})

async function submit() {
  const missed = questions.value.find(question => !answers[question.id])
  if (missed) {
    showMessage(`请完成第${missed.number}题`)
    return
  }
  if (!await confirmAction('确认提交作答？', '提交作答'))
    return
  try {
    const res = await submitEmotionTestAnswer({
      name: testTitle.value.replace(/测试$/, ''),
      userId: String(userStore.userInfo.id),
      id: testId.value,
      answer: questions.value.map(question => answers[question.id].label),
    })
    const data = res.data
    const reportId = typeof data === 'object' && data ? data.id : data
    if (!reportId) {
      showMessage('报告编号为空')
      return
    }
    showMessage(res.msg || '提交成功')
    uni.redirectTo({ url: `/pages-health/test-report/emotion-report?id=${reportId}` })
  }
  catch (error) {
    console.warn('提交情绪评测失败', error)
  }
}
</script>

<style scoped>
.question-page {
  min-height: 100vh;
  padding-bottom: 146rpx;
  background: #f2f2f2;
}
.tips {
  padding: 48rpx 30rpx 34rpx;
  color: #1fb3bd;
  background: #dff4f8;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.72;
}
.question-list {
  padding: 68rpx 30rpx 20rpx;
}
.question-card {
  position: relative;
  min-height: 150rpx;
  margin-bottom: 32rpx;
  padding: 42rpx 26rpx 34rpx 130rpx;
  border-radius: 28rpx;
  background: #fff;
}
.question-number {
  position: absolute;
  top: -16rpx;
  left: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 74rpx;
  height: 112rpx;
  border-radius: 0 0 38rpx 38rpx;
  color: #fff;
  background: rgba(172, 229, 230, 0.72);
  font-size: 42rpx;
}
.question-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 1.42;
}
.option-row {
  display: flex;
  justify-content: space-between;
  gap: 18rpx;
  margin-top: 34rpx;
}
.option {
  display: flex;
  align-items: center;
  min-width: 0;
  font-size: 29rpx;
  white-space: nowrap;
}
.radio {
  width: 36rpx;
  height: 36rpx;
  margin-right: 12rpx;
  border: 2rpx solid #d2d2d2;
  border-radius: 50%;
  box-sizing: border-box;
}
.radio.checked {
  border-color: #22bfc5;
  background: radial-gradient(circle, #22bfc5 0, #22bfc5 45%, #fff 48%, #fff 100%);
}
.bottom-actions {
  position: fixed;
  z-index: 8;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: center;
  padding: 18rpx 40rpx calc(18rpx + env(safe-area-inset-bottom));
  background: #fff;
}
.submit-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 202rpx;
  height: 78rpx;
  padding: 0;
  border-radius: 99rpx;
  color: #fff;
  background: #58cbd2;
  line-height: 1;
  text-align: center;
}
.submit-button::after {
  border: 0;
}
</style>
