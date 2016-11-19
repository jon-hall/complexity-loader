export default class AggregateReport {
  constructor ({
    cyclomatic,
    halsteadBugs,
    halsteadDifficulty,
    slocPhysical,
    slocLogical
  }) {
    this.cyclomatic = cyclomatic

    this.halstead = {}
    this.halstead.bugs = halsteadBugs
    this.halstead.difficulty = halsteadDifficulty

    this.sloc = {}
    this.sloc.physical = slocPhysical
    this.sloc.logical = slocLogical
  }
}
