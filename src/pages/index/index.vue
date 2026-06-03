<template>
  <!-- <page-meta :root-font-size="`${this.$store.state.scaleFontSize}px`"></page-meta> -->
  <view
    class="index-page relative overflow-hidden bg-white"
  >
    <sar-status-bar />
    <sar-navbar />
    <image class="fixed left-0 top-0 z-1 w-full" mode="aspectFill" :src="assetsImgs[0]" />
    <view class="relative z-2 px-30rpx">
      <view class="flex items-center justify-between p-3">
        <image class="w-150rpx" mode="widthFix" :src="assetsImgs[5]" />
        <view class="mx-2 flex-1">
          <sar-ellipsis content="张三张三张三张三张三张三张三张三张三张三张三张三张三张三张三张三张三张三" />
          <view>1234567890</view>
        </view>
        <image class="w-150rpx" mode="widthFix" :src="assetsImgs[5]" />
      </view>
      <view class="my-3">
        <view class="flex justify-between">
          <view class="shadow-default item1 h-full w-330rpx center rounded-xl py-30rpx">
            <view class="mr-20rpx text-center">
              <view class="text-bold mb-10rpx text-34rpx">
                健康档案
              </view>
              <view class="text-24rpx">
                健康档案管理
              </view>
            </view>
            <image class="h-130rpx w-100rpx" src="@/static/images/index/card1.png" />
          </view>
          <view class="shadow-default item2 h-full w-330rpx center rounded-xl py-30rpx">
            <view class="mr-20rpx text-center">
              <view class="text-bold mb-10rpx text-34rpx">
                问诊记录
              </view>
              <view class="text-24rpx">
                问诊历史记录
              </view>
            </view>
            <image class="h-130rpx w-100rpx" src="@/static/images/index/card2.png" />
          </view>
        </view>
        <view class="mt-30rpx flex justify-between">
          <view class="shadow-default item3 h-full w-330rpx center rounded-xl py-30rpx" @click="handleClick('contactDoctor')">
            <view class="mr-20rpx text-center">
              <view class="text-bold mb-10rpx text-34rpx">
                联系医生
              </view>
              <view class="text-24rpx">
                专业医生解答
              </view>
            </view>
            <image class="h-130rpx w-100rpx" src="@/static/images/index/card3.png" />
          </view>
          <view class="shadow-default item4 h-full w-330rpx center rounded-xl py-30rpx">
            <view class="mr-20rpx text-center">
              <view class="text-bold mb-10rpx text-34rpx">
                自测自评
              </view>
              <view class="text-24rpx">
                自我评测
              </view>
            </view>
            <image class="h-130rpx w-100rpx" src="@/static/images/index/card4.png" />
          </view>
        </view>
      </view>
      <view class="relative">
        <image class="w-full" mode="widthFix" :src="assetsImgs[1]" />
        <view class="absolute bottom-16% left-0 w-full flex items-center justify-around">
          <image class="w-150rpx" mode="widthFix" :src="assetsImgs[2]" />
          <image class="w-150rpx" mode="widthFix" :src="assetsImgs[3]" />
          <image class="w-150rpx" mode="widthFix" :src="assetsImgs[4]" />
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup name="home">
definePage({
  style: {
    navigationBarTitleText: '首页',
    navigationStyle: 'custom',
  },
})

const assetsImgs = ref([
  `${__ASSETS__}/index/bg.png`,
  `${__ASSETS__}/index/bg2.png`,
  `${__ASSETS__}/index/b1.png`,
  `${__ASSETS__}/index/b2.png`,
  `${__ASSETS__}/index/b3.png`,
  `${__ASSETS__}/index/level.png`,
])
function handleClick(type) {
  if (type === 'contactDoctor') {
    uni.navigateTo({
      url: '/pages-consultation/index/index',
    })
  }
}
// 测试 uni API 自动引入
onLoad(() => {})
function card1() {
  uni.navigateTo({
    url: '/pages-cure/index/index',
  })
}
function handleConsult() {
  console.log('🚀 ~ handleConsult ~ handleConsult')
  uni.navigateTo({
    url: '/pages-tim/index',
  })
}
function handleRepository() {
  uni.navigateTo({
    url: '/pages-cure/repository/index',
  })
}
</script>

<style scoped>
.item1 {
  background-color: rgba(196, 154, 113, 0.3);
}
.item2 {
  background-color: rgba(189, 65, 66, 0.3);
}
.item3 {
  background-color: rgba(117, 146, 178, 0.3);
}
.item4 {
  background-color: rgba(161, 182, 134, 0.3);
}
</style>
