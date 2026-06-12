<template>
  <view class="user-card">
    <view class="user-card-header">
      <text class="user-card-title">请确认您的个人信息</text>
      <view v-if="editable" class="edit-button" @click="$emit('edit')">
        <image class="edit-button-bg" :src="editBackground" mode="scaleToFill" />
        <text class="edit-button-text">修改信息</text>
      </view>
    </view>
    <text class="user-info">姓名：{{ user.name }}</text>
    <text class="user-info">性别：{{ user.gender }}</text>
    <text class="user-info">出生日期：{{ user.birthday }}</text>
  </view>
</template>

<script setup lang="ts">
import editBackground from '../../assets/health-assessment/edit-info-bg.png'

withDefaults(defineProps<{
  user: Record<string, any>
  editable?: boolean
}>(), {
  editable: true,
})

defineEmits<{
  edit: []
}>()
</script>

<style scoped>
.user-card {
  margin: 48rpx 30rpx 34rpx;
  padding: 42rpx 46rpx 38rpx;
  border-radius: 20rpx;
  color: #fff;
  background: linear-gradient(180deg, #53d4d8, #20b7bf);
}

.user-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  margin-bottom: 30rpx;
}

.user-card-title {
  font-size: 30rpx;
  font-weight: 700;
}

.edit-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 162rpx;
  height: 60rpx;
  color: #07858d;
  font-size: 22rpx;
  font-weight: 600;
}

.edit-button-bg {
  position: absolute;
  width: 100%;
  height: 100%;
}

.edit-button-text {
  position: relative;
}

.user-info {
  display: block;
  margin-top: 20rpx;
  font-size: 28rpx;
  font-weight: 600;
}
</style>
