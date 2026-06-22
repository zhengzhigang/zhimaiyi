/**
 * 滤波与基线漂移算法
 */

import { BASELINE_FILTER_ALPHA, BASELINE_WINDOW } from './constants'

/**
 * 一阶滤波算法
 * @param newVal 新值
 * @param oldVal 旧值
 * @param alpha 滤波系数
 * @returns 滤波后的值
 */
export function firstOrderFilter(newVal: number, oldVal: number, alpha = 0.3): number {
  return oldVal + alpha * (newVal - oldVal)
}

/**
 * 直流偏置去除与基线漂移抑制
 * @param val 当前值
 * @param baselineQueue 基线队列
 * @param smoothBaseline 平滑基线值（引用传递）
 * @returns 处理后的值
 */
export function removeDCAndDrift(
  val: number,
  baselineQueue: number[],
  smoothBaseline: { value: number },
): number {
  baselineQueue.push(val)
  if (baselineQueue.length > BASELINE_WINDOW) {
    baselineQueue.shift()
  }
  const mean = baselineQueue.reduce((acc, cur) => acc + cur, 0) / baselineQueue.length
  smoothBaseline.value = smoothBaseline.value + BASELINE_FILTER_ALPHA * (mean - smoothBaseline.value)
  return val - smoothBaseline.value
}

/**
 * 计算三次样条插值系数
 * @param x x坐标数组
 * @param y y坐标数组
 * @returns 系数数组
 */
export function calcSplineCoeff(x: number[], y: number[]): number[][] {
  const n = x.length - 1
  const h: number[] = []
  const alpha: number[] = []
  const l: number[] = []
  const mu: number[] = []
  const z: number[] = []
  const a: number[] = [...y]
  const b: number[] = []
  const c: number[] = []
  const d: number[] = []

  for (let i = 0; i < n; i++) {
    h.push(x[i + 1] - x[i])
  }

  for (let i = 1; i < n; i++) {
    alpha.push((3 / h[i]) * (a[i + 1] - a[i]) - (3 / h[i - 1]) * (a[i] - a[i - 1]))
  }

  l.push(1)
  mu.push(0)
  z.push(0)

  for (let i = 1; i < n; i++) {
    l.push(2 * (x[i + 1] - x[i - 1]) - h[i - 1] * mu[i - 1])
    mu.push(h[i] / l[i])
    z.push((alpha[i - 1] - h[i - 1] * z[i - 1]) / l[i])
  }

  l.push(1)
  z.push(0)
  c.push(0)

  for (let j = n - 1; j >= 0; j--) {
    c[j] = z[j] - mu[j] * c[j + 1]
    b[j] = (a[j + 1] - a[j]) / h[j] - (h[j] * (c[j + 1] + 2 * c[j])) / 3
    d[j] = (c[j + 1] - c[j]) / (3 * h[j])
  }

  const coeffs: number[][] = []
  for (let i = 0; i < n; i++) {
    coeffs.push([a[i], b[i], c[i], d[i], x[i], h[i]])
  }
  return coeffs
}

/**
 * 三次样条重采样
 * @param originArr 原始数组
 * @param targetHz 目标采样率
 * @param originHz 原始采样率
 * @returns 重采样后的数组
 */
export function cubicSplineResample(
  originArr: number[],
  targetHz = 240,
  originHz = 200,
): number[] {
  const n = originArr.length
  const x: number[] = []
  for (let i = 0; i < n; i++) {
    x.push(i / originHz)
  }

  const coeffs = calcSplineCoeff(x, originArr)
  const result: number[] = []
  const totalTime = (n - 1) / originHz
  const newTotalSamples = Math.floor(totalTime * targetHz)

  for (let i = 0; i < newTotalSamples; i++) {
    const t = i / targetHz
    let idx = 0
    for (let j = 0; j < coeffs.length; j++) {
      if (t >= coeffs[j][4] && t < coeffs[j][4] + coeffs[j][5]) {
        idx = j
        break
      }
      if (j === coeffs.length - 1) {
        idx = j
      }
    }
    const dx = t - coeffs[idx][4]
    const val =
      coeffs[idx][0] +
      coeffs[idx][1] * dx +
      coeffs[idx][2] * dx * dx +
      coeffs[idx][3] * dx * dx * dx
    result.push(val)
  }
  return result
}

/**
 * 将数据映射到0-255范围
 * @param arr 输入数组
 * @returns 映射后的数组
 */
export function convertTo0_255(arr: number[]): number[] {
  const min = Math.min(...arr)
  const max = Math.max(...arr)
  const range = max - min || 1
  return arr.map((v) => Math.round(((v - min) / range) * 255))
}

/**
 * 异常值过滤
 * @param val 当前值
 * @param lastVal 上一个值
 * @returns 是否有效
 */
export function isWaveValueValid(val: number, lastVal?: number): boolean {
  if (val < 0 || val > 65535) return false
  if (lastVal !== undefined && Math.abs(val - lastVal) > 8000) return false
  return true
}
