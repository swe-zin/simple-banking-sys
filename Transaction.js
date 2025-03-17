class Transaction {
  constructor(date, account, type, amount, id = '') {
    this.date = date;
    this.account = account;
    this.type = type.toUpperCase();
    this.amount = parseFloat(amount);
    this.id = id;
  }
}

module.exports = Transaction;
