/**
 * 取一把 key。配置里只存「环境变量名」，真值走 DSH 的 credentials 服务。
 *
 * 为什么不在插件配置里直接放 key：key 只有一处才不会过期两份，
 * 换机器、轮换 key 都不用动插件；配置也能安全地贴给别人看。
 *
 * 顺序是「凭据服务 → 进程环境变量」。环境变量是兜底：有人在
 * `systemctl` / `start.ps1` 里注入了 key，但没登记进凭据服务。
 *
 * `@deepseek-ai/dsh-credentials` 是懒加载的：这个文件也会被 pytest 旁边的
 * 自检脚本 import，那边没有 Harness 的 node_modules，静态 import 会直接
 * 把整个进程带崩。拿不到包时就只用环境变量。
 */
export async function resolveSecret(ctx, envName) {
  const name = String(envName ?? '').trim()
  if (!name) return ''
  try {
    const { credentialRef } = await import('@deepseek-ai/dsh-credentials')
    const credentials = ctx?.get?.('credentials')
    const value = await credentials?.resolve?.(credentialRef(name))
    if (typeof value === 'string' && value.trim()) return value.trim()
  } catch {
    // 没有凭据服务（或者没有这个包）就往下走环境变量，不要让整条链断在这里。
  }
  const fromEnv = process.env[name]
  return typeof fromEnv === 'string' && fromEnv.trim() ? fromEnv.trim() : ''
}
