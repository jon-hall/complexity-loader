export default function (rawReport) {
  return {
    files: rawReport.modules.length,
    averages: {
      maintainability: rawReport.moduleAverage.maintainability,
      methods: {
        cyclomatic: rawReport.moduleAverage.methodAverage.cyclomatic,
        halstead: {
          bugs: rawReport.moduleAverage.methodAverage.halstead.bugs,
          difficulty: rawReport.moduleAverage.methodAverage.halstead.difficulty
        },
        sloc: {
          physical: rawReport.moduleAverage.methodAverage.sloc.physical,
          logical: rawReport.moduleAverage.methodAverage.sloc.logical
        }
      }
    }
  }
}
