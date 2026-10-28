import { EtudeError } from './util.js'

/**
 * 一个很小、很笨的后台任务表。
 *
 * 为什么要有它：造 8 条例句是一次 10–30 秒的模型调用，找 8 张候选图是几十次
 * 网络往返，合成 8 条语音又要一条一条来。把这些都塞进一次请求里，界面就只能
 * 转圈，用户既不知道进行到哪一步，也不知道该不该等。所以：开任务、立刻返回
 * 任务号、界面轮询任务日志。
 *
 * 它有意识地**不**持久化：进程重启之后这里空掉，而账本里那条记录的 status
 * 会告诉你上次停在哪 —— 状态的真源是账本，不是这张表。
 */
export function createJobRunner({ limit = 40, keepMs = 10 * 60 * 1000 } = {}) {
  const jobs = new Map()
  let counter = 0

  function prune() {
    const now = Date.now()
    for (const [id, job] of jobs) {
      if (job.status === 'running') continue
      if (now - (job.finishedAt ?? job.startedAt) > keepMs) jobs.delete(id)
    }
    while (jobs.size > limit) {
      const oldest = [...jobs.entries()].find(([, job]) => job.status !== 'running')
      if (!oldest) break
      jobs.delete(oldest[0])
    }
  }

  function start(kind, label, work) {
    prune()
    const id = `job-${Date.now().toString(36)}-${(counter += 1)}`
    const controller = new AbortController()
    const job = {
      id,
      kind,
      label,
      status: 'running',
      log: [],
      startedAt: Date.now(),
      finishedAt: null,
      error: null,
      result: null,
      progress: null,
    }
    jobs.set(id, job)
    const push = (message) => {
      const text = String(message ?? '').trim()
      if (!text) return
      job.log.push(text)
      if (job.log.length > 200) job.log.splice(0, job.log.length - 200)
    }
    job.controller = controller
    Promise.resolve()
      .then(() => work({ signal: controller.signal, onProgress: push, setProgress: (value) => { job.progress = value } }))
      .then((result) => {
        job.status = 'done'
        job.result = result ?? null
        job.finishedAt = Date.now()
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          job.status = 'cancelled'
        } else {
          job.status = 'failed'
          job.error = error instanceof Error ? error.message : String(error)
          job.code = error instanceof EtudeError ? error.code : 'internal'
        }
        job.finishedAt = Date.now()
      })
    return serialize(job)
  }

  function get(id) {
    const job = jobs.get(String(id))
    if (!job) throw new EtudeError(`没有这个任务：${id}`, 'job-not-found')
    return serialize(job)
  }

  function cancel(id) {
    const job = jobs.get(String(id))
    if (!job) throw new EtudeError(`没有这个任务：${id}`, 'job-not-found')
    if (job.status === 'running') job.controller.abort()
    return serialize(job)
  }

  function running() {
    return [...jobs.values()].filter((job) => job.status === 'running').map(serialize)
  }

  function serialize(job) {
    return {
      id: job.id,
      kind: job.kind,
      label: job.label,
      status: job.status,
      log: job.log.slice(-40),
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      error: job.error,
      code: job.code ?? null,
      result: job.result,
      progress: job.progress,
    }
  }

  return { start, get, cancel, running }
}
