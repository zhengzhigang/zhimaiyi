import type { ILoginForm, IUserInfoRes } from '@/api/login.typings'

import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  login as _login,
} from '@/api/login'
import { GenderType, RoleType } from '@/api/login.typings'

// 初始化状态
const userInfoState: IUserInfoRes = {
  id: 1185,
  loginName: '',
  headPic: '',
  addTime: 0,
  addUser: 0,
  address: '',
  areaId: '',
  bank: '',
  bankNo: '',
  birthday: 0,
  briefIntroduction: '',
  department: '',
  email: '',
  empCode: '',
  enableH5: '',
  enablePc: '',
  isDel: 0,
  isRecommend: 0,
  lebelNames: '',
  license: '',
  name: '游客',
  nation: '',
  notifyToChangePassword: false,
  orderSeparate: 0,
  orgId: 0,
  orgName: '',
  password: '',
  personalStudio: '',
  phone: '',
  picIdcardBack: '',
  picIdcardFront: '',
  picLicense: '',
  picTitle: '',
  receiveOrderLimit: 0,
  roleId: 0,
  sex: GenderType.Male,
  type: RoleType.UnLogin,
  typeName: '临时用户',
  updateTime: 0,
  updateUser: 0,
  idcard: '',
}
export const useUserStore = defineStore(
  'user',
  () => {
    // 定义用户信息
    const userInfo = ref<IUserInfoRes>({ ...userInfoState })
    const isLogin = computed(() => userInfo.value.id !== -1)
    // 设置用户信息
    const setUserInfo = (val: IUserInfoRes) => {
      console.log('设置用户信息', val)
      val.type = +val.type as RoleType
      switch (val.type) {
        case RoleType.Admin:
          val.typeName = '管理员'
          break
        case RoleType.PlatformManager:
          val.typeName = '平台管理员'
          break
        case RoleType.OrgManager:
          val.typeName = '机构管理员'
          break
        case RoleType.Sender:
          val.typeName = '配货员'
          break
        case RoleType.Doctor:
          val.typeName = '医生'
          break
        case RoleType.NurseAssistant:
          val.typeName = '医生助理'
          break
        case RoleType.HealthManager:
          val.typeName = '健康管理师'
          break
        default:
          val.typeName = '临时用户'
          break
      }
      userInfo.value = val
    }
    const setUserAvatar = (avatar: string) => {
      userInfo.value.headPic = avatar
      console.log('设置用户头像', avatar)
      console.log('userInfo', userInfo.value)
    }
    // 删除用户信息
    const clearUserInfo = () => {
      userInfo.value = { ...userInfoState }
      uni.removeStorageSync('user')
    }

    // 登录
    const login = async (loginForm: ILoginForm) => {
      const res = await _login(loginForm)
      console.log('🚀 ~ login ~ res:', res.data)
      setUserInfo(res.data)
      return res
    }

    return {
      userInfo,
      clearUserInfo,
      login,
      setUserInfo,
      setUserAvatar,
      isLogin,
    }
  },
  {
    persist: true,
  },
)
