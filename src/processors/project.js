import ObjectReport from './object-report.js'
import AggregateReport from './aggregate-report.js'

export class ProjectReport extends ObjectReport {
  constructor ({
    modules,
    moduleAverage: {
      maintainability,
      methodAverage: {
        cyclomatic,
        halstead,
        sloc
      }
    },
    objects
  }) {
    super({
      name: 'Project',
      type: 'project',
      maintainability,
      averages: new AggregateReport({
        cyclomatic,
        halsteadBugs: halstead.bugs,
        halsteadDifficulty: halstead.difficulty,
        slocPhysical: sloc.physical,
        slocLogical: sloc.logical
      }),
      objects
    })
  }
}

export default function (rawReport) {
  return new ProjectReport(rawReport)
}
