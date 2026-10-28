import { createHash } from 'node:crypto'

/** 完整 sha256，十六进制小写。清单里存的就是这个。 */
export function sha256Hex(data) {
  return createHash('sha256').update(data).digest('hex')
}

/**
 * 内容寻址用的短摘要。
 *
 * 20 个十六进制字符和 Etude 的媒体名规则一致
 * （`^[a-z]+-[0-9a-f]{20}\.(jpg|png|webp|gif)$`），所以本插件造出来的文件
 * 不用改名就能被 Etude 的 /api/images/<name> 认出来。
 */
export function shortDigest(data, length = 20) {
  return sha256Hex(data).slice(0, length)
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
