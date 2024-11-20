import yaml from 'js-yaml'
import fs from 'fs'
import path from 'path'
import { globby } from 'globby'

const paths = await globby('./src/**/*.{yml,ttf}')

paths.map((p) => {
  const dest = path.normalize(p).replace('src', 'lib')
  const dir = path.dirname(dest)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {
      recursive: true,
    })
  }
  const ext = path.extname(p)
  const basename = path.basename(p)
  let outputFile = basename
  if (ext === '.yml') {
    outputFile = basename.replace(ext, '.json')
    const res = yaml.load(fs.readFileSync(p, 'utf8'))
    const fd = fs.openSync(path.join(dir, outputFile), 'w')
    fs.writeFileSync(fd, JSON.stringify(res), 'utf8')
  } else {
    fs.copyFileSync(p, path.join(dir, outputFile))
  }
})
