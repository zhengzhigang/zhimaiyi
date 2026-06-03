import type { diseaseCateType, ISymptomListRes } from '@/api/common/index.typings'
import type { getLastConsultationRes, getLastDailyRes, getLastPulseRes } from '@/api/consultation/index.typings'
import { defineStore } from 'pinia'
import { deepClone } from 'sard-uniapp'
import { ref } from 'vue'

interface ConstitutionInfoType {
  id: number
  name: string
}
interface HerbsType {
  changeDose: number
  itemPrice: number
  convertRate: number
  dose: number
  drugId: number
  id: number
  libraryId: number
  keLiDose: number
  code: string
  itemName: string
  util: string
  stockout: number
  drugSpecialProcessingTypeName: string
  drugSpecialProcessingType: number
  specialProcessingTypeList: { id: number, name: string }[]
}
export interface SymptomType {
  id: number
  name: string
  label: string
  value: number[]
}
interface DailyType extends getLastDailyRes {
  dailyArr: {
    text: string
    name: string
  }[]
}
interface ConsultationType {
  employeeId: number | null
  orgId: number | null
  tongue: fileType[]
  face: fileType[]
  daily: DailyType
  constitutionInfo: getLastConsultationRes
  pulse: getLastPulseRes
  diseaseDesc: string
  symptoms0: ISymptomListRes[]
  symptoms1: ISymptomListRes[]
  symptoms2: ISymptomListRes[]
  symptoms3: ISymptomListRes[]
  report: fileType[]
  createTime: number
  send: number
  payload: {
    data: string
    description: string
    extension: string
  }
}
export interface fileType {
  name: string
  uploadUrl: string
}
// 初始化状态
const initialState: ConsultationType = {
  employeeId: null,
  orgId: null,
  tongue: [],
  face: [],
  daily: {} as DailyType,
  constitutionInfo: {} as getLastConsultationRes,
  // 脉象
  pulse: {} as getLastPulseRes,
  // 病情描述
  diseaseDesc: '',
  // 近期症状
  symptoms0: [],
  // 1年症状
  symptoms1: [],
  // 1年至5年症状
  symptoms2: [],
  // 5年以上症状
  symptoms3: [],
  report: [],
  createTime: 0,
  send: -1,
  payload: {
    data: '',
    description: '',
    extension: '',
  },
}
export const useConsultationStore = defineStore(
  'consultation',
  () => {
    // 定义咨询信息
    const consultationInfo = ref (deepClone(initialState))
    // 设置咨询信息
    const setConsultationInfo = (val) => {
      consultationInfo.value = {
        ...consultationInfo.value,
        ...val,
      }
    }

    // 删除咨询信息
    const init = () => {
      consultationInfo.value = deepClone(initialState)
      uni.removeStorageSync('consultation')
    }

    return {
      consultationInfo,
      setConsultationInfo,
      init,
    }
  },
  {
    persist: true,
  },
)
