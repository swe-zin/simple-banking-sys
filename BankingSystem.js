// BankingSystem.js
const Account = require('./Account');
const Transaction = require('./Transaction');
const InterestRule = require('./InterestRule');

class BankingSystem {
  constructor() {
    this.accounts = new Map();
    this.interestRules = [];
    this.transactionCount = new Map();
  }
  
  getAccount(accountId) {
    if (!this.accounts.has(accountId)) {
      this.accounts.set(accountId, new Account(accountId));
    }
    return this.accounts.get(accountId);
  }
  
  addTransaction(date, accountId, type, amount) {
    const formattedDate = date.replace(/[^0-9]/g, '');
    
    if (formattedDate.length !== 8) {
      throw new Error('Date should be in YYYYMMdd format');
    }
    
    try {
      const year = parseInt(formattedDate.substring(0, 4));
      const month = parseInt(formattedDate.substring(4, 6)) - 1;
      const day = parseInt(formattedDate.substring(6, 8));
      const dateObj = new Date(year, month, day);
      if (
        dateObj.getFullYear() !== year ||
        dateObj.getMonth() !== month ||
        dateObj.getDate() !== day
      ) {
        throw new Error('Invalid date');
      }
    } catch (error) {
      throw new Error('Invalid date');
    }
    
    type = type.toUpperCase();
    if (type !== 'D' && type !== 'W') {
      throw new Error('Invalid! Please type D for deposit or W for withdrawal.');
    }
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      throw new Error('Invalid! Please make sure Amount is greater than zero.');
    }
    
    if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
      throw new Error('Invalid! Please type Amount with 2 decimal.');
    }
    
    const account = this.getAccount(accountId);
    
    //check transaction
    if (type === 'W') {
      const balance = account.getBalance();
      if (balance < amountValue) {
        throw new Error(`Insufficient balance for withdrawal: ${balance.toFixed(2)}`);
      }
    }
    
    //generate transaction Id
    const dateTemp = formattedDate;
    if (!this.transactionCount.has(dateTemp)) {
      this.transactionCount.set(dateTemp, 0);
    }
    const counter = this.transactionCount.get(dateTemp) + 1;
    this.transactionCount.set(dateTemp, counter);
    const transactionId = `${dateTemp}-${counter.toString().padStart(2, '0')}`;
    
    const transaction = new Transaction(formattedDate, accountId, type, amountValue, transactionId);
    
    account.addTransaction(transaction);
    
    return transaction;
  }
  
  addInterestRule(date, ruleId, rate) {
    const formattedDate = date.replace(/[^0-9]/g, '');
    
    if (formattedDate.length !== 8) {
      throw new Error('Invalid! Please enter Date in YYYYMMdd format.');
    }
    
    const rateTemp = parseFloat(rate);
    if (isNaN(rateTemp) || rateTemp <= 0 || rateTemp >= 100) {
      throw new Error('Invalid! Please enter Interest rate between 0 and 100.');
    }
    
    this.interestRules = this.interestRules.filter(rule => rule.date !== formattedDate);
    
    const rule = new InterestRule(formattedDate, ruleId, rateTemp);
    this.interestRules.push(rule);
    
    this.interestRules.sort((a, b) => a.date.localeCompare(b.date));
    
    return rule;
  }
  
  getInterestRules() {
    return [...this.interestRules];
  }
  
  getApplicableInterestRule(date) {
    return this.interestRules
      .filter(rule => rule.date <= date)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
  }
  
  calculateInterest(accountId, year, month) {
    const account = this.getAccount(accountId);
    
    const daysPerMonth = new Date(year, month, 0).getDate();
    
    let annualInterest = 0;
    let currentBalance = 0;
    let prevDate = null;
    let prevRule = null;
    
    const startOfMonth = `${year}${month.toString().padStart(2, '0')}01`;
    currentBalance = account.getBalance(startOfMonth);
    
    const transactions = account.getTransactionsForMonth(year, month)
      .filter(txn => txn.type === 'D' || txn.type === 'W')
      .sort((a, b) => a.date.localeCompare(b.date));
    
    const transactionsByDate = new Map();
    for (const txn of transactions) {
      if (!transactionsByDate.has(txn.date)) {
        transactionsByDate.set(txn.date, []);
      }
      transactionsByDate.get(txn.date).push(txn);
    }
    
    for (let day = 1; day <= daysPerMonth; day++) {
      const dateStr = `${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`;
      
      if (transactionsByDate.has(dateStr)) {
        for (const txn of transactionsByDate.get(dateStr)) {
          if (txn.type === 'D') {
            currentBalance += txn.amount;
          } else if (txn.type === 'W') {
            currentBalance -= txn.amount;
          }
        }
      }
      
      const rule = this.getApplicableInterestRule(dateStr);
      
      if (rule) {
        if (prevDate && prevRule && (prevRule.id !== rule.id || !prevDate)) {
          const daysPerPeriod = day - prevDate;
          const periodInterest = currentBalance * (prevRule.rate / 100) * daysPerPeriod;
          annualInterest += periodInterest;
          prevDate = day;
          prevRule = rule;
        } else if (!prevDate) {
          prevDate = day;
          prevRule = rule;
        }
      }
    }
    
    if (prevDate && prevRule) {
      const daysPerPeriod = daysPerMonth + 1 - prevDate;
      const periodInterest = currentBalance * (prevRule.rate / 100) * daysPerPeriod;
      annualInterest += periodInterest;
    }
    
    const interest = annualInterest / 365;
    
    return Math.round(interest * 100) / 100;
  }
  
  generateStatement(accountId, year, month) {
    const account = this.getAccount(accountId);
    const monthInt = parseInt(month);
    
    const monthTemp = month.toString().padStart(2, '0');
    const startOfMonth = `${year}${monthTemp}01`;
    
    const beginningBalance = account.getBalance(new Date(`${year}-${monthInt}-01`));
    
    const transactions = account.getTransactionsForMonth(year, monthInt);
    
    const interest = this.calculateInterest(accountId, year, monthInt);
    
    const lastDayOfMonth = new Date(year, monthInt, 0).getDate();
    const interestTransaction = new Transaction(
      `${year}${monthTemp}${lastDayOfMonth.toString().padStart(2, '0')}`,
      accountId,
      'I',
      interest,
      ''
    );
    
    return {
      accountId,
      beginningBalance,
      transactions: [...transactions, interestTransaction],
    };
  }
}

module.exports = BankingSystem;
