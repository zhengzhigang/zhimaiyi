<template>
  <!-- <page-meta :root-font-size="`${this.$store.state.scaleFontSize}px`"></page-meta> -->
  <view
    class="h-screen w-screen overflow-hidden overflow-y-auto bg-gray-100"
  >
  </view>
</template>

<script lang="ts" setup name="home">
definePage({
  style: {
    navigationBarTitleText: '我的',
    navigationStyle: 'custom',
  },
})
// 测试 uni API 自动引入
onLoad(() => {})
</script>

<style scoped lang="scss">
</style>
