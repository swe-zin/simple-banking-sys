class Account {
  constructor(id) {
    this.id = id;
    this.transactions = [];
  }
  
  addTransaction(transaction) {
    this.transactions.push(transaction);
  }
  
  getBalance(date = new Date()) {
    const dateTemp = typeof date === 'string' ? date : 
      `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    
    return this.transactions
      .filter(txn => txn.date <= dateTemp)
      .reduce((balance, txn) => {
        if (txn.type === 'D') {
          return balance + txn.amount;
        } else if (txn.type === 'W') {
          return balance - txn.amount;
        } else if (txn.type === 'I') {
          return balance + txn.amount;
        }
        return balance;
      }, 0);
  }
  
  getTransactionsForMonth(year, month) {
    const yearTemp = String(year);
    const monthTemp = String(month).padStart(2, '0');
    const prefix = yearTemp + monthTemp;
    
    return this.transactions.filter(txn => 
      txn.date.startsWith(prefix)
    );
  }
}

module.exports = Account;
