import type { empOrgDetail, empOrgDetailRes, IUpdatePasswordForm } from './userInfo.typings'
import type { IResponse } from '@/http/types'
import { http } from '@/http/alova'

/**
 * 获取开药机构详情
 * @param loginForm 请求表单
 */
export function getUserInfoByCode(form: { code: string }) {
  return http.Get<IResponse<empOrgDetailRes>>('/api/wechatUser/getUserInfoByCode', {
    params: form,
  })
}
