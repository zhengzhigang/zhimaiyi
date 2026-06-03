<template>
  <view class="items-flex-start flex bg-white p-2">
    <sar-avatar class="shadow-default mr-3" src="avatar" size="80rpx" />
    <view class="flex-1">
      <view class="flex items-center">
        <view class="flex-1">
          <sar-ellipsis root-class="font-bold" content="employeeName" :max-lines="1" />
        </view>
        <sar-tag size="large" theme="primary" class="shadow-default mx-3">
          咨询
        </sar-tag>
      </view>
      <view>
        咨询费：100元
      </view>
      <view>
        <sar-tag v-for="i in 10" :key="i" theme="primary" plain>
          标签
        </sar-tag>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
</script>

<style lang="scss" scoped>
// 医生卡片
</style>
