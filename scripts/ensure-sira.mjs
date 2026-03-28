import { stat } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const target = join(root, '.sira-src')

try {
  await stat(join(target, 'sira-node', 'package.json'))
  process.exit(0)
} catch {
  /* clone */
}

const r = spawnSync(
  'git',
  ['clone', '--depth', '1', 'https://github.com/vaibhavsadgir50/sira.git', '.sira-src'],
  { cwd: root, stdio: 'inherit' },
)
process.exit(r.status ?? 1)
