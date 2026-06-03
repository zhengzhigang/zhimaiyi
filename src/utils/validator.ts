/**
 * 校验手机号是否合法
 * @param phone 手机号码
 * @returns 是否合法
 */
export function isValidPhone(phone: string): boolean {
  const reg = /^1[3-9]\d{9}$/
  return reg.test(phone)
}
