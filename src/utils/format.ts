import dayjs from 'dayjs'

/**
 * 日期格式化
 * @param date 日期
 * @param format 格式 默认 YYYY-MM-DD HH:mm:ss
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: string | number | Date, format = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs(date).format(format)
}
/**
 * 日期格式化
 * @param date 日期
 * @param format 格式 默认 YYYY-MM-DD HH:mm:ss
 * @returns 日期数据数组
 */
export function formatGetArray(date: string | number | Date, format = 'YYYY-MM-DD HH:mm:ss'): number[] {
  return [dayjs(date).year(), dayjs(date).month() + 1, dayjs(date).date()]
}

/**
 * 时间戳格式化
 * @param timestamp 时间戳
 * @param format 格式 默认 YYYY-MM-DD HH:mm:ss
 * @returns 格式化后的日期字符串
 */
export function formatTimestamp(timestamp: number, format = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs(timestamp).format(format)
}

/**
 * 获取当前时间的格式化字符串
 * @param format 格式 默认 YYYY-MM-DD HH:mm:ss
 * @returns 格式化后的日期字符串
 */
export function formatNow(format = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs().format(format)
}
