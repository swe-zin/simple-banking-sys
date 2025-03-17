class InterestRule {
  constructor(date, id, rate) {
    this.date = date;
    this.id = id;
    this.rate = parseFloat(rate);
  }
}

module.exports = InterestRule;
