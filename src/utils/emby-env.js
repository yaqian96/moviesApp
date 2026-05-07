export function shouldUseLocalApiProxy() {
  if (typeof window === 'undefined') return false
  // 开发模式使用 Vite 代理
  if (import.meta.env.DEV) return true
  // 生产环境：只有部署到同域名且配置了 Nginx 代理时才使用 /api
  // localhost 本地预览没有代理，直接请求 Emby 服务器
  return false
}
