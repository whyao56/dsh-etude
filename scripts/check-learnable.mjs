import { listPacks, isLearnable, getPack } from '../lib/packs.js'
import { dataRoot } from '../lib/paths.js'

const root = dataRoot('')
const packs = await listPacks(root)
console.log('root:', root)
for (const one of packs) {
  const full = await getPack(root, one.id)
  const images = full.examples.filter((e) => e.image?.file).length
  const audios = full.examples.filter((e) => e.audio?.file && e.audio.seconds > 0).length
  console.log(
    `${one.target.padEnd(18)} ${String(one.status).padEnd(10)} 图 ${images}/${full.examples.length} 音 ${audios}/${full.examples.length}  learnable=${one.learnable}  (再算一遍 ${isLearnable(full)})`,
  )
}
