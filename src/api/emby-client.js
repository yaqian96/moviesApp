import axios from 'axios'
import { useUserStore } from '@/stores/user'

// 判断是否在 H5 开发环境
function isDevH5() {
  return typeof window !== 'undefined' && import.meta.env?.DEV
}

function deviceHeaders() {
  const user = useUserStore()
  return {
    'X-Emby-Device-Id': user.deviceId || 'emby-uni-app',
    'X-Emby-Device-Name': 'EmbyMediaClient',
    'X-Emby-Client': 'EmbyWeb',
    'X-Emby-Client-Version': '4.8.0.0',
  }
}

function createClient() {
  const instance = axios.create({
    timeout: 120000,
    headers: {
      'Content-Type': 'application/json',
      ...deviceHeaders(),
    },
  })
  instance.interceptors.request.use((config) => {
    const user = useUserStore()
    const root = user.embyApiRoot
    if (!root) {
      return Promise.reject(new Error('未配置 Emby 服务地址'))
    }
    
    // 开发环境下使用代理，将完整 URL 转为相对路径
    if (isDevH5() && root) {
      // 提取路径部分，去掉域名
      const urlObj = new URL(root)
      const pathPrefix = urlObj.pathname // /emby
      // 将请求路径中的 /emby 替换为 /api/emby，让代理处理
      config.baseURL = '/api'
      // 如果原始 URL 是 /emby/Users/xxx，现在变成 /api/Users/xxx
      if (config.url && config.url.startsWith('/emby')) {
        config.url = config.url.replace('/emby', '')
      }
    } else {
      config.baseURL = root
    }
    
    const token = user.activeToken
    if (token) {
      config.headers['X-Emby-Token'] = token
    }
    Object.assign(config.headers, deviceHeaders())
    return config
  })
  instance.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) {
        const user = useUserStore()
        if (user.accessToken) {
          user.logout()
        }
        try {
          const pages = getCurrentPages()
          const cur = pages[pages.length - 1]
          if (cur && cur.route && !String(cur.route).includes('login')) {
            uni.reLaunch({ url: '/pages/login/login' })
          }
        } catch {
          /* getCurrentPages unavailable */
        }
      }
      return Promise.reject(err)
    }
  )
  return instance
}

export const embyClient = createClient()