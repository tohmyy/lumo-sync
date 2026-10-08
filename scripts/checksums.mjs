import { createHash } from 'crypto'
import { createReadStream, existsSync, readdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const releaseDir = join(process.cwd(), 'release')

if (!existsSync(releaseDir)) {
  console.error('No release/ directory found. Run pnpm dist first.')
  process.exit(1)
}

const files = readdirSync(releaseDir).filter(
  (name) =>
    !name.endsWith('.yml') &&
    !name.endsWith('.yaml') &&
    !name.endsWith('.blockmap') &&
    name !== 'checksums.sha256' &&
    !name.endsWith('.json')
)

async function sha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(filePath)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

const lines = []
for (const name of files) {
  const digest = await sha256(join(releaseDir, name))
  lines.push(`${digest}  ${name}`)
}

const outPath = join(releaseDir, 'checksums.sha256')
writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8')
console.log(`Wrote ${outPath} (${lines.length} artifacts)`)
