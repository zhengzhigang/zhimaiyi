import type { getLastConsultationRes, getLastDailyRes } from '../consultation/index.typings'
import type { getConsultationRes, getPulseRes } from './index.typings'
import type { IResponse } from '@/http/types'
import { http } from '@/http/alova'

/**
 * 获取体质记录列表
 * @param data 请求参数
 * @returns 体质记录列表
 */
export function constitutionList(data: { page: number, size: number }) {
  return http.Post<IResponse<getConsultationRes[]>>('/api/constitution/getList', { ...data, useId: true }, {
    meta: {
      query: true,
      params: true,
    },
  })
}
/**
 * 获取脉搏记录列表
 * @param data 请求参数
 * @returns 脉搏记录列表
 */
export function pulseList(data: { page: number, size: number }) {
  return http.Post<IResponse<{ historyList: getPulseRes[] }>>('/api/pulseDiagnosisInfo/historyList', { ...data, useId: true }, {
    meta: {
      query: true,
      params: true,
    },
  })
}
/**
 * 获取日常记录列表
 * @param data 请求参数
 * @returns 日常记录列表
 */
export function dailyList(data: { page: number, size: number }) {
  return http.Post<IResponse<getLastDailyRes[]>>('/api/dailySelfTest/dailySelfTestList', { ...data, useId: true }, {
  })
}
/**
 * 获取情绪记录列表
 * @param data 请求参数
 * @returns 情绪记录列表
 */
export function emotionList(data: { page: number, size: number }) {
  return http.Post<IResponse<getLastConsultationRes[]>>('/api/emotionTest/historyList', { ...data, useId: true }, {
  })
}
