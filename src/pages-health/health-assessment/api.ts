import type { IResponse } from '@/http/types'
import { http } from '@/http/alova'

function withParams(url: string, params: Record<string, unknown>) {
  return `${url}?params=${encodeURIComponent(JSON.stringify(params))}`
}

export function submitConstitutionExam(data: Record<string, unknown>) {
  return http.Post<IResponse<{ id: number | string }>>(withParams('/api/constitution/constitutionExam', data), data)
}

export function getDailySelfTestList(userId: number | string) {
  return http.Post<IResponse<any[]>>('/api/dailySelfTest/dailySelfTestList', {
    userId: Number(userId),
  })
}

export function submitDailySelfTest(data: Record<string, unknown>) {
  return http.Post<IResponse<unknown>>('/api/dailySelfTest/dailySelfTestInsert', data)
}

export function getEmotionTestQuestion(id: number | string) {
  return http.Get<IResponse<Record<string, any>>>('/api/emotionTest/getQuestion', {
    params: { id: Number(id) },
  })
}

export function submitEmotionTestAnswer(data: Record<string, unknown>) {
  return http.Post<IResponse<number | string | { id: number | string }>>('/api/emotionTest/answerSubmit', data)
}
