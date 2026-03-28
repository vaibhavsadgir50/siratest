import { cp, mkdir, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, '.sira-src', 'sira-js')
const dest = join(root, 'frontend', 'public', 'sira-js')
const bundled = join(root, 'frontend', 'src', 'lib', 'sira.js')

try {
  await stat(src)
} catch {
  console.warn(
    '[siratest] .sira-src/sira-js missing. Run: git clone --depth 1 https://github.com/vaibhavsadgir50/sira.git .sira-src',
  )
  process.exit(0)
}

await mkdir(dirname(dest), { recursive: true })
await cp(src, dest, { recursive: true })
await mkdir(dirname(bundled), { recursive: true })
await cp(join(src, 'sira.js'), bundled)

const r = spawnSync('npm', ['install', '--omit=dev'], {
  cwd: dest,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})
if (r.status !== 0) process.exit(r.status ?? 1)
console.log('[siratest] sira-js → frontend/public/sira-js and frontend/src/lib/sira.js')
