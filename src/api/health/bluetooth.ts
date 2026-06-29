import type { UploadWaveData } from '@/utils/bluetooth/types'
import type { getLastConsultationRes, getLastDailyRes } from '../consultation/index.typings'
import type { getConsultationRes, getPulseRes } from './index.typings'
import type { IResponse } from '@/http/types'
import { http } from '@/http/alova'

/**
 * 上传波形数据获取分析结果
 * @param data 波形数据
 * @returns 分析结果
 */
export function uploadWaveResult(data: UploadWaveData) {
  return http.Post<IResponse<getConsultationRes[]>>('/extapi/getwaveresultnew', data)
}
