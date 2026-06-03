<template>
  <view class="relative h-100vh w-full overflow-y-auto">
    <view class="absolute h-300rpx w-full bg-[#14b2ba]" />
    <view class="shadow-default relative top-200rpx mx-20rpx rounded-xl bg-white py-20rpx">
      <view class="pt-4 text-center">
        需要绑定您的手机号才能体验全部功能
      </view>
      <view class="mt-20rpx text-center text-32rpx text-[#14b2ba] font-bold">
        绑定手机号
      </view>

      <view class="px-20rpx">
        <view class="mb-20rpx">
          <view class="mb-20rpx">
            手机号
          </view>
          <sar-input
            v-model="phone"
            type="tel"
            placeholder="请输入手机号"
            clearable
          />
        </view>
        <view class="mb-20rpx">
          <view class="mb-20rpx">
            验证码
          </view>
          <view class="flex items-center justify-between">
            <sar-input
              v-model="sms"
              type="digit"
              placeholder="请输入短信验证码"
              clearable
              class="mr-20rpx flex-1"
            />
            <sar-button
              size="small"
              :disabled="disabled"
              inline
              class="shadow-default"
              @click="sendSms"
            >
              {{ btnTxt }}
            </sar-button>
          </view>
        </view>
      </view>

      <view class="m-20rpx mt-80rpx">
        <view class="flex items-center" @click="checked = !checked">
          <sar-checkbox :checked="checked" />
          <view class="ml-20rpx">
            我已阅读并同意
            <text class="text-color-secondary" @click.stop="hasRead">用户协议</text>
            和
            <text class="text-color-secondary" @click.stop="hasRead1">隐私协议</text>
          </view>
        </view>
      </view>

      <sar-button
        class="shadow-default !mx-20rpx"
        :disabled="!isClick"
        @click="submit"
      >
        确定
      </sar-button>

      <view class="text-color-secondary my-40rpx text-center" @click="visible = true">
        无法获取验证码？
      </view>
    </view>

    <sar-popout v-model:visible="readShow0" title="用户协议" position="bottom">
      <view class="h-70vh overflow-y-auto">
        <user-agreement />
      </view>
    </sar-popout>
    <sar-popout v-model:visible="readShow1" title="隐私协议" position="bottom">
      <view class="h-70vh overflow-y-auto">
        <user-privacy />
      </view>
    </sar-popout>
    <sar-dialog
      v-model:visible="visible"
      title="无法获取验证码？"
      :show-close="false"
      :show-cancel="false"
    >
      <view class="p-20rpx pb-40rpx">
        <p>可能原因有：</p>
        <p>1. 手机通信不畅或已停机</p>
        <p>2. 手机号非大陆手机号</p>
        <p>3. 手机是否拦截了短信、以及是否禁用了网络</p>
      </view>
    </sar-dialog>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { showToast } from '@/utils/toast'
import UserAgreement from '../components/UserAgreement.vue'
import UserPrivacy from '../components/UserPrivacy.vue'

definePage({
  style: {
    navigationBarTitleText: '绑定手机号',
  },
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const visible = ref(false)

const phone = ref('')
const sms = ref('')
const checked = ref(false)
const disabled = ref(false)
const btnTxt = ref('发送验证码')
const readShow0 = ref(false)
const readShow1 = ref(false)

const isClick = computed(() => {
  return !phone.value || !sms.value
})

function hasRead() {
  readShow0.value = true
}

function hasRead1() {
  readShow1.value = true
}

function validatePhone() {
  if (!phone.value) {
    showToast('未输入手机号码')
    return false
  }
  else if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    showToast('手机号码格式不正确')
    return false
  }
  return true
}

function validateBtn() {
  let time = 60
  const timer = setInterval(() => {
    if (time === 0) {
      clearInterval(timer)
      disabled.value = false
      btnTxt.value = '获取验证码'
    }
    else {
      btnTxt.value = `${time}秒后重试`
      disabled.value = true
      time--
    }
  }, 1000)
}

async function sendSms() {
  if (validatePhone()) {
    validateBtn()
    // TODO: 调用发送验证码接口
    try {
      // await sendSms({ telephone: phone.value })
      showToast('验证码发送成功')
    }
    catch (error) {
      console.error(error)
    }
  }
}

function showTips() {
//   showDialog({
//     title: '无法获取验证码？',
//     message: '<p>可能原因有：</p><p>1. 手机通信不畅或已停机</p><p>2. 手机号非大陆手机号</p><p>3. 手机是否拦截了短信、以及是否禁用了网络</p>',
//     confirmButtonText: '我知道了',
//     confirmButtonColor: '#CC953D',
//   })
}

async function submit() {
  if (!checked.value) {
    showToast('需要阅读并同意用户协议和隐私协议才能提交')
    return
  }

  try {
    // TODO: 调用验证验证码接口
  }
  catch (error) {
    // hideLoading()
    showToast('验证失败，请重试')
    console.error(error)
  }
}
</script>

<style scoped lang="scss">
.cell-group {
  .cell-item {
    position: relative;
    padding: 0.5rem 0;
  }

  .cell-label {
    margin-bottom: 0.5rem;
  }

  &::after {
    border: none;
  }
}
</style>
