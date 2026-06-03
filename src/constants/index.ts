/** 性别类型 */
export type GenderType = 0 | 1 | 2

/** 性别常量 */
export const Gender = {
  Male: 1, // 男性
  Female: 2, // 女性
  FemaleOrUnknown: 0, // 女性或未知
  /** 判断是否为女性（支持0和2两种值） */
  isFemale: (gender: GenderType) => gender === 0 || gender === 2,
  /** 判断是否为男性 */
  isMale: (gender: GenderType) => gender === 1,
} as const

/**
 * @description 角色类型
 * @enum {number}
 * @property {0} UnLogin - 未登录
 * @property {1} Admin - 管理员
 * @property {2} PlatformManager - 平台管理员
 * @property {3} OrgManager - 机构管理员
 * @property {4} Sender - 配货员
 * @property {5} Doctor - 医生
 * @property {7} NurseAssistant - 医生助理
 * @property {8} HealthManager - 健管师
 */
export const RoleType = {
  UnLogin: 0, // 未登录
  Admin: 1, // 管理员
  PlatformManager: 2, // 平台管理员
  OrgManager: 3, // 机构管理员
  Sender: 4, // 配货员
  Doctor: 5, // 医生
  NurseAssistant: 7, // 医生助理
  HealthManager: 8, // 健管师
} as const
