/**
 * 滤波与基线漂移算法
 */

import { BASELINE_FILTER_ALPHA, BASELINE_WINDOW, MAX_JUMP_DELTA } from './constants'

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
 * 计算三次样条插值系数（扁平数组优化版，避免创建大量小数组）
 * @param x x坐标数组（等间距）
 * @param y y坐标数组
 * @returns { b, c, d, h } 各系数扁平数组
 */
export function calcSplineCoeff(x: number[], y: number[]) {
  const n = x.length - 1
  const h = new Float64Array(n)
  const alpha = new Float64Array(n)
  const l = new Float64Array(n + 1)
  const mu = new Float64Array(n + 1)
  const z = new Float64Array(n + 1)
  const b = new Float64Array(n)
  const c = new Float64Array(n + 1)
  const d = new Float64Array(n)

  for (let i = 0; i < n; i++) h[i] = x[i + 1] - x[i]
  for (let i = 1; i < n; i++)
    alpha[i] = (3 / h[i]) * (y[i + 1] - y[i]) - (3 / h[i - 1]) * (y[i] - y[i - 1])

  l[0] = 1
  for (let i = 1; i < n; i++) {
    l[i] = 2 * (x[i + 1] - x[i - 1]) - h[i - 1] * mu[i - 1]
    mu[i] = h[i] / l[i]
    z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i]
  }

  l[n] = 1
  z[n] = 0
  c[n] = 0

  for (let j = n - 1; j >= 0; j--) {
    c[j] = z[j] - mu[j] * c[j + 1]
    b[j] = (y[j + 1] - y[j]) / h[j] - (h[j] * (c[j + 1] + 2 * c[j])) / 3
    d[j] = (c[j + 1] - c[j]) / (3 * h[j])
  }

  return { b, c, d, h }
}

/**
 * 三次样条重采样（优化版：直接计算索引 O(n) 复杂度）
 * 适用于等间距采样点（x[i] = i / originHz）
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
  if (n === 0) return []
  if (n === 1) return [originArr[0]]

  // 构建等间距 x 坐标（步长 = 1/originHz）
  const step = 1 / originHz
  const x: number[] = new Array(n)
  for (let i = 0; i < n; i++) {
    x[i] = i * step
  }

  const coeffStart = Date.now()
  const { b, c, d } = calcSplineCoeff(x, originArr)
  
  // 检查系数是否有效
  let invalidCoeffCount = 0
  for (let i = 0; i < b.length; i++) {
    if (!Number.isFinite(b[i]) || !Number.isFinite(c[i]) || !Number.isFinite(d[i])) {
      invalidCoeffCount++
      if (invalidCoeffCount <= 5) {
        console.error(`[cubicSplineResample] 系数无效 idx=${i}: b=${b[i]}, c=${c[i]}, d=${d[i]}`)
      }
    }
  }
  if (invalidCoeffCount > 0) {
    console.error(`[cubicSplineResample] 共有 ${invalidCoeffCount} 个无效系数`)
  }
  
  const totalTime = (n - 1) / originHz
  const newTotalSamples = Math.floor(totalTime * targetHz) + 1
  const result = new Array(newTotalSamples)

  // 等间距采样点可以直接计算索引，无需搜索
  const loopStart = Date.now()
  let nanCount = 0
  for (let i = 0; i < newTotalSamples; i++) {
    const t = i / targetHz
    const idx = Math.min(Math.floor(t * originHz), n - 2)

    const dx = t - x[idx]
    const val = originArr[idx] + b[idx] * dx + c[idx] * dx * dx + d[idx] * dx * dx * dx

    // 安全检查：防止 NaN
    if (Number.isFinite(val)) {
      result[i] = val
    } else {
      nanCount++
      result[i] = Number.isFinite(originArr[idx]) ? originArr[idx] : 0
    }
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
 * 上传前数据预处理（与 btsentest抑制漂移200hz.html 的 convertTo0_255 逻辑一致）
 * 处理流程：全局均值去直流偏置 → 三次样条插值(200Hz→240Hz) → 映射到0-255
 * @param arr 原始波形数据
 * @returns 处理后的 0-255 范围数据
 */
export function prepareWaveDataForUpload(arr: number[]): number[] {
  if (!arr || arr.length === 0) {
    console.warn('[prepareWaveDataForUpload] 输入数据为空')
    return []
  }

  // 1. 全局均值去直流偏置
  const sum = arr.reduce((acc, cur) => acc + cur, 0)
  const dcBias = sum / arr.length
  const noBiasArr = arr.map((v) => v - dcBias)

  // 2. 三次样条插值 200Hz → 240Hz
  const startTime = Date.now()
  const interpArr = cubicSplineResample(noBiasArr, 240, 200)

  // 检查是否有 NaN 或 Infinity
  const hasInvalid = interpArr.some(v => !Number.isFinite(v))
  if (hasInvalid) {
    console.error('[prepareWaveDataForUpload] 插值结果包含无效值(NaN/Infinity)')
  }

  // 3. 映射到 0-255（使用 reduce 避免大数据量时 Math.min/max 栈溢出）
  const min = interpArr.reduce((a, b) => Math.min(a, b), Infinity)
  const max = interpArr.reduce((a, b) => Math.max(a, b), -Infinity)
  
  if (max === min) {
    console.warn('[prepareWaveDataForUpload] max === min，返回全128')
    return interpArr.map(() => 128)
  }
  
  const result = interpArr.map((val) => {
    const num = Math.round(((val - min) / (max - min)) * 255)
    return Math.max(0, Math.min(255, num))
  })

  return result
}

/**
 * 异常值过滤
 * @param val 当前值
 * @param lastVal 上一个值
 * @returns 是否有效
 */
export function isWaveValueValid(val: number, lastVal?: number): boolean {
  if (val < 0 || val > 65535) return false
  if (lastVal !== undefined && Math.abs(val - lastVal) > MAX_JUMP_DELTA) return false
  return true
}
