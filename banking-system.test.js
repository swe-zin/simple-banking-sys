// banking-system.test.js
const BankingSystem = require('./BankingSystem');
const Account = require('./Account');
const Transaction = require('./Transaction');
const InterestRule = require('./InterestRule');

describe('Account', () => {
  test('should calculate the balance correctly', () => {
    const account = new Account('AC001');
    account.addTransaction(new Transaction('20230101', 'AC001', 'D', 100, '20230101-01'));
    account.addTransaction(new Transaction('20230102', 'AC001', 'D', 200, '20230102-01'));
    account.addTransaction(new Transaction('20230103', 'AC001', 'W', 50, '20230103-01'));
    account.addTransaction(new Transaction('20230104', 'AC001', 'I', 10, ''));
    
    expect(account.getBalance()).toBe(260);
  });
  
  test('should get transactions for a specific month', () => {
    const account = new Account('AC001');
    account.addTransaction(new Transaction('20230101', 'AC001', 'D', 100, '20230101-01'));
    account.addTransaction(new Transaction('20230202', 'AC001', 'D', 200, '20230202-01'));
    account.addTransaction(new Transaction('20230303', 'AC001', 'W', 50, '20230303-01'));
    
    const transactions = account.getTransactionsForMonth(2023, 2);
    expect(transactions.length).toBe(1);
    expect(transactions[0].date).toBe('20230202');
  });
});

describe('BankingSystem', () => {
  let bankingSystem;
  
  beforeEach(() => {
    bankingSystem = new BankingSystem();
  });
  
  test('should create an account when it does not exist', () => {
    const account = bankingSystem.getAccount('AC001');
    expect(account).toBeDefined();
    expect(account.id).toBe('AC001');
  });
  
  test('should return an existing account when it exists', () => {
    const account1 = bankingSystem.getAccount('AC001');
    const account2 = bankingSystem.getAccount('AC001');
    expect(account1).toBe(account2);
  });
  
  test('should add a transaction', () => {
    const transaction = bankingSystem.addTransaction('20230101', 'AC001', 'D', '100.00');
    expect(transaction).toBeDefined();
    expect(transaction.date).toBe('20230101');
    expect(transaction.account).toBe('AC001');
    expect(transaction.type).toBe('D');
    expect(transaction.amount).toBe(100);
    expect(transaction.id).toBe('20230101-01');
    
    const account = bankingSystem.getAccount('AC001');
    expect(account.transactions).toContain(transaction);
  });
  
  test('should not allow withdrawal when balance is insufficient', () => {
    expect(() => {
      bankingSystem.addTransaction('20230101', 'AC001', 'W', '100.00');
    }).toThrow('Insufficient balance for withdrawal');
  });
  
  test('should allow withdrawal when balance is sufficient', () => {
    bankingSystem.addTransaction('20230101', 'AC001', 'D', '200.00');
    const transaction = bankingSystem.addTransaction('20230102', 'AC001', 'W', '100.00');
    expect(transaction).toBeDefined();
    expect(transaction.type).toBe('W');
    expect(transaction.amount).toBe(100);
  });
  
  test('should add an interest rule', () => {
    const rule = bankingSystem.addInterestRule('20230101', 'RULE01', '1.95');
    expect(rule).toBeDefined();
    expect(rule.date).toBe('20230101');
    expect(rule.id).toBe('RULE01');
    expect(rule.rate).toBe(1.95);
    
    const rules = bankingSystem.getInterestRules();
    expect(rules).toContain(rule);
  });
  
  test('should replace an existing rule on the same day', () => {
    bankingSystem.addInterestRule('20230101', 'RULE01', '1.95');
    const rule = bankingSystem.addInterestRule('20230101', 'RULE02', '2.00');
    
    const rules = bankingSystem.getInterestRules();
    expect(rules.length).toBe(1);
    expect(rules[0]).toBe(rule);
    expect(rules[0].id).toBe('RULE02');
  });
  
  test('should sort interest rules by date', () => {
    bankingSystem.addInterestRule('20230201', 'RULE02', '2.00');
    bankingSystem.addInterestRule('20230101', 'RULE01', '1.95');
    
    const rules = bankingSystem.getInterestRules();
    expect(rules.length).toBe(2);
    expect(rules[0].date).toBe('20230101');
    expect(rules[1].date).toBe('20230201');
  });
  
  test('should get the applicable interest rule for a date', () => {
    bankingSystem.addInterestRule('20230101', 'RULE01', '1.95');
    bankingSystem.addInterestRule('20230201', 'RULE02', '2.00');
    
    const rule = bankingSystem.getApplicableInterestRule('20230115');
    expect(rule).toBeDefined();
    expect(rule.id).toBe('RULE01');
  });
  
  test('should calculate interest correctly for example scenario', () => {
    bankingSystem.addInterestRule('20230101', 'RULE01', '1.95');
    bankingSystem.addInterestRule('20230520', 'RULE02', '1.90');
    bankingSystem.addInterestRule('20230615', 'RULE03', '2.20');
    
    bankingSystem.addTransaction('20230505', 'AC001', 'D', '100.00');
    bankingSystem.addTransaction('20230601', 'AC001', 'D', '150.00');
    bankingSystem.addTransaction('20230626', 'AC001', 'W', '20.00');
    bankingSystem.addTransaction('20230626', 'AC001', 'W', '100.00');
    
    const interest = bankingSystem.calculateInterest('AC001', '2023', '06');
    expect(interest).toBeCloseTo(0.39, 2);
  });
  
  test('should validate date format', () => {
    expect(() => {
      bankingSystem.addTransaction('202301', 'AC001', 'D', '100.00');
    }).toThrow('Date should be in YYYYMMdd format');
  });
  
  test('should validate transaction type', () => {
    expect(() => {
      bankingSystem.addTransaction('20230101', 'AC001', 'X', '100.00');
    }).toThrow('Type should be D for deposit or W for withdrawal');
  });
  
  test('should validate amount is greater than zero', () => {
    expect(() => {
      bankingSystem.addTransaction('20230101', 'AC001', 'D', '0');
    }).toThrow('Amount must be greater than zero');
  });
  
  test('should validate amount has up to 2 decimal places', () => {
    expect(() => {
      bankingSystem.addTransaction('20230101', 'AC001', 'D', '100.123');
    }).toThrow('Amount must have up to 2 decimal places');
  });
  
  test('should validate interest rate', () => {
    expect(() => {
      bankingSystem.addInterestRule('20230101', 'RULE01', '0');
    }).toThrow('Interest rate should be greater than 0 and less than 100');
    
    expect(() => {
      bankingSystem.addInterestRule('20230101', 'RULE01', '100');
    }).toThrow('Interest rate should be greater than 0 and less than 100');
  });
  
  test('should generate a statement with correct balances', () => {
    bankingSystem.addInterestRule('20230101', 'RULE01', '1.95');
    bankingSystem.addInterestRule('20230520', 'RULE02', '1.90');
    bankingSystem.addInterestRule('20230615', 'RULE03', '2.20');
    
    bankingSystem.addTransaction('20230505', 'AC001', 'D', '100.00');
    bankingSystem.addTransaction('20230601', 'AC001', 'D', '150.00');
    bankingSystem.addTransaction('20230626', 'AC001', 'W', '20.00');
    bankingSystem.addTransaction('20230626', 'AC001', 'W', '100.00');
    
    const statement = bankingSystem.generateStatement('AC001', '2023', '06');
    
    expect(statement).toBeDefined();
    expect(statement.accountId).toBe('AC001');
    expect(statement.transactions.length).toBe(4);
    
    const interestTxn = statement.transactions.find(txn => txn.type === 'I');
    expect(interestTxn).toBeDefined();
    expect(interestTxn.amount).toBeCloseTo(0.39, 2);
    expect(interestTxn.date).toBe('20230630');
  });
});
