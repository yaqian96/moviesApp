function vttTimestampToSeconds(raw) {
  const t = String(raw || '').trim()
  const m3 = t.match(/^(\d+):(\d{2}):(\d{2})[.,](\d{1,3})\s*$/)
  if (m3) {
    const ms = m3[4].padEnd(3, '0')
    return (
      parseInt(m3[1], 10) * 3600 +
      parseInt(m3[2], 10) * 60 +
      parseInt(m3[3], 10) +
      parseInt(ms, 10) / 1000
    )
  }
  const m2 = t.match(/^(\d{2}):(\d{2})[.,](\d{1,3})\s*$/)
  if (m2) {
    const ms = m2[3].padEnd(3, '0')
    return parseInt(m2[1], 10) * 60 + parseInt(m2[2], 10) + parseInt(ms, 10) / 1000
  }
  return NaN
}

function stripCuePayload(lines) {
  return lines
    .join('\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}

export function parseWebVttToCues(text) {
  const cues = []
  if (!text || typeof text !== 'string') return cues
  let body = text.replace(/^\uFEFF/, '').trim()
  if (body.toUpperCase().startsWith('WEBVTT')) {
    body = body.replace(/^WEBVTT[^\n]*\n*/i, '').trim()
  }
  const blocks = body.split(/\n{2,}/)
  const timeLine = /^(\S[^\n]*?)\s*-->\s*(\S[^\n]*?)(?:\s+.*)?$/
  for (const block of blocks) {
    const lines = block.split(/\n/).map((x) => x.trimEnd())
    if (!lines.length || !lines[0]) continue
    let i = 0
    if (!timeLine.test(lines[0]) && lines.length > 1 && timeLine.test(lines[1])) {
      i = 1
    }
    const m = lines[i]?.match(timeLine)
    if (!m) continue
    const start = vttTimestampToSeconds(m[1].split(/\s+/)[0])
    const end = vttTimestampToSeconds(m[2].split(/\s+/)[0])
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue
    const payload = stripCuePayload(lines.slice(i + 1))
    if (!payload) continue
    cues.push({ start, end, text: payload })
  }
  return cues
}

function parseSrtTime(s) {
  const m = String(s || '').match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/)
  if (!m) return NaN
  return (
    parseInt(m[1], 10) * 3600 +
    parseInt(m[2], 10) * 60 +
    parseInt(m[3], 10) +
    parseInt(m[4], 10) / 1000
  )
}

export function parseSrtToCues(text) {
  const cues = []
  if (!text || typeof text !== 'string') return cues
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trim()
  const blocks = normalized.split(/\n{2,}/)
  for (const block of blocks) {
    const lines = block.split('\n').filter((x) => x.trim().length)
    if (lines.length < 2) continue
    let tl = lines[1]
    if (/^\d+$/.test(lines[0].trim()) && lines.length >= 2) {
      tl = lines[1]
    } else if (lines[0].includes('-->')) {
      tl = lines[0]
    } else continue
    const tm = tl.match(
      /(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/
    )
    if (!tm) continue
    const start = parseSrtTime(tm[1])
    const end = parseSrtTime(tm[2])
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue
    const textStart = /^\d+$/.test(lines[0].trim()) ? 2 : 1
    const payload = stripCuePayload(lines.slice(textStart))
    if (!payload) continue
    cues.push({ start, end, text: payload })
  }
  return cues
}

export function parseSubtitleTextToCues(text) {
  const trimmed = (text || '').replace(/^\uFEFF/, '').trim()
  if (/^WEBVTT/im.test(trimmed)) {
    return parseWebVttToCues(trimmed)
  }
  const srtCues = parseSrtToCues(trimmed)
  if (srtCues.length) return srtCues
  return parseWebVttToCues(trimmed)
}
