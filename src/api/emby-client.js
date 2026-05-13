import axios from 'axios'
import { useUserStore } from '@/stores/user'
import { shouldUseLocalApiProxy } from '@/utils/emby-env'

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

    if (shouldUseLocalApiProxy() && root) {
      config.baseURL = '/api'
      if (config.url && config.url.startsWith('/emby')) {
        config.url = config.url.replace('/emby', '')
      }
    } else {
      config.baseURL = root
    }

    const tok = user.activeToken
    if (tok) {
      config.headers['X-Emby-Token'] = tok
      const prevParams = config.params && typeof config.params === 'object' ? config.params : {}
      if (!Object.prototype.hasOwnProperty.call(prevParams, 'api_key')) {
        config.params = { ...prevParams, api_key: tok }
      }
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
