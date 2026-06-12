import type { IResponse } from '@/http/types'
import { http } from '@/http/alova'

function withParams(url: string, params: Record<string, unknown>) {
  return `${url}?params=${encodeURIComponent(JSON.stringify(params))}`
}

export function getHealthSummary(userId: number | string) {
  return http.Post<IResponse<Record<string, any>>>('/api/user/userDetail', {
    userId: String(userId),
  })
}

export function getBodyIndexHistoryList(pulseId: number | string) {
  const data = { pulseId }
  return http.Post<IResponse<any[]>>(withParams('/api/pulseDiagnosisInfo/bodyIndexHistoryList', data), data)
}

export function getPulseDiagnosisInfoDetail(pulseId: number | string) {
  const data = { pulseId: String(pulseId) }
  return http.Post<IResponse<Record<string, any>>>(withParams('/api/pulseDiagnosisInfo/pulseDiagnosisInfoDetail', data), data)
}

export function getBodyFeature(id: number | string) {
  const data = { id: String(id) }
  return http.Post<IResponse<Record<string, any>>>(withParams('/api/constitution/getBodyFeature', data), data)
}

export function getSuggestionList(constitutionId: number | string) {
  const data = { constitutionId: Number(constitutionId) }
  return http.Post<IResponse<any[]>>(withParams('/api/constitution/getSuggestionList', data), data)
}

export function getConditioningSuggestion(typeId: number | string) {
  const data = { typeId: Number(typeId) }
  return http.Post<IResponse<Record<string, any>>>(withParams('/api/constitution/getConditioningSuggestion', data), data)
}
