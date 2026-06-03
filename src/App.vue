<script setup lang="ts">
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app'
import { navigateToInterceptor } from '@/router/interceptor'
import { getUserInfoByCode } from './api/userInfo'

onLaunch(async (options) => {
  console.log('App.vue onLaunch', options)
})
onShow((options) => {
  console.log('App.vue onShow', options)
  // 处理直接进入页面路由的情况：如h5直接输入路由、微信小程序分享后进入等
  // https://github.com/unibest-tech/unibest/issues/192
  try {
    // uni.login({ provider: 'weixin' }).then((thenRes) => {
    //   console.log('🚀 ~ thenRes:', thenRes)
    //   console.log('微信登录 code:', thenRes.code)
    //   getUserInfoByCode({ code: thenRes.code }).then((res) => {
    //     console.log('🚀 ~ res:', res)
    //   })
    // })
    // 发送到后端，换取 openid 和 session_key
    // const res = await api.wxLogin({ code })
    // userStore.setOpenid(res.openid)
  }
  catch (error) {
    console.error('静默登录失败:', error)
  }
  if (options?.path) {
    navigateToInterceptor.invoke({ url: `/${options.path}`, query: options.query })
  }
  else {
    navigateToInterceptor.invoke({ url: '/' })
  }
})
onHide(() => {
  console.log('App Hide')
})
</script>

<style lang="scss">
@import 'sard-uniapp/index.scss';
</style>
