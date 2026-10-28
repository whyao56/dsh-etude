import { createHash } from 'node:crypto'

/** 完整 sha256，十六进制小写。清单里存的就是这个。 */
export function sha256Hex(data) {
  return createHash('sha256').update(data).digest('hex')
}

/**
 * 内容寻址用的短摘要。
 *
 * 媒体文件名就是 `<小写字母>-<这个值>.<ext>`，20 位十六进制（80 bit）足够区分
 * 一堆照片和 mp3，又短到人一眼能把包里的文件和清单里的字节对上。
 * 长度不够时哈希会撞，所以这里只允许 8 位以上。
 */
export function shortDigest(data, length = 20) {
  return sha256Hex(data).slice(0, Math.max(8, Math.min(64, length)))
}

/**
 * 幂等键：同一批输入不该重复花钱。
 *
 * 按键名排序后拼接，避免 JS 对象键序差异导致同一个输入算出两个键。
 * 只接受一层平铺的标量值，嵌套对象请先自己摊平。
 */
export function idempotencyKey(parts) {
  const payload = Object.keys(parts)
    .sort()
    .map((key) => `${key}=${String(parts[key] ?? '')}`)
    .join('\u0000')
  return sha256Hex(payload).slice(0, 32)
}
