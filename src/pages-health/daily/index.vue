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
        :key="index"
        class="shadow-default mt-20rpx"
      >
        <view class="relative left--32rpx my-20rpx flex">
          <sar-tag theme="primary" mark="right" size="large">
            0{{ index + 1 }}
          </sar-tag>
          <view class="ml-20rpx text-30rpx font-bold">
            {{ item.name }}
          </view>
        </view>
        <sar-list>
          <sar-list-item v-for="(x, y) in item.option" :key="y" :title="x" @click="handleChecked(item.prop, y, item.option)">
            <template #value>
              <sar-radio readonly :checked="selected[item.prop].includes(y)" />
            </template>
          </sar-list-item>
        </sar-list>
      </sar-card>
      <sar-button class="shadow-default !my-30rpx" round>
        提交
      </sar-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user'
import { question } from '@/utils/dailyPerformance'

definePage({
  style: {
    navigationBarTitleText: '日常检测',
  },
})
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)
const formatQuestion = computed(() => {
  if (userInfo.value.sex === 1) {
    return question.splice(5, 6)
  }
  return question
})
const selected = ref({})
question.forEach((item) => {
  const last = item.option.length - 1
  selected.value[item.prop] = [last]
})
function handleChecked(prop, y, option) {
  const length = option.length
  const last = length - 1
  const isLast = y === last
  const isChecked = selected.value[prop].includes(y)
  if (isLast && isChecked) {
    return
  }
  else if (isLast && !isChecked) {
    selected.value[prop] = [y]
  }
  else if (isChecked) {
    selected.value[prop] = selected.value[prop].filter(item => item !== y)
    if (selected.value[prop].length === 0) {
      selected.value[prop] = [last]
    }
  }
  else {
    selected.value[prop].push(y)
    if (selected.value[prop].includes(last)) {
      selected.value[prop] = selected.value[prop].filter(item => item !== last)
    }
  }
}
</script>

<style scoped lang="scss">
</style>
