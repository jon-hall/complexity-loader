import ObjectReport from './object-report.js'
import AggregateReport from './aggregate-report.js'
import { FileReport } from './file.js'
import { ProjectReport } from './project.js'

class MethodReport extends ObjectReport {
  constructor ({
    name,
    cyclomatic,
    halstead,
    sloc
  }) {
    super({
      name,
      type: 'method',
      maintainability: null,
      averages: new AggregateReport({
        cyclomatic,
        halsteadBugs: halstead.bugs,
        halsteadDifficulty: halstead.difficulty,
        slocPhysical: sloc.physical,
        slocLogical: sloc.logical
      })
    })
  }
}

export default function (rawReport) {
  // The objects within the top-level project report are the file reports
  rawReport.objects = rawReport.modules.map(moduleReport => {
    const fileReport = new FileReport(moduleReport)

    fileReport.objects = moduleReport.methods.map(methodReport => new MethodReport(methodReport))

    return fileReport
  })

  return new ProjectReport(rawReport)
}
