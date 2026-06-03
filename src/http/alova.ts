import type { uniappRequestAdapter } from '@alova/adapter-uniapp'
import type { IResponse } from './types'
import AdapterUniapp from '@alova/adapter-uniapp'
import { createAlova } from 'alova'
import { createServerTokenAuthentication } from 'alova/client'
import VueHook from 'alova/vue'
import { getEnvBaseUrl } from '@/utils'
import { toLoginPage } from '@/utils/toLoginPage'
import { ContentTypeEnum, ResultEnum, ShowMessage } from './tools/enum'

const baseUrl = getEnvBaseUrl()
// 配置动态Tag
export const API_DOMAINS = {
  DEFAULT: baseUrl,
  SECONDARY: import.meta.env.VITE_SERVER_BASEURL_SECONDARY,
}

/**
 * 创建请求实例
 */
const { onAuthRequired, onResponseRefreshToken } = createServerTokenAuthentication<
  typeof VueHook,
  typeof uniappRequestAdapter
>({
  // 如果下面拦截不到，请使用 refreshTokenOnSuccess by 群友@琛
  refreshTokenOnError: {
    isExpired: (error) => {
      return error.response?.status === ResultEnum.Unauthorized
    },
    handler: async () => {
      try {
        // await authLogin();
      }
      catch (error) {
        // 切换到登录页
        toLoginPage({ mode: 'reLaunch' })
        throw error
      }
    },
  },
})

/**
 * alova 请求实例
 */
const alovaInstance = createAlova({
  baseURL: API_DOMAINS.DEFAULT,
  ...AdapterUniapp(),
  timeout: 10000,
  statesHook: VueHook,

  beforeRequest: onAuthRequired((method) => {
    console.log('🚀 ~ method:', method)
    // 设置默认 Content-Type
    method.config.headers = {
      ContentType: ContentTypeEnum.JSON,
      Accept: 'application/json, text/plain, */*',
      ...method.config.headers,
    }

    const { config } = method
    const token = import.meta.env.VITE_TOKEN_KEY
    method.config.headers.token = token
    console.log('🚀 ~ m121ethod:', method)
    // 处理动态域名
    if (config?.meta?.domain) {
      method.baseURL = config.meta.domain
      console.log('当前域名', method.baseURL)
    }

    // 显示加载遮罩（排除上传/下载请求）
    uni.showLoading({
      title: '加载中...',
      mask: true,
    })
  }),

  responded: onResponseRefreshToken({
    onSuccess: (response, method) => {
      const { config } = method
      const { requestType } = config
      const {
        statusCode,
        data: rawData,
        errMsg,
      } = response as UniNamespace.RequestSuccessCallbackResult

      // 隐藏加载遮罩（排除上传/下载请求）
      uni.hideLoading()

      // 处理特殊请求类型（上传/下载）
      if (requestType === 'upload' || requestType === 'download') {
        return response
      }

      // 处理 HTTP 状态码错误
      if (statusCode !== 200) {
        const errorMessage = ShowMessage(statusCode) || `HTTP请求错误[${statusCode}]`
        console.error('errorMessage===>', errorMessage)
        uni.showToast({
          title: errorMessage,
          icon: 'error',
        })
        throw new Error(`${errorMessage}：${errMsg}`)
      }

      // 处理业务逻辑错误
      const { code, msg, success } = rawData as IResponse
      console.log('🚀 ~ rawData:', rawData)
      // 0和200当做成功都很普遍，这里直接兼容两者，见 ResultEnum
      if (!success) {
        if (config.meta?.toast !== false) {
          uni.showToast({
            title: msg,
            icon: 'none',
          })
        }
        throw new Error(`请求错误[${code}]：${msg}`)
      }
      // 处理成功响应，返回业务数据
      return rawData
    },
    onError: (error) => {
      console.error('请求失败:', error)
      uni.showToast({
        title: '网络错误，请检查网络连接',
        icon: 'none',
      })
      throw error
    },
    onComplete: () => {
      uni.hideLoading()
    },
  }),
})

export const http = alovaInstance
