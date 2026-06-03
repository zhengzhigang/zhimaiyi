<template>
  <view class="cure-index">
    <z-paging
      ref="paging"
      v-model="dataList"
      auto-show-back-to-top
      @query="queryList"
    >
      <template #top>
        <sar-tabs
          :current="current"
          :list="tabsOptions"
          @change="handleChange"
        />
      </template>
      <view class="p-20rpx">
        <view v-for="(item, index) in dataList" :key="index" class="card" @click="handleClick(item)">
          <view class="card-content">
            <view class="flex items-center">
              <sar-tag theme="primary" size="large" plain mark="left">
                {{ item.date[1] }}
              </sar-tag>
              <sar-tag theme="primary" size="large" mark="right">
                {{ item.date[2] }}
              </sar-tag>
              <sar-ellipsis class="ml-20rpx flex-1 font-bold" :content="item.name" />
            </view>
            <view class="mt-20rpx">
              检测时间：{{ item.testingTime }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { TabOption } from 'sard-uniapp'
import { constitutionList, dailyList, emotionList, pulseList } from '@/api/health'
import { formatDate, formatGetArray } from '@/utils/format'

definePage({
  style: {
    navigationBarTitleText: '健康记录',
  },
})

const tabsOptions = ref<TabOption[]>([
  { title: '体质诊断' },
  { title: '脉象诊断' },
  { title: '日常表现' },
  { title: '情绪测评' },
])
const requestArr = [
  constitutionList,
  pulseList,
  dailyList,
  emotionList,
]
const pageArr = [
  '/constitution/detail',
  '/pulse/detail',
  '/daily/index',
  '/emotion/index',
]
const current = ref(0)
const paging = ref()
function handleChange(e) {
  current.value = e
  paging.value.reload(true)
}
const dataList = ref([])
async function queryList(page, size) {
  try {
    const res = await requestArr[current.value]({
      page,
      size,
    })
    const formatList = format(res.data)
    paging.value.complete(formatList)
  }
  catch (error) {
    paging.value.complete(false)
  }
}
function format(list) {
  if (current.value === 0) {
    return list.map(item => ({
      name: item.qualityTypeName,
      date: formatGetArray(item.addDateStr),
      id: item.id,
      testingTime: item.addDateStr,
    }))
  }
  else if (current.value === 1) {
    return list.historyList.map(item => ({
      name: item.pulseManifestationName,
      date: formatGetArray(item.diagnosisTimeStr),
      id: item.id,
      testingTime: item.diagnosisTimeStr,
    }))
  }
  else if (current.value === 2) {
    return list.map(item => ({
      name: '日常表现',
      date: formatGetArray(item.addTime),
      id: item.id,
      testingTime: formatDate(item.addTime),
    }))
  }
  else if (current.value === 3) {
    return list
  }
}
function handleClick(item) {
  uni.navigateTo({
    url: `/pages-health${pageArr[current.value]}?id=${item.id}`,
  })
}
</script>

<style lang="scss" scoped>
.card {
  align-items: center;
  border-radius: 20rpx;
  background-color: $secondary-color;
  overflow: hidden;
  border: 2rpx solid $secondary-color;
  border-left-width: 10rpx;
  margin-bottom: 20rpx;
  &-content {
    background-color: #fff;
    border-radius: 20rpx;
    padding: 20rpx;
  }
}
</style>
