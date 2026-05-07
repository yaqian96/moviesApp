const SECRET_KEY = 'emby-media-app-2024'

function simpleEncrypt(text) {
  try {
    const str = JSON.stringify(text)
    let result = ''
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length)
      result += charCode.toString(16).padStart(4, '0')
    }
    return 'enc_' + result
  } catch {
    return ''
  }
}

function simpleDecrypt(encoded) {
  try {
    if (!encoded || !encoded.startsWith('enc_')) return null
    const hex = encoded.slice(4)
    let result = ''
    for (let i = 0; i < hex.length; i += 4) {
      const charCode = parseInt(hex.slice(i, i + 4), 16)
      const original = charCode ^ SECRET_KEY.charCodeAt((i / 4) % SECRET_KEY.length)
      result += String.fromCharCode(original)
    }
    return JSON.parse(result)
  } catch {
    return null
  }
}

export function setStorageSync(key, value) {
  try {
    const encrypted = simpleEncrypt(value)
    uni.setStorageSync(key, encrypted)
  } catch {
    /* noop */
  }
}

export function getStorageSync(key) {
  try {
    const encrypted = uni.getStorageSync(key)
    if (!encrypted) return null
    return simpleDecrypt(encrypted)
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
