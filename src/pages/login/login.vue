<template>
  <view class="min-h-screen bg-surface px-6 py-12">
    <view class="mb-10">
      <text class="text-2xl font-semibold text-white">Emby 媒体库</text>
      <view class="mt-2 text-sm text-muted">使用服务器地址与 API Key 连接</view>
    </view>
    <view class="flex flex-col gap-4">
      <wd-input
        v-model="form.baseUrl"
        label="服务器地址"
        placeholder="https://your-emby.com"
        clearable
      />
      <wd-input
        v-model="form.apiKey"
        label="API Key"
        placeholder="控制面板中生成的密钥"
        clearable
      />
      <wd-input v-model="form.username" label="用户名" placeholder="Emby 用户名" clearable />
      <wd-input
        v-model="form.password"
        label="密码"
        placeholder="密码"
        clearable
        show-password
      />
      <wd-button block type="primary" :loading="loading" @click="submit">
        登录
      </wd-button>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { fetchSystemInfo } from '@/api/emby-auth'
import { authenticateByName } from '@/api/emby-auth'

const user = useUserStore()
const loading = ref(false)
const form = reactive({
  baseUrl: '',
  apiKey: '',
  username: '',
  password: '',
})

onShow(() => {
  user.hydrate()
  form.baseUrl = user.embyBaseUrl || ''
  form.apiKey = user.apiKey || ''
  form.username = user.userName || ''
  if (user.isLoggedIn) {
    uni.reLaunch({ url: '/pages/home/home' })
  }
})

async function submit() {
  loading.value = true
  try {
    user.setServer(form.baseUrl)
    user.setApiKey(form.apiKey)
    await fetchSystemInfo()
    const { data } = await authenticateByName(form.username, form.password)
    const nextUid =
      data.User?.Id ||
      data.User?.UserId ||
      data.SessionInfo?.UserId ||
      data.UserId ||
      ''
    if (!data.AccessToken || !nextUid) {
      throw new Error('登录响应不完整')
    }
    user.setSession({
      accessToken: data.AccessToken,
      userId: nextUid,
      userName: data.User?.Name || data.SessionInfo?.UserName || form.username,
    })
    uni.showToast({ title: '登录成功', icon: 'success' })
    uni.reLaunch({ url: '/pages/home/home' })
  } catch (e) {
    const msg = e?.response?.data?.Message || e?.message || '登录失败'
    uni.showToast({ title: String(msg).slice(0, 40), icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>
