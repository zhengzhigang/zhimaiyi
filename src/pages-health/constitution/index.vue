<template>
  <view>
    <sar-notice-bar
      color="var(--sar-primary)"
      background="rgba(var(--sar-primary-rgb), 0.1)"
    >
      请您根据自身情况回答以下问题，辅助医生辨识身体情况
    </sar-notice-bar>
    <view class="p-20rpx">
      <sar-card
        root-style="
          --sar-card-bg: #14b2ba;
          --sar-card-border-color: white;
          --sar-card-active-bg: rgba(20, 178, 186, 0.9);
          --sar-card-footer-border-style: dashed;
          --sar-card-border-width: 2px;
          color: white;
        "
        class="shadow-default"
        title="请确认您的个人信息"
      >
        <template #extra>
          <sar-button class="shadow-default" size="small" background="#FFF" type="outline" round>
            修改信息
          </sar-button>
        </template>
        <view>
          <view class="my-20rpx">
            姓名：张三
          </view>
          <view class="my-20rpx">
            性别：男
          </view>
          <view class="my-20rpx">
            出生年月：2000-01-01
          </view>
        </view>
      </sar-card>
      <sar-card
        v-for="(item, index) in question"
        v-show="showMinMax[0] <= index && index <= showMinMax[1] && (!item.sex || item.sex === userInfo.sex)"
        :key="index"
        class="shadow-default mt-20rpx"
      >
        <view class="relative left--32rpx my-20rpx flex">
          <sar-tag theme="primary" mark="right" size="large">
            {{ item.num }}
          </sar-tag>
          <view class="ml-20rpx text-30rpx font-bold">
            {{ item.title }}
          </view>
        </view>
        <view class="flex items-center justify-between border-x-width-0 border-y-width-1rpx border-solid" style="border-color:var(--sar-border-color)">
          <view v-for="(x, y) in item.option" :key="y" class="item-center flex py-20rpx" @click="handleChecked(index, x.value)">
            <sar-radio class="mr-10rpx" readonly :checked="selected[index] === x.value" />
            {{ x.label }}
          </view>
        </view>
      </sar-card>
      <view class="flex items-center justify-between">
        <view v-show="currentPage === 0" />
        <sar-button v-show="currentPage !== 0" class="shadow-default !my-30rpx" round inline type="outline" @click="currentPage--">
          上一步
        </sar-button>
        <sar-button v-show="currentPage !== 2" class="shadow-default !my-30rpx" round inline @click="handleNext">
          下一步
        </sar-button>
        <sar-button v-show="currentPage === 2" class="shadow-default !my-30rpx" round inline @click="submit">
          提&emsp;交
        </sar-button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user'
import { showToast } from '@/utils/toast'
import { question } from './utils/index'

definePage({
  style: {
    navigationBarTitleText: '体质检测',
  },
})

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)
const currentPage = ref(0)
const showMinMax = computed(() => {
  if (currentPage.value === 0) {
    return [0, 9]
  }
  else if (currentPage.value === 1) {
    return [10, 19]
  }
  else {
    return [20, 100]
  }
})
const selected = ref(Array.from({ length: question.length }).fill(0))
function handleChecked(index, y) {
  selected.value[index] = y
}
function verify() {
  const [min, max] = showMinMax.value
  let allSelected = true
  let firstUnselectedIndex = -1

  for (let i = min; i <= max && i < selected.value.length; i++) {
    if (selected.value[i] === 0) {
      allSelected = false
      firstUnselectedIndex = i
      break
    }
  }

  if (!allSelected) {
    showToast(`请完成第 ${question[firstUnselectedIndex]?.num || firstUnselectedIndex + 1} 题`)
    return false
  }
  return true
}
function handleNext() {
  // if (!verify()) {
  //   return
  // }
  currentPage.value++
}
function submit() {
  if (!verify()) {
    return
  }
  console.log(selected.value)
  uni.showToast({
    title: '提交成功',
    icon: 'success',
  })
}
</script>

<style scoped lang="scss">
</style>
