import type { UploadWaveData } from '@/utils/bluetooth/types'
import { http } from '@/http/alova'

/**
 * 上传波形数据获取分析结果
 * @param data 波形数据
 * @returns 分析结果
 */
export function uploadWaveResult(data: UploadWaveData) {
  return http.Post('http://101.200.234.162:8199/extapi/getwaveresultnew', data)
}
