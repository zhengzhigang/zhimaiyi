import type { ConsultationDetailType } from '../consultation/index.typings'
import type { ConsultDetailReq, ConsultDetailRes, ConsultListGroupByUserReq, ConsultListGroupByUserRes } from './index.typings'
import type { IResponse } from '@/http/types'
import { http } from '@/http/alova'

/**
 * 获取咨询列表
 * @param data 请求表单
 */
export function consultListGroupByUser(data: ConsultListGroupByUserReq) {
  return http.Post<IResponse<ConsultListGroupByUserRes[]>>('/api/doctor/consult/consultListGroupByUser', data, {
    meta: {
      query: true,
      params: true,
    },
  })
}
/**
 * 添加聊天记录
 * @param data 请求表单
 */
export function addConsult(data: ConsultDetailReq) {
  return http.Post<IResponse<ConsultDetailRes>>('/api/consultDetail/addConsultDetail', data, {
  })
}
/**
 * 获取腾讯用户签名
 * @param data 请求表单
 */
export function getTencentUserSig(data: { type: number, userId: number }) {
  return http.Get<IResponse<string>>('/api/tencent/getUserSig', {
    params: data,
  })
}
/**
 * 获取咨询详情列表
 * @param data 请求表单
 */
export function getConsultDetailList(data: { consultId: number }) {
  return http.Get<IResponse<string>>('/api/doctor/consultDetail/consultDetailList', {
    params: data,
  })
}
/**
 * 获取咨询记录详情
 * @param data 请求参数
 * @returns 咨询记录详情
 */
export function getConsultationDetail(data: { consultId: number, isRead: number }) {
  return http.Post<IResponse<ConsultationDetailType>>('/api/consult/consultDetail', data, {
    meta: {
      query: true,
      params: true,
    },
  })
}
/**
 * 获取咨询记录详情列表
 * @param data 请求参数
 * @returns 咨询记录详情列表
 */
export function getConsultationDetailList(data: { consultId: number }) {
  return http.Get<IResponse<ConsultDetailRes[]>>('/api/consultDetail/consultDetailList', {
    params: data,
  })
}
