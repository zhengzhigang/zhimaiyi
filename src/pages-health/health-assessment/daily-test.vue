<template>
  <view class="test-page" :class="{ readonly }">
    <view class="tips">
      请您根据自身情况回答以下问题，辅助医生辨识身体情况
    </view>
    <user-card :user="user" :editable="!readonly" @edit="openUserInfo" />
    <view class="question-list">
      <view v-for="question in questions" :key="question.field" class="question-card">
        <view class="question-number">
          {{ question.number }}
        </view>
        <text class="question-title">{{ question.title }}</text>
        <view class="option-list">
          <view
            v-for="option in question.options"
            :key="option.value"
            class="option"
            @click="toggleOption(question, option.value)"
          >
            <text>{{ option.label }}</text>
            <view class="checkbox" :class="{ checked: selected(question.field, option.value) }">
              {{ selected(question.field, option.value) ? '✓' : '' }}
            </view>
          </view>
        </view>
      </view>
    </view>
    <view v-if="!readonly" class="bottom-actions">
      <button class="submit-button" @click="submit">
        提交问卷
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user'
import { getDailySelfTestList, submitDailySelfTest } from './api'
import UserCard from './components/UserCard.vue'
import { buildUser, confirmAction, showMessage } from './shared'

definePage({ style: { navigationBarTitleText: '日常检测' } })

const definitions = [
  { field: 'talkingSound', title: '说话声音', options: ['大而有力', '弱而无力', '懒言无语', '胡言乱语', '大笑诳语', '没有异常'] },
  { field: 'coughSound', title: '咳嗽声音', options: ['咳声响亮', '咳声沉闷', '咳声浑浊', '咳声干涩', '咳声急促', '没有异常'] },
  { field: 'smellBody', title: '闻体', options: ['恶臭气味', '尿臊气味', '酸腥气味', '狐臭气味', '酸性气味', '没有异常'] },
  { field: 'hear', title: '闻声', options: ['呃逆', '嗳气', '叹息', '呕吐', '吞酸', '没有异常'] },
  { field: 'breathing', title: '呼吸', options: ['气粗', '气短', '气喘', '哮鸣', '痰鸣', '没有异常'] },
  { field: 'femaleLeucorrhea', title: '女性白带', options: ['腥秽', '恶臭', '腥臭', '腥味', '没有异常'], femaleOnly: true },
  { field: 'defecation', title: '二便(大小便)情况', options: ['尿量过少', '尿量过多', '小便清长', '小便浑浊', '小便起泡', '小便下坠', '小便发热', '尿频尿急', '起夜多', '排便不爽', '肛门下坠', '肛门灼热', '大便溏稀', '大便脓血', '大便干结', '大便痢下', '没有异常'] },
]
const userStore = useUserStore()
const user = computed(() => buildUser(userStore.userInfo))
const readonly = ref(false)
const answers = reactive<Record<string, string[]>>({})
const questions = computed(() => definitions
  .filter(item => !item.femaleOnly || Number(userStore.userInfo.sex) === 2)
  .map((item, index) => ({
    ...item,
    number: String(index + 1).padStart(2, '0'),
    noneValue: String(item.options.length - 1),
    options: item.options.map((label, optionIndex) => ({ label, value: String(optionIndex) })),
  })))

onLoad(async (options) => {
  readonly.value = options?.mode === 'view'
  if (readonly.value)
    await loadRecord(options?.id)
})

function selected(field: string, value: string) {
  return (answers[field] || []).includes(value)
}

function toggleOption(question: any, value: string) {
  if (readonly.value)
    return
  const current = answers[question.field] || []
  if (value === question.noneValue)
    answers[question.field] = current.includes(value) ? [] : [value]
  else if (current.includes(value))
    answers[question.field] = current.filter(item => item !== value)
  else
    answers[question.field] = current.filter(item => item !== question.noneValue).concat(value)
}

async function loadRecord(id?: string) {
  if (!id) {
    showMessage('记录参数错误')
    return
  }
  try {
    const list = (await getDailySelfTestList(userStore.userInfo.id)).data || []
    const record = list.find(item => String(item.id) === String(id))
    if (!record) {
      showMessage('记录不存在')
      return
    }
    definitions.forEach((question) => {
      answers[question.field] = String(record[question.field] ?? '').split(',').map(item => item.trim()).filter(Boolean)
    })
  }
  catch (error) {
    console.warn('获取日常表现详情失败', error)
  }
}

async function submit() {
  const missed = questions.value.find(question => !(answers[question.field] || []).length)
  if (missed) {
    showMessage(`请完成第${missed.number}题`)
    return
  }
  if (!await confirmAction('确认提交作答？', '提交作答'))
    return
  const data: Record<string, unknown> = { userId: String(userStore.userInfo.id) }
  definitions.forEach((question) => {
    data[question.field] = Number(userStore.userInfo.sex) === 2 || !question.femaleOnly
      ? (answers[question.field] || []).join(',')
      : ''
  })
  try {
    const res = await submitDailySelfTest(data)
    showMessage(res.msg || '提交成功')
    setTimeout(() => uni.navigateBack(), 500)
  }
  catch (error) {
    console.warn('提交日常表现失败', error)
  }
}

function openUserInfo() {
  uni.navigateTo({ url: '/pages-user/info/index' })
}
</script>

<style scoped lang="scss">
.test-page {
  min-height: 100vh;
  padding-bottom: 150rpx;
  background: #f4f3f8;
}
.test-page.readonly {
  padding-bottom: 40rpx;
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
  padding: 0 30rpx;
}
.question-card {
  position: relative;
  margin-bottom: 38rpx;
  padding: 72rpx 60rpx 10rpx 110rpx;
  border-radius: 24rpx;
  background: #fff;
  overflow: hidden;
}
.question-number {
  position: absolute;
  top: 46rpx;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 84rpx;
  height: 68rpx;
  border-radius: 0 36rpx 36rpx 0;
  color: #fff;
  background: #a7e5e7;
  font-size: 32rpx;
  font-weight: 700;
}
.question-title {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
}
.option-list {
  margin-top: 56rpx;
}
.option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 96rpx;
  padding-right: 42rpx;
  border-top: 2rpx solid #ebebeb;
  font-size: 32rpx;
  font-weight: 600;
}
.checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34rpx;
  height: 34rpx;
  border: 2rpx solid #26bec5;
  border-radius: 50%;
  color: #fff;
}
.checkbox.checked {
  background: #28bec6;
}
.bottom-actions {
  position: fixed;
  z-index: 5;
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
