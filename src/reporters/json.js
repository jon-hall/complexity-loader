import path from 'path'

import fs from 'mz/fs'
import fsx from 'fs-extra'

import { promisify } from '../utils.js'

export default async function (
  reports, {
    outputDir,
    reportFilename
}) {
  // Make sure the report filename ends with .json (replace with .json with .json if already
  // present, else add it on)
  const outputFile = path.join(outputDir, reportFilename.replace(/(.)(?:\.json)?$/, '$1.json'))

  await promisify(fsx.ensureDir, fsx)(outputDir + '\\', promisify.done)
  await fs.writeFile(outputFile, JSON.stringify(reports, null, 4))
}
