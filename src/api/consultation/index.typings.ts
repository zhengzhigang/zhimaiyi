export interface ISearchEmpListParams {
  department?: string
  name?: string
  flag?: number
  orgId?: number | string
  labelId?: number
  page?: number
  size?: number
  type?: number[]
  userId?: number
}
export interface ISearchEmpListRes {
  id: number
  name: string
  type: number
}
export interface ISearchEmpListRes {
  id: number
  roleId: number
  type: number
  name: string
  phone: string
  sex: number
  enableH5: string
  isDel: number
  addTime: string
  roleName: null
  lebelNames: null | string
  specialtyNames: null
  headPic: string
  orgName: null
  briefIntroduction: null | string
  personalStudio: null | string
  isAdded: boolean
  onlineFlag: boolean
  consultRegistrationFee: null | number
  typeName: string
}
export interface getDoctorOrgRes {
  lastOrgId: number
  orgList: {
    id: number
    orgName: string
  }[]
}
export interface getLastDailyRes {
  addFlag: number
  addTime: string
  addUser: number
  breathing: string
  coughSound: string
  defecation: string
  femaleLeucorrhea: string
  hear: string
  id: number
  isDel: number
  memberId: number
  showFlag: number
  smellBody: string
  sweating: string
  talkingSound: string
  thirstWater: string
  updateTime: string
  updateUser: number
  userId: number
}
export interface getLastConsultationRes {
  addTime: string
  id: number
  name: string
  primaryNames: string
  secondaryNames: string
  surveyResult: string
}
export interface getLastPulseRes {
  id: number
  name: string
}
export interface ConsultationType {
  id: number
  name: string
}
export interface InsertConsultationType {
  constitutionId: number
  consultInfo: string
  employeeId: number
  fileArray: { fileName: string, filePath: string }[]
  symptomDuration1Ids: string
  symptomDuration2Ids: string
  symptomDuration3Ids: string
  symptomIds: string
  testReportUrl: string
  dailySelfTestId: number
  pulseDiagnosisInfoId: number
}
export interface IsConsultingExistRes {
  isConsultingExist: boolean
  consultVo: ConsultationDetailType
}
export interface IsOrderConsultingExistRes {
  isOrderExist: boolean
  consultOrderStatus: number
  consultOrderId: number
}
export interface ConsultationDetailType {
  id: number
  customerId: number
  customerCode: null
  memberVo: MemberVo
  memberId: null
  customerName: null
  customerAge: null
  customerBirth: null
  employeeId: number
  symptomIds: string
  consultInfo: string
  duration: null
  addTime: string
  updateTime: string
  reply: null
  replyTime: null
  constitutionId: number
  dailySelfTestId: null
  pulseDiagnosisInfoId: null
  testReportUrl: string
  status: number
  employeeName: string
  employeeSex: number
  employeeHeadPic: string
  symptomNames: string
  ids: string
  fileList: FileList[]
  unReadNums: null
  symptomDuration1Ids: string
  symptomDuration2Ids: string
  symptomDuration3Ids: string
  symptomDuration1Names: string
  symptomDuration2Names: string
  symptomDuration3Names: string
  dailySelfTestEntity: DailySelfTestEntity
  constitutionName: string
  pulseDiagnosisInfoName: null
  constitutionTime: null
  pulseDiagnosisTime: null
  consultRegistrationFee: null
}

export interface DailySelfTestEntity {
  id: number
  userId: number
  talkingSound: string
  coughSound: string
  smellBody: string
  hear: string
  breathing: string
  femaleLeucorrhea: string
  defecation: string
  isDel: number
  addTime: string
  updateTime: string
  addUser: number
  updateUser: number
  memberId: null
  showFlag: number
  addFlag: number
  sweating: null
  thirstWater: null
}

export interface FileList {
  id: number
  fileType: number
  tableId: number
  filePath: string
  fileName: string
  isDel: number
  addTime: string
  updateTime: string
  addUser: number
  updateUser: number
  remark: null
}

export interface MemberVo {
  memberId: null
  userId: number
  memberType: string
  name: string
  sex: number
  phone: string
  birthday: string
  nation: string
  idCard: string
  weight: string
  height: string
  addTime: string
  updateTime: string
}
