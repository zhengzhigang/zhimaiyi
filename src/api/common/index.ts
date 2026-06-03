import type { ISearchEmpListRes } from '../consultation/index.typings'
import type { dictRes, IOrgRes, ISymptomListRes } from './index.typings'
import type { IResponse } from '@/http/types'
import { http } from '@/http/alova'
import { getEnvBaseUrl } from '@/utils'
import { showToast } from '@/utils/toast'

const baseUrl = getEnvBaseUrl()
/**
 * 上传文件
 * @returns 文件url
 */
export function uploadFile(file: any) {
  return http.Post<IResponse<dictRes>>('/api/file/uploadFile', file, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
/**
 * 使用 uni.uploadFile 上传文件
 * @param filePath 文件路径
 * @param name 字段名
 * @returns 文件url
 */
export function uniUploadFile(filePath: string, name: string = 'file'): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${baseUrl}/api/file/uploadFile`,
      filePath,
      name,
      success: (uploadFileRes) => {
        try {
          const data = JSON.parse(uploadFileRes.data)
          if (data.success) {
            resolve(data.url)
          }
          else {
            showToast(data.msg || '上传失败')
            reject(new Error(data.msg || '上传失败'))
          }
        }
        catch (error) {
          showToast('上传失败')
          reject(error)
        }
      },
      fail: (err) => {
        console.log(err)
        showToast('上传失败')
        reject(err)
      },
    })
  })
}
/**
 * 上传文件到阿里云
 * @description 上传文件到阿里云 音频
 * @returns 文件url
 */
export function uploadToAliyunOs(file: any) {
  return http.Post<IResponse<dictRes>>('/api/file/uploadAliyunOs', file, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
/**
 * 获取机构列表
 * @param data 请求表单
 */
export function getOrgList() {
  return http.Get<IResponse<IOrgRes[]>>('/api/employee/getAllOrgList', {
    params: { useId: true },
  })
}
/**
 * 获取标签列表
 * @param data 请求表单
 */
export function getLabelList() {
  return http.Get<IResponse<ISearchEmpListRes>>('/api/employee/getAllLabelList', {
    params: { useId: true },
  })
}
/**
 * 获取症状列表
 */
export function getSymptomList() {
  return http.Post<IResponse<ISymptomListRes[]>>('/api/symptom/symptomList', {}, {
    meta: {
      query: true,
      params: true,
    },
  })
}
