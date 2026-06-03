<template>
  <sar-upload
    v-model="fileList"
    root-class="component-img-upload"
    :after-read="afterRead"
    :max-count="maxCount"
    :removable="removable"
    :disabled="disabled"
    :readonly="readonly"
    :before-choose="beforeChoose"
    @remove="onRemove"
  >
    <template v-if="hideList" #default="{ onSelect }">
      <view @click="onSelect">
        <slot name="select" />
      </view>
    </template>
  </sar-upload>
</template>

<script lang="ts" setup>
import type { UploadFileItem, UploadProps } from 'sard-uniapp'
import { uniUploadFile } from '@/api/common'
import { showToast } from '@/utils/toast'

const props = defineProps({
  fileList: {
    type: Array as PropType<UploadFileItem[]>,
    default: () => [],
  },
  maxCount: {
    type: Number,
    default: 4,
  },
  accept: {
    type: String,
    default: 'image',
  },
  removable: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  hideList: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['uploadSuccess', 'change'])
const fileList = ref<UploadFileItem[]>(props.fileList)
watch(
  () => props.fileList,
  (newVal) => {
    fileList.value = [...newVal]
  },
)
const beforeChoose: UploadProps['beforeChoose'] = (fileList, next) => {
  console.log(fileList)

  uni.showActionSheet({
    itemList: ['拍摄', '从相册选择'],
    success(res) {
      if (res.tapIndex === 0) {
        next({
          sourceType: ['camera'],
        })
      }
      else if (res.tapIndex === 1) {
        next({
          sourceType: ['album'],
        })
      }
    },
    fail() {
      next(false)
    },
  })
}

async function afterRead(fileItem: UploadFileItem) {
  console.log('🚀 ~ afterRead ~ fileItem:', fileItem)
  fileItem.status = 'uploading'
  fileItem.message = '正在上传'
  fileList.value = [...fileList.value]

  try {
    const url = await uniUploadFile(fileItem.file.path)
    fileItem.uploadUrl = url
    fileItem.file.path = import.meta.env.VITE_APP_IMAGE_BASEURL + url
    fileItem.status = 'done'
    fileItem.message = '上传成功'
    fileList.value = [...fileList.value]
    setTimeout(() => {
      emit('uploadSuccess', fileItem)
    }, 500)
  }
  catch (error) {
    fileItem.status = 'failed'
    fileItem.message = '上传失败'
    fileList.value = [...fileList.value]
  }
}
defineExpose({
  fileList,
})
function onRemove(index: number) {
  console.log('remove', index)
  emit('change', fileList.value)
}
</script>

<style lang="scss" scoped></style>
