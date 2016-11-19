export default class ObjectReport {
  constructor ({
    name,
    type,
    maintainability,
    averages,
    totals,
    objects
  }) {
    this.name = name
    this.type = type
    this.maintainability = maintainability
    this.averages = averages
    this.totals = totals
    this.objects = objects
  }
}
