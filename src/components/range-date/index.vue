<template>
    <sar-popout
      v-model:visible="rangeVisible"
      show-cancel
      cancel-text="重置"
      title="范围选择"
      :before-close="beforeClose"
    >
      <sar-calendar
        v-model="rangeValue"
        value-format="YYYY-MM-DD"
        allow-same-day type="range"
      />
    </sar-popout>
</template>

<script lang="ts" setup>
const rangeValue = ref([])
const rangeVisible = ref(false)
const emits = defineEmits(['confirm', 'cancel'])
const open = () => {
  rangeVisible.value = true
}
function beforeClose(type) {
  if (type === 'confirm') {
    emits('confirm', rangeValue.value)
  }
  else if (type === 'cancel') {
    rangeValue.value = []
    emits('cancel')
  }
  rangeVisible.value = false
}
defineExpose({
  open,
  rangeValue: rangeValue.value,
})
</script>
<style scoped lang="scss">
.cure-index {
  height: 100vh;
}
</style>
