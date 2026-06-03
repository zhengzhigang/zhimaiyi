import type {
  ICaptcha,
  ILoginForm,
  IUpdateInfo,
  IUpdatePassword,
  IUserInfoRes,
  IUserLogin,
} from './login.typings'
import type { IUpdatePasswordForm } from './userInfo.typings'
import type { IResponse } from '@/http/types'
import { http } from '@/http/alova'

/**
 * 用户登录
 * @param loginForm 登录表单
 */
export function login(loginForm: ILoginForm) {
  return http.Post<IResponse<IUserInfoRes>>('/api/doctor/login/accountLogin', loginForm, {
    meta: {
      query: true,
      params: true,
    },
  })
}

/**
 * 退出登录
 */
export function logout() {
  return http.Get<void>('/user/logout')
}

/**
 * 修改用户信息
 */
export function updateInfo(data: IUpdateInfo) {
  return http.Post('/user/updateInfo', data)
}

/**
 * 修改用户密码
 */
export function updatePassword(form: IUpdatePasswordForm) {
  return http.Post<void>('/api/doctor/employee/updatePassword', form)
}

/**
 * 获取微信登录凭证
 * @returns Promise 包含微信登录凭证(code)
 */
export function getWxCode() {
  return new Promise<UniApp.LoginRes>((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: res => resolve(res),
      fail: err => reject(new Error(err)),
    })
  })
}

/**
 * 微信登录参数
 */

/**
 * 微信登录
 * @param params 微信登录参数，包含code
 * @returns Promise 包含登录结果
 */
export function wxLogin(data: { code: string }) {
  return http.Post<IUserLogin>('/user/wxLogin', data)
}
