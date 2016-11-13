import Table from 'cli-table2'

export default async function (
  report,
  options
) {
  const table = new Table({
    // TODO: For each report type, these headings should be brought in from a location we can share
    // with tests, for maintainability
    head: ['File', 'Av SLOC', 'Av Real SLOC', 'Av Cyclomtc', 'Av Bugs', 'Maintblty']
  })

  // TODO: Proper per-level table creation, this is just a mock for getting testing in place...
  // TODO: Remove this once this reporter actually works!
  try {
    table.push([
      'Project',
      report.averages.methods.sloc.physical,
      report.averages.methods.sloc.logical,
      report.averages.methods.cyclomatic,
      report.averages.methods.halstead.bugs,
      report.averages.maintainability
    ])

    console.log('Complexity report')
    console.log(table.toString())
    /* eslint-disable */
  } catch(ex) {
    /* eslint-enable */
  }
}
