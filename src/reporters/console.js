import Table from 'cli-table2'

export default async function (
  report,
  options
) {
  const table = new Table({
    // TODO: For each report type, these headings should be brought in from a location we can share
    // with tests, for maintainability
    head: ['File', 'Av SLOC', 'Av Phys SLOC', 'Av Cyclomtc', 'Av Bugs', 'Maintblty']
  })

  // TODO: Proper per-level table creation, this is just a mock for getting testing in place...
  // TODO: Remove this once this reporter actually works!
  try {
    table.push([
      'Project',
      report.averages.sloc.physical,
      report.averages.sloc.logical,
      report.averages.cyclomatic,
      report.averages.halstead.bugs,
      report.maintainability
    ])

    console.log('Complexity report')
    console.log(table.toString())
    /* eslint-disable */
  } catch(ex) {
    /* eslint-enable */
  }
}
