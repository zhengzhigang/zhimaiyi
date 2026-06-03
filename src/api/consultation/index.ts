import type { ConsultationDetailType, ConsultationType, getDoctorOrgRes, getLastConsultationRes, getLastDailyRes, getLastPulseRes, InsertConsultationType, IsConsultingExistRes, ISearchEmpListParams, ISearchEmpListRes } from './index.typings'
import type { IResponse } from '@/http/types'
import { http } from '@/http/alova'

/**
 * 获取上次联系的医生/健康管理师
 * @param data 请求表单
 */
export function getLastEmployee(params: { userId: number }) {
  return http.Get<IResponse<ISearchEmpListRes>>('/api/employee/lastEmp', {
    params,
  })
}
/**
 * 搜索医生/健康管理师列表
 * @param data 请求参数
 * @returns 医生列表
 */
export function searchEmpList(data: ISearchEmpListParams) {
  return http.Post<IResponse<ISearchEmpListRes[]>>('/api/employee/searchEmpList', data, {
  })
}
/**
 * 推荐医生/健康管理师列表
 * @param data 请求参数
 * @returns 医生列表
 */
export function recommendEmpList(data: { limitNum: number }) {
  return http.Post<IResponse<ISearchEmpListRes[]>>('/api/employee/recommendEmpList', { ...data, useId: true }, {
    meta: {
      query: true,
      params: true,
    },
  })
}
/**
 * 医生列表/健康管理师列表
 * @param data 请求参数
 * @returns 医生列表
 */
export function employeeList() {
  return http.Post<IResponse<ISearchEmpListRes[]>>('/api/employee/employeeList', { useId: true }, {
    meta: {
      query: true,
      params: true,
    },
  })
}
/**
 * 是否有订单记录
 * @param data 请求参数
 * @returns 是否有订单记录
 */
export function isOrderExist({ employeeId }: { employeeId: number }) {
  return http.Post<IResponse<IsConsultingExistRes>>('/api/consultOrder/isConsultingExist', { useId: true, employeeId }, {
  })
}
/**
 * 是否有咨询记录
 * @param data 请求参数
 * @returns 是否有咨询记录
 */
export function isConsultingExist({ employeeId }: { employeeId: number }) {
  return http.Post<IResponse<IsConsultingExistRes>>('/api/consult/isConsultingExist', { useId: true, employeeId }, {
  })
}
/**
 * 是否有咨询记录
 * @param data 请求参数
 * @returns 是否有咨询记录
 */
export function getDoctorOrg({ employeeId }: { employeeId: number }) {
  return http.Post<IResponse<getDoctorOrgRes>>('/api/doctor/empOrg/detailOrgByEmpId', { employeeId }, {
  })
}
/**
 * 获取上次日常记录
 * @param data 请求参数
 * @returns 上次日常记录
 */
export function getLastDaily() {
  return http.Post<IResponse<getLastDailyRes>>('/api/dailySelfTest/getLast', { useId: true }, {
  })
}
/**
 * 获取上次体质记录
 * @param data 请求参数
 * @returns 上次体质记录
 */
export function getLastConsultation() {
  return http.Post<IResponse<getLastConsultationRes>>('/api/constitution/getLast', { useId: true }, {
    meta: {
      query: true,
      params: true,
    },
  })
}
/**
 * 获取上次体质记录
 * @param data 请求参数
 * @returns 上次体质记录
 */
export function consultOrderInsert(data: { employeeId: number, orgId: number, price: number }) {
  return http.Post<IResponse<number>>('/api/consultOrder/consultOrderInsert', { ...data, useId: true }, {
    meta: {
      query: true,
      params: true,
    },
  })
}
/**
 * 获取上次脉搏记录
 * @param data 请求参数
 * @returns 上次脉搏记录
 */
export function getLastPulse() {
  return http.Post<IResponse<getLastPulseRes>>('/api/pulseDiagnosisInfo/pulseDiagnosisResultLatest', { useId: true }, {
    meta: {
      query: true,
      params: true,
    },
  })
}
/**
 * 新增咨询记录
 * @param data 请求参数
 * @returns 咨询记录id
 */
export function insertConsultation(data: InsertConsultationType) {
  return http.Post<IResponse<number>>('/api/consult/consultInsert', { ...data, useId: true }, {
  })
}
