export interface ConsultListGroupByUserReq {
  userName: string
  useEmployeeId: boolean
  startDate?: string
  endDate?: string
}

export interface ConsultListGroupByUserRes {
  id: number
  customerId: number
  userId: number
  userName: string
  userHeadImgUrl: null | string
  sex: number
  age: number
  phone: string
  constitutionId: null | string
  constitutionName: string
  addTimeStr: string
  symptomIds: string
  symptomNames: null | string
  orgName: null | string
  birthdayStr: string
  orderApplicationId: null
  dailySelfTestId: null
  pulseDiagnosisInfoId: null | number
  testReportUrl: null | string
  status: number
  ids: string
  unReadNums: number
  userNameFirst: null
}
export interface ConsultDetailReq {
  consultId: number
  createUser: number
  data: string
  description: string
  extension: string
}
export interface ConsultDetailRes {
  id: number
  consultId: number
  createUser: number
  createTime: string
  createUserType: number
  data: string
  description: string
  extension: string
}
