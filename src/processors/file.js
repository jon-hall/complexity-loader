import ObjectReport from './object-report.js'
import AggregateReport from './aggregate-report.js'
import { ProjectReport } from './project.js'

class FileReport extends ObjectReport {
  constructor ({
    srcPath,
    maintainability,
    methodAverage: {
      cyclomatic,
      halstead,
      sloc
    }
  }) {
    super({
      name: srcPath,
      type: 'file',
      maintainability,
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
  rawReport.objects = rawReport.modules.map(moduleReport => new FileReport(moduleReport))

  return new ProjectReport(rawReport)
}
