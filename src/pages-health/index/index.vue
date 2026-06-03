<template>
  <view class="cure-index">
    <z-paging
      ref="paging"
      v-model="dataList"
      auto-show-back-to-top
      use-page-scroll
      class="myPaging"
      @query="queryList"
      @on-refresh="onRefresh"
    >
      <view class="bg-white">
        <sar-search
          v-model="userName"
          :maxlength="11"
          placeholder-left
          placeholder="请输入患者姓名"
          custom-class="search-input"
          custom-input-class="search-input-input"
          @update:model-value="handleChange"
        >
          <template #suffix>
            <sar-icon
              name="user-add"
              custom-class="search-input-suffix-icon"
              size="22px"
            />
          </template>
        </sar-search>
      </view>
      <view class="px-3">
        <view class="mt-3">
          <view class="flex items-center">
            <span class="bg-color-secondary mr-3 inline-block h-36rpx w-8rpx" />
            <span class="text-32rpx font-bold">上次联系的医生/健康管理师</span>
          </view>
          <view class="shadow-default mt-3 overflow-hidden rounded-xl">
            <DoctorItem />
          </view>
        </view>
        <view class="mt-6">
          <view class="flex items-center">
            <span class="bg-color-secondary mr-3 inline-block h-36rpx w-8rpx" />
            <span class="text-32rpx font-bold">我关注的医生</span>
          </view>
          <view class="mt-2 flex justify-around">
            <view class="w-200rpx">
              <view class="doctor-card shadow-default">
                <sar-avatar src="avatar" size="100rpx" class="shadow-default absolute top--50rpx" />
                <sar-ellipsis root-class="font-bold relative top--35rpx" content="employeeName" :max-lines="1" />
                <view class="relative top--20rpx text-24rpx text-gray-500">
                  20元/次
                </view>
                <sar-button class="relative top--10rpx" theme="success" size="small" background="#14b2ba" round>
                  立即咨询
                </sar-button>
              </view>
            </view>
            <view class="w-200rpx">
              <view class="doctor-card shadow-default">
                <sar-avatar src="avatar" size="100rpx" class="shadow-default absolute top--50rpx" />
                <sar-ellipsis root-class="font-bold relative top--35rpx" content="employeeName" :max-lines="1" />
                <view class="relative top--20rpx text-24rpx text-gray-500">
                  20元/次
                </view>
                <sar-button class="relative top--10rpx" theme="success" size="small" background="#14b2ba" round>
                  立即咨询
                </sar-button>
              </view>
            </view>
            <view class="w-200rpx">
              <view class="doctor-card shadow-default">
                <sar-avatar src="avatar" size="100rpx" class="shadow-default absolute top--50rpx" />
                <sar-ellipsis root-class="font-bold relative top--35rpx" content="employeeName" :max-lines="1" />
                <view class="relative top--20rpx text-24rpx text-gray-500">
                  20元/次
                </view>
                <sar-button class="relative top--10rpx" theme="success" size="small" background="#14b2ba" round @click="handleConsult(item)">
                  立即咨询
                </sar-button>
              </view>
            </view>
          </view>
        </view>
        <view class="mt-6">
          <view class="flex items-center">
            <span class="bg-color-secondary mr-3 inline-block h-36rpx w-8rpx" />
            <span class="text-32rpx font-bold">快速找医生</span>
          </view>
          <view class="mt-2 rounded-xl bg-white">
            <sar-tabs v-model:current="current" :list="doctorTypeOptions" />
            <!-- <sar-tabs v-model:current="current" class="mt-2" type="card" :list="searchTypeOptions" /> -->
            <sar-dropdown root-class="consultation-index">
              <sar-dropdown-item v-model="value0" :options="options0" />
              <sar-dropdown-item v-model="value1" :options="options1" />
              <sar-dropdown-item v-model="value2" :options="options2" />
            </sar-dropdown>
            <DoctorItem v-for="(item, index) in dataList" :key="index" :item="item" />
          </view>
        </view>
      </view>
    </z-paging>
    <DoctorOrg ref="doctorOrg" />
  </view>
</template>

<script lang="ts" setup>
import type { SwipeActionVisible, TabOption } from 'sard-uniapp'
import { searchEmpList } from '@/api/consultation'
import DoctorOrg from '../components/DoctorOrg.vue'
import DoctorItem from './components/DoctorItem.vue'

definePage({
  style: {
    navigationBarTitleText: '找医生',
  },
})
const doctorOrg = ref()
function openDoctorOrg() {
  doctorOrg.value.open()
}
const current = ref(0)
const doctorTypeOptions = ref([
  { title: '医生', id: 1 },
  { title: '健康管理师', id: 2 },
])
const searchTypeOptions = ref([
  { title: '全部', id: 1 },
  { title: '机构', id: 2 },
  { title: '科室', id: 3 },
])
const value0 = ref('1')
const options0 = [
  {
    label: '全部',
    value: '1',
  },
]
const options1 = [
  {
    label: '距离优先距离优先距离优先距离优先距离优先距离优先距离优先',
    value: '1',
  },
  {
    label: '速度优先',
    value: '2',
  },
  {
    label: '评分优先',
    value: '3',
  },
]
const options2 = [
  {
    label: '30分钟内',
    value: '1',
  },
  {
    label: '40分钟内',
    value: '2',
  },
  {
    label: '50分钟内',
    value: '3',
  },
]

const value1 = ref('1')
const value2 = ref('1')
const paging = ref()
const userName = ref('')
function handleChange(e) {
  console.log(e)
  paging.value.reload(true)
}
const dataList = ref([])
const swipeArr = ref<SwipeActionVisible[]>([])
function onRefresh() {
  swipeArr.value = []
}
async function queryList(page, size) {
  console.log('🚀 ~ queryList ~ size:', size)
  try {
    // const res = await searchEmpList({
    //   page,
    //   size,
    //   name: userName.value,
    // })
    // if (res.data.length > 0) {
    //   paging.value.complete(res.data)
    //   const arr = Array.from({ length: res.data.length }).fill(false) as SwipeActionVisible[]
    //   swipeArr.value.push(...arr)
    // }
    const arr = Array.from({ length: size }).fill(false)
    dataList.value.push(...arr)
    paging.value.complete(arr)
  }
  catch (error) {
    page--
    paging.value.complete(false)
  }
}
function handleSwipeStatus(visible: SwipeActionVisible, key: number) {
  swipeArr.value = swipeArr.value.map((_, i) => (i === key ? visible : false))
}
function handleConsult(item) {
  openDoctorOrg()
//   uni.navigateTo({
//     url: '/pages-consultation/consultation/first-step',
//   })
}
onPageScroll((e) => {
  paging.value.updatePageScrollTop(e.scrollTop)
})
onReachBottom(() => {
  paging.value.pageReachBottom()
})
</script>

<style lang="scss" scoped>
.search-input {
  width: 100%;
  padding: 0;
}

.search-input-suffix-icon {
  color: $primary-color;
}

.cure-index {
  background-color: $primary-color-background;
}

.cure-index-list {
  flex: 1;
  background-color: $primary-color-background;
}
.consultation-index :deep(.sar-dropdown-item__value) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doctor-card {
  margin-top: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 20rpx;
  background-color: #ffffff;
  padding: 24rpx;
  padding-top: 20rpx;
}
</style>
