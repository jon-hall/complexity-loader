import path from 'path'

import fs from 'mz/fs'
import moment from 'moment'

export default async function (
  reports, {
    outputDir,
    reportFilename
}) {
  reportFilename = reportFilename || `complexity-report-${moment().format('YYYY_MM_DD_HH_mm_ss_SSS')}.json`

  // TODO: Validate/process options
  await fs.writeFile(
    path.join(outputDir, reportFilename),
    JSON.stringify(reports, null, 4)
  )
}
