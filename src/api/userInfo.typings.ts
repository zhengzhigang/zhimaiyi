/**
 * 登录表单
 */
export interface IUpdatePasswordForm {
  useEmployeeId: boolean
  password: string
  newPassword: string
}
/**
 * 用户信息
 */
export interface IUserInfoVo {
  addTime: number
  addUser: number
  address: string
  areaId: string
  bank: string
  bankNo: string
  birthday: number
  briefIntroduction: string
  department: string
  email: string
  empCode: string
  enableH5: string
  enablePc: string
  headPic: string
  id: number
  idcard: string
  isDel: number
  isRecommend: number
  lebelNames: string
  license: string
  loginName: string
  name: string
  nation: string
  notifyToChangePassword: boolean
  orderSeparate: number
  orgId: number
  orgName: string
  password: string
  personalStudio: string
  phone: string
  picIdcardBack: string
  picIdcardFront: string
  picLicense: string
  picTitle: string
  receiveOrderLimit: number
  roleId: number
  sex: GenderType
  type: RoleType
  typeName?: string
  updateTime: number
  updateUser: number
}

/**
 * 登录返回的信息
 */
export interface IUserLogin {
  code: number
  data: IUserInfoVo
  message: string
  success: boolean
}

/**
 * 获取验证码
 */
export interface ICaptcha {
  captchaEnabled: boolean
  uuid: string
  image: string
}
/**
 * 上传成功的信息
 */
export interface IUploadSuccessInfo {
  fileId: number
  originalName: string
  fileName: string
  storagePath: string
  fileHash: string
  fileType: string
  fileBusinessType: string
  fileSize: number
}
/**
 * 更新用户信息
 */
export interface IUpdateInfo {
  id: number
  name: string
  sex: string
}
/**
 * 更新用户信息
 */
export interface IUpdatePassword {
  id: number
  oldPassword: string
  newPassword: string
  confirmPassword: string
}
export interface empOrgDetail {
  id: number
  orgName: string
}
export interface empOrgDetailRes {
  lastOrgId: number
  orgList: empOrgDetail[]
}
