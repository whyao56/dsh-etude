/**
 * MP3 播放时长。
 *
 * 契约 v2 要求清单里每条音频都带 `seconds`，而「合成成功只回字节数」正是
 * HANDOVER 点名要修掉的毛病 —— 所以这里不猜码率，一帧一帧走：
 * 解析帧头、按比特率算帧长、跳到下一帧、累计采样数。只有帧头全都撕裂
 * （比如 OpenAI 兼容服务返回了别的格式）才退化成整个文件的 CBR 估算，
 * 连比特率都拿不到就返回 null，让上层把这条标成「不可播放」。
 */

// Layer III 比特率表，单位 kbps。
const BITRATE_V1 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
const BITRATE_V2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]
const SAMPLE_RATE = {
  // 键是 MPEG 版本码
  3: [44100, 48000, 32000], // MPEG 1
  2: [22050, 24000, 16000], // MPEG 2
  0: [11025, 12000, 8000], // MPEG 2.5
}

const MAX_RESYNC = 4096

/**
 * @param {Uint8Array | Buffer} data
 * @returns {{ seconds: number, frames: number, sampleRate: number, estimated: boolean } | null}
 */
export function mp3Duration(data) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  if (bytes.length < 4) return null

  let offset = skipId3v2(bytes)
  let frames = 0
  let samples = 0
  let sampleRate = 0
  let firstBitrate = 0
  let firstSampleRate = 0
  let skipped = 0

  while (offset + 4 <= bytes.length) {
    const header = readFrameHeader(bytes, offset)
    if (header === null) {
      // 帧头撕裂：可能是 ID3 尾巴、标签、或者流里混了别的东西。
      // 往后找下一个像样的帧头；找太远就说明这不是一段正常的 MPEG 流。
      const next = resync(bytes, offset + 1)
      if (next < 0) break
      skipped += next - offset
      if (skipped > MAX_RESYNC * 8) break
      offset = next
      continue
    }
    const frameLength = Math.floor(((header.samplesPerFrame / 8) * header.bitrate * 1000) / header.sampleRate) + header.padding
    // 帧长不合理，或者尾巴被截断半帧：不数这一帧，直接收工。
    if (frameLength < 24 || offset + frameLength > bytes.length) break
    frames += 1
    samples += header.samplesPerFrame
    sampleRate = header.sampleRate
    if (frames === 1) {
      firstBitrate = header.bitrate
      firstSampleRate = header.sampleRate
    }
    offset += frameLength
  }

  if (frames > 0 && sampleRate > 0) {
    return { seconds: round3(samples / sampleRate), frames, sampleRate, estimated: false }
  }

  // 退化：一帧都没认出来，但至少能从第一个帧头读到比特率，就按 CBR 估。
  const fallback = firstBitrate > 0 ? firstBitrate : sniffFirstBitrate(bytes)
  const fallbackRate = firstSampleRate > 0 ? firstSampleRate : sniffFirstSampleRate(bytes)
  if (fallback > 0 && fallbackRate > 0 && bytes.length > 0) {
    const seconds = (bytes.length * 8) / (fallback * 1000)
    return { seconds: round3(seconds), frames: 0, sampleRate: fallbackRate, estimated: true }
  }
  return null
}

function sniffFirstBitrate(bytes) {
  for (let i = 0; i + 4 <= bytes.length && i < MAX_RESYNC; i += 1) {
    const header = readFrameHeader(bytes, i)
    if (header !== null) return header.bitrate
  }
  return 0
}

function sniffFirstSampleRate(bytes) {
  for (let i = 0; i + 4 <= bytes.length && i < MAX_RESYNC; i += 1) {
    const header = readFrameHeader(bytes, i)
    if (header !== null) return header.sampleRate
  }
  return 0
}

function round3(value) {
  return Math.round(value * 1000) / 1000
}

function skipId3v2(bytes) {
  if (bytes.length < 10) return 0
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return 0
  const size = ((bytes[6] & 0x7f) << 21) | ((bytes[7] & 0x7f) << 14) | ((bytes[8] & 0x7f) << 7) | (bytes[9] & 0x7f)
  const footer = (bytes[5] & 0x10) !== 0 ? 10 : 0
  const end = 10 + size + footer
  return end <= bytes.length ? end : 0
}

function resync(bytes, from) {
  const limit = Math.min(bytes.length - 4, from + MAX_RESYNC)
  for (let i = from; i <= limit; i += 1) {
    if (readFrameHeader(bytes, i) !== null) return i
  }
  return -1
}

/**
 * @returns {{ version: number, layer: number, bitrate: number, sampleRate: number, padding: number, samplesPerFrame: number } | null}
 */
function readFrameHeader(bytes, offset) {
  const b0 = bytes[offset]
  const b1 = bytes[offset + 1]
  const b2 = bytes[offset + 2]
  if (b0 !== 0xff || (b1 & 0xe0) !== 0xe0) return null

  const version = (b1 >> 3) & 0x03
  if (version === 1) return null // reserved
  const layer = (b1 >> 1) & 0x03
  if (layer === 0) return null // reserved
  if (layer !== 1) return null // 只认 Layer III，其它层不用这条估算

  const bitrateIndex = (b2 >> 4) & 0x0f
  if (bitrateIndex === 0 || bitrateIndex === 0x0f) return null
  const sampleIndex = (b2 >> 2) & 0x03
  if (sampleIndex === 3) return null

  const table = version === 3 ? BITRATE_V1 : BITRATE_V2
  const bitrate = table[bitrateIndex]
  const sampleRate = SAMPLE_RATE[version][sampleIndex]
  if (!bitrate || !sampleRate) return null

  // MPEG1 的 Layer III 每帧 1152 个采样，MPEG2/2.5 是 576。
  const samplesPerFrame = version === 3 ? 1152 : 576
  const padding = (b2 >> 1) & 0x01

  return { version, layer, bitrate, sampleRate, padding, samplesPerFrame }
}

/** 文件头嗅探：用来挡「200 加一个 HTML 页面，扩展名是 .mp3」。 */
export function sniffAudioKind(bytes) {
  const head = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  if (head.length >= 3 && head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33) return 'mp3'
  if (head.length >= 2 && head[0] === 0xff && (head[1] & 0xe0) === 0xe0) return 'mp3'
  if (head.length >= 4 && head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46) return 'wav'
  if (head.length >= 4 && head[0] === 0x4f && head[1] === 0x67 && head[2] === 0x67 && head[3] === 0x53) return 'ogg'
  return 'unknown'
}
