export function setStorageSync(key, value) {
  try {
    uni.setStorageSync(key, value)
  } catch {
    /* noop */
  }
}

export function getStorageSync(key) {
  try {
    const v = uni.getStorageSync(key)
    if (v === '' || v == null) return null
    if (typeof v === 'string' && v.startsWith('enc_')) {
      uni.removeStorageSync(key)
      return null
    }
    return v
  } catch {
    return null
  }
}

export function removeStorageSync(key) {
  try {
    uni.removeStorageSync(key)
  } catch {
    /* noop */
  }
}
