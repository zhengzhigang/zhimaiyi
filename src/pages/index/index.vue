<template>
  <!-- <page-meta :root-font-size="`${this.$store.state.scaleFontSize}px`"></page-meta> -->
  <view
    class="index-page relative overflow-hidden bg-white"
  >
  </view>
</template>

<script lang="ts" setup name="home">
definePage({
  style: {
    navigationBarTitleText: '首页',
    navigationStyle: 'custom',
  },
})

// 测试 uni API 自动引入
onLoad(() => {})
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
