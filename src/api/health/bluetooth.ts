import type { UploadWaveData } from '@/utils/bluetooth/types'
import type { getLastConsultationRes, getLastDailyRes } from '../consultation/index.typings'
import type { getConsultationRes, getPulseRes } from './index.typings'
import type { IResponse } from '@/http/types'
import { http } from '@/http/alova'
const uploadDomain = import.meta.env.VITE_SERVER_BASEURL_PC

export function uploadWaveResult(data: UploadWaveData) {
  return http.Post<IResponse<getConsultationRes[]>>('/pulseDiagnosisInfo/getHandlePulseDiagnosisInfoFeign', data, {
    meta: {
      domain: uploadDomain,
    },
  })
}
