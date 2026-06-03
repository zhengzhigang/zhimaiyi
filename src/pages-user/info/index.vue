<template>
  <view class="p-20rpx">
    <sar-form ref="formRef" :model="ruleForm" :rules="rules" label-align="start" star-position="right">
      <sar-card title="基本信息" class="shadow-default">
        <sar-form-item label="个人头像" name="headImageUrl">
          <button
            class="avatar-btn"
            open-type="chooseAvatar"
            @chooseavatar="handleChooseAvatar"
          >
            <sar-avatar
              :src="ruleForm.headImageUrl"
              class="avatar-img"
            />
          </button>
        </sar-form-item>
        <sar-form-item label="真实姓名" name="username">
          <sar-input
            v-model="ruleForm.username"
            clearable
            inlaid
            :maxlength="10"
            placeholder="请输入真实姓名"
          />
        </sar-form-item>
        <sar-form-item label="性别" name="sex">
          <sar-picker-input
            v-model="ruleForm.sex"
            clearable
            placeholder="请选择性别"
            :columns="[
              { label: '男', value: 1 },
              { label: '女', value: 2 },
            ]"
          />
        </sar-form-item>
        <sar-form-item label="出生日期" required name="birthday">
          <sar-datetime-picker-input
            v-model="ruleForm.birthday"
            clearable
            type="yMd"
            placeholder="请选择出生日期"
          />
        </sar-form-item>
        <sar-form-item label="手机号" name="phone">
          <sar-input
            v-model="ruleForm.phone"
            clearable
            inlaid
            :maxlength="11"
            placeholder="请输入手机号"
          />
        </sar-form-item>
        <sar-form-item label="民族" name="nation">
          <sar-picker-input
            v-model="ruleForm.nation"
            clearable
            placeholder="请选择民族"
            :columns="ethnicOptions"
          />
        </sar-form-item>
        <sar-form-item label="城市" name="usualLivingCity">
          <sar-cascader-input
            v-model="ruleForm.usualLivingCity"
            title="请选择省市区"
            placeholder="请选择省市区"
            clearable
            :options="regionData"
            :option-keys="{ label: 'name', value: 'code' }"
          />
        </sar-form-item>
        <sar-form-item label="身份证号" name="idCard">
          <sar-input
            v-model="ruleForm.idCard"
            clearable
            inlaid
            :maxlength="18"
            placeholder="请输入身份证号"
          />
        </sar-form-item>
      </sar-card>
      <sar-card title="身高体重参数" class="shadow-default mt-20rpx">
        <sar-form-item label="身高" name="height">
          <sar-input
            v-model="ruleForm.height"
            clearable
            inlaid
            type="number"
            placeholder="请输入身高"
          >
            <template #append>
              <view>
                cm
              </view>
            </template>
          </sar-input>
        </sar-form-item>
        <sar-form-item label="体重" name="weight">
          <sar-input
            v-model="ruleForm.weight"
            clearable
            inlaid
            type="number"
            placeholder="请输入体重"
          >
            <template #append>
              <view>
                kg
              </view>
            </template>
          </sar-input>
        </sar-form-item>
      </sar-card>
      <sar-button class="shadow-default !mt-20rpx" round @click="submitForm">
        确定
      </sar-button>
    </sar-form>
  </view>
</template>

<script setup lang="ts">
import type { FieldValidateError, FormExpose, FormRules } from 'sard-uniapp'
import { getCities, mapCities, mapProvinces } from 'region-data'
import {

  toast,
} from 'sard-uniapp'
import { uniUploadFile } from '@/api/common'
import { ethnicOptions } from './utils'

const regionData = getCities()
const formRef = ref()
const ruleForm = ref({
  headImageUrl: '',
  username: '',
  sex: 1,
  birthday: '',
  phone: '',
  usualLivingCity: '',
  usualLivingCityCode: null,
  nation: '',
  idCard: '',
  weight: '',
  height: '',
})
async function handleChooseAvatar(e: any) {
  const { avatarUrl } = e.detail
  if (avatarUrl) {
    const url = await uniUploadFile(avatarUrl)
    ruleForm.value.headImageUrl = url
  }
}
definePage({
  style: {
    navigationBarTitleText: '用户信息',
  },
})
const visible = ref(false)

const rules = ref<FormRules>({
  headImageUrl: [
    { required: true, message: '请上传头像', trigger: 'change' },
  ],
  username: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '真实姓名长度必须在2到10个字符之间', trigger: 'blur' },
  ],
  sex: [
    { required: true, message: '请选择性别', trigger: 'change' },
  ],
  birthday: [
    { required: true, message: '请选择出生日期', trigger: 'change' },
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { min: 11, max: 11, message: '手机号长度必须为11个字符', trigger: 'blur' },
  ],
})
function getProvinceName(cityCode: string | number): string {
  const code = String(cityCode).padStart(6, '0')
  const provinceCode = `${code.substring(0, 2)}0000`
  const province = mapProvinces[provinceCode]
  return province || ''
}

async function submitForm() {
//   await formRef.value.validate()
  console.log('🚀 ~ submitForm ~ ruleForm.value:', ruleForm.value)

  const cityCode = ruleForm.value.usualLivingCity
  const provinceName = getProvinceName(cityCode)
  console.log('🚀 ~ submitForm ~ 省名:', provinceName)
}
</script>

<style scoped lang="scss">
.avatar-btn {
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  outline: none;
  line-height: normal;
  border-radius: 0;
  font-size: inherit;
  color: inherit;
  text-align: right;
  display: block;
  margin-left: auto;

  &::before,
  &::after {
    display: none;
  }
}
</style>
