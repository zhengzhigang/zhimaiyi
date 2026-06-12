import type { IResponse } from '@/http/types'
import { http } from '@/http/alova'

export function getEmotionTestDetail(id: number | string) {
  return http.Post<IResponse<Record<string, any>>>('/api/emotionTest/getDetail', {
    id: String(id),
  })
}
