import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import archiver from 'archiver'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')
const releaseDir = path.join(root, 'release')
const electronDist = path.join(root, 'node_modules', 'electron', 'dist')
const outDir = path.join(root, 'out')
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const safeProductName = (packageJson.productName ?? packageJson.name ?? 'davids.lab').replace(
  /[^a-zA-Z0-9.-]+/g,
  '-'
)
const zipBaseName = safeProductName.toLowerCase().replace(/\./g, '-')
const releaseDirName = process.env.LAB_RELEASE_DIR_NAME ?? `${safeProductName}-win-unpacked`
const portableZipName =
  process.env.LAB_RELEASE_ZIP_NAME ?? `${zipBaseName}-${packageJson.version}-win-portable.zip`
const unpackedDir = path.join(releaseDir, releaseDirName)
const appDir = path.join(unpackedDir, 'resources', 'app')
const portableZip = path.join(releaseDir, portableZipName)
const runtimeNodeModules = path.join(appDir, 'node_modules')

function safeRm(target) {
  const resolved = path.resolve(target)
  const allowedRoot = path.resolve(releaseDir)

  if (!resolved.startsWith(allowedRoot)) {
    throw new Error(`Refusing to remove path outside release dir: ${resolved}`)
  }

  fs.rmSync(resolved, { recursive: true, force: true })
}

function safeCp(from, to) {
  fs.cpSync(from, to, { recursive: true, force: true })
}

fs.mkdirSync(releaseDir, { recursive: true })
safeRm(unpackedDir)
if (fs.existsSync(portableZip)) {
  safeRm(portableZip)
}

safeCp(electronDist, unpackedDir)
fs.renameSync(
  path.join(unpackedDir, 'electron.exe'),
  path.join(unpackedDir, `${safeProductName}.exe`)
)
fs.mkdirSync(appDir, { recursive: true })
safeCp(outDir, path.join(appDir, 'out'))

const runtimePackageJson = {
  name: packageJson.name,
  productName: packageJson.productName,
  version: packageJson.version,
  author: packageJson.author,
  main: packageJson.main,
  type: packageJson.type,
  dependencies: packageJson.dependencies
}

fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify(runtimePackageJson, null, 2))

safeCp(path.join(root, 'node_modules'), runtimeNodeModules)

for (const moduleName of ['electron', 'electron-builder', 'electron-vite']) {
  const modulePath = path.join(runtimeNodeModules, moduleName)
  if (fs.existsSync(modulePath)) {
    fs.rmSync(modulePath, { recursive: true, force: true })
  }
}

await new Promise((resolve, reject) => {
  const output = fs.createWriteStream(portableZip)
  const archive = archiver('zip', { zlib: { level: 9 } })

  output.on('close', resolve)
  archive.on('error', reject)
  archive.pipe(output)
  archive.directory(unpackedDir, releaseDirName)
  void archive.finalize()
})

console.log(`Created unpacked release at ${unpackedDir}`)
console.log(`Created portable zip at ${portableZip}`)
