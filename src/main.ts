import { createSSRApp } from 'vue'
import App from './App.vue'
import { Gender, RoleType } from './constants'
import { requestInterceptor } from './http/interceptor'
import { routeInterceptor } from './router/interceptor'
import store from './store'
import '@/style/index.scss'
import './style/vb.css'
import 'virtual:uno.css'

export function createApp() {
  const app = createSSRApp(App)
  app.use(store)
  app.use(routeInterceptor)
  app.use(requestInterceptor)

  // 将常量挂载到全局属性，方便在模板中使用
  app.config.globalProperties.Gender = Gender
  app.config.globalProperties.RoleType = RoleType

  return {
    app,
  }
}
