<template>
  <sar-popout v-model:visible="visible" :show-close="false" confirm-text="取消">
    <view style="padding-left: 32rpx; padding-right: 32rpx">
      <view class="mb-32rpx text-center">
        请<span style="color: #FF4D4F;">选择机构</span>
        <span v-show="consultRegistrationFee > 0">并支付<span style="color: #FF4D4F;">{{ consultRegistrationFee }}元</span>费用
        </span>
        进行咨询
      </view>
      <sar-list>
        <sar-list-item v-for="item in itemList" :key="item.id" arrow :title="item.name" @click="handleClick(item)" />
      </sar-list>
    </view>
    <template #title>
      <view class="text-center">
        您要咨询的医生是<span style="color: #FF4D4F;">111</span>
      </view>
    </template>
  </sar-popout>
</template>

<script lang="ts" setup>
const emits = defineEmits(['confirm'])
const visible = ref(false)
const itemList = ref([
  { name: '全部', id: 1 },
  { name: '机构', id: 2 },
  { name: '科室', id: 3 },
])
function open() {
  visible.value = true
}
function handleClick(item) {
  uni.navigateTo({
    url: '/pages-consultation/consultation/first-step',
  })
}
defineExpose({
  open,
})
</script>

<style lang="scss" scoped>
// 医生卡片
</style>
