import project from './project.js'

export default function (rawReport) {
  const projectReport = project(rawReport)

  projectReport.files = rawReport.modules.map(moduleReport => ({
    filename: moduleReport.srcPath,
    maintainability: moduleReport.maintainability,
    methods: {
      cyclomatic: moduleReport.methodAverage.cyclomatic,
      halstead: {
        bugs: moduleReport.methodAverage.halstead.bugs,
        difficulty: moduleReport.methodAverage.halstead.difficulty
      },
      sloc: {
        physical: moduleReport.methodAverage.sloc.physical,
        logical: moduleReport.methodAverage.sloc.logical
      }
    }
  }))

  return projectReport
}
