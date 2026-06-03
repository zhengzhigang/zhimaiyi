import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

// 导航记录接口
export interface NavRecord {
  url: string
  options?: Record<string, any>
  timestamp: number
  type: 'navigateTo' | 'navigateBack' | 'redirectTo' | 'reLaunch' | 'switchTab'
}

// 路由状态接口
export interface RouterState {
  history: NavRecord[]
  currentUrl: string
  maxHistoryLength: number
}

export const useRouterStore = defineStore(
  'router',
  () => {
    // 导航历史记录
    const history = ref<NavRecord[]>([])
    // 当前页面 URL
    const currentUrl = ref('')
    // 最大历史记录长度
    const maxHistoryLength = ref(50)

    // 当前页面栈深度
    const stackDepth = computed(() => history.value.length)

    // 是否可以返回
    const canGoBack = computed(() => history.value.length > 1)

    // 记录导航
    const recordNavigation = (record: NavRecord) => {
      // 添加新记录
      history.value.push(record)
      currentUrl.value = record.url

      // 限制历史记录长度
      if (history.value.length > maxHistoryLength.value) {
        history.value.shift()
      }

      console.log('🚀 ~ 导航记录:', record)
      console.log('🚀 ~ 当前历史栈:', history.value)
    }

    // 重写 navigateTo
    const navigateTo = (options: UniApp.NavigateToOptions) => {
      const { url, success, fail, complete } = options

      // 记录导航
      recordNavigation({
        url: url.toString(),
        options,
        timestamp: Date.now(),
        type: 'navigateTo',
      })

      // 调用原生方法
      uni.navigateTo({
        url,
        success: (res) => {
          success?.(res)
        },
        fail: (err) => {
          fail?.(err)
        },
      })
    }

    // 重写 navigateBack
    const navigateBack = (options?: UniApp.NavigateBackOptions) => {
      const delta = options?.delta || 1

      // 记录返回
      recordNavigation({
        url: '',
        options: { delta },
        timestamp: Date.now(),
        type: 'navigateBack',
      })

      // 从历史栈中移除对应数量的记录
      if (history.value.length >= delta) {
        history.value = history.value.slice(0, history.value.length - delta)
        if (history.value.length > 0) {
          currentUrl.value = history.value[history.value.length - 1].url
        }
      }

      // 调用原生方法
      uni.navigateBack(options)
    }

    // 重写 redirectTo
    const redirectTo = (options: UniApp.RedirectToOptions) => {
      const { url, success, fail, complete } = options

      // 记录导航（替换当前页面）
      recordNavigation({
        url,
        options,
        timestamp: Date.now(),
        type: 'redirectTo',
      })

      // 调用原生方法
      uni.redirectTo({
        url,
        success: (res) => {
          success?.(res)
        },
        fail: (err) => {
          fail?.(err)
        },
        complete: () => {
          complete?.()
        },
      })
    }

    // 重写 reLaunch
    const reLaunch = (options: UniApp.ReLaunchOptions) => {
      const { url, success, fail, complete } = options

      // 清空历史并记录新导航
      history.value = []
      recordNavigation({
        url,
        options,
        timestamp: Date.now(),
        type: 'reLaunch',
      })

      // 调用原生方法
      uni.reLaunch({
        url,
        success: (res) => {
          success?.(res)
        },
        fail: (err) => {
          fail?.(err)
        },
        complete: () => {
          complete?.()
        },
      })
    }

    // 重写 switchTab
    const switchTab = (options: UniApp.SwitchTabOptions) => {
      const { url, success, fail, complete } = options

      // 记录导航（switchTab 通常会清空页面栈）
      history.value = []
      recordNavigation({
        url,
        options,
        timestamp: Date.now(),
        type: 'switchTab',
      })

      // 调用原生方法
      uni.switchTab({
        url,
        success: (res) => {
          success?.(res)
        },
        fail: (err) => {
          fail?.(err)
        },
        complete: () => {
          complete?.()
        },
      })
    }

    // 获取上一页 URL
    const getPreviousUrl = () => {
      if (history.value.length >= 2) {
        return history.value[history.value.length - 2].url
      }
      return ''
    }

    // 获取历史记录
    const getHistory = () => {
      return [...history.value]
    }

    // 清空历史记录
    const clearHistory = () => {
      history.value = []
      currentUrl.value = ''
    }

    // 设置最大历史长度
    const setMaxHistoryLength = (length: number) => {
      maxHistoryLength.value = length
      // 如果当前历史超过新限制，截断
      if (history.value.length > maxHistoryLength.value) {
        history.value = history.value.slice(-maxHistoryLength.value)
      }
    }

    return {
      // 状态
      history,
      currentUrl,
      maxHistoryLength,
      stackDepth,
      canGoBack,

      // 方法
      recordNavigation,
      navigateTo,
      navigateBack,
      redirectTo,
      reLaunch,
      switchTab,
      getPreviousUrl,
      getHistory,
      clearHistory,
      setMaxHistoryLength,
    }
  },
  {
    persist: {
      enabled: true,
      key: 'router_store',
      // 只持久化需要的数据
      paths: ['history', 'currentUrl', 'maxHistoryLength'],
    },
  },
)
