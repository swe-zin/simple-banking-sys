const readline = require('readline');
const BankingSystem = require('./BankingSystem');

const bankingSystem = new BankingSystem();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function formatTable(headers, rows) {
  const output = [];
  
  output.push('| ' + headers.join(' | ') + ' |');
  
  for (const row of rows) {
    output.push('| ' + row.join(' | ') + ' |');
  }
  
  return output.join('\n');
}

function displayMainMenu() {
  console.log('Welcome to AwesomeGIC Bank! What would you like to do?');
  console.log('[T] Input transactions');
  console.log('[I] Define interest rules');
  console.log('[P] Print statement');
  console.log('[Q] Quit');
  rl.question('> ', handleMainMenuChoice);
}

function handleMainMenuChoice(choice) {
  switch(choice.toUpperCase()) {
    case 'T':
      inputTransactions();
      break;
    case 'I':
      defineInterestRules();
      break;
    case 'P':
      printStatement();
      break;
    case 'Q':
      quit();
      break;
    default:
      console.log('Invalid! Please try again.');
      displayMainMenu();
  }
}

function inputTransactions() {
  console.log('\nPlease enter transaction details in <Date> <Account> <Type> <Amount> format\n(or enter blank to go back to main menu):');
  rl.question('> ', handleTransactionInput);
}

function handleTransactionInput(input) {
  if (!input.trim()) {
    displayMainMenu();
    return;
  }
  
  const parts = input.trim().split(/\s+/);
  if (parts.length < 4) {
    console.log('Invalid input format. Please try again.');
    inputTransactions();
    return;
  }
  
  const [date, accountId, type, amount] = parts;
  
  try {
    bankingSystem.addTransaction(date, accountId, type, amount);
    
    const account = bankingSystem.getAccount(accountId);
    console.log(`\nAccount: ${accountId}`);
    
    const headers = ['Date', 'Txn Id', 'Type', 'Amount'];
    const rows = account.transactions
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(txn => [
        txn.date,
        txn.id.padEnd(11),
        txn.type.padEnd(4),
        txn.amount.toFixed(2).padStart(6)
      ]);
    
    console.log(formatTable(headers, rows));
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
  
  displayMainMenu();
}

function defineInterestRules() {
  console.log('\nPlease enter interest rules details in <Date> <RuleId> <Rate in %> format\n(or enter blank to go back to main menu):');
  rl.question('> ', handleInterestRuleInput);
}

function handleInterestRuleInput(input) {
  if (!input.trim()) {
    displayMainMenu();
    return;
  }
  
  const parts = input.trim().split(/\s+/);
  if (parts.length < 3) {
    console.log('Invalid input format. Please try again.');
    defineInterestRules();
    return;
  }
  
  const [date, ruleId, rate] = parts;
  
  try {
    bankingSystem.addInterestRule(date, ruleId, rate);
    
    const rules = bankingSystem.getInterestRules();
    console.log('\nInterest rules:');
    
    const headers = ['Date', 'RuleId', 'Rate (%)'];
    const rows = rules.map(rule => [
      rule.date,
      rule.id,
      rule.rate.toFixed(2).padStart(7)
    ]);
    
    console.log(formatTable(headers, rows));
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
  
  displayMainMenu();
}

function printStatement() {
  console.log('\nPlease enter account and month to generate the statement <Account> <Year><Month>\n(or enter blank to go back to main menu):');
  rl.question('> ', handleStatementRequest);
}

function handleStatementRequest(input) {
  if (!input.trim()) {
    displayMainMenu();
    return;
  }
  
  const parts = input.trim().split(/\s+/);
  if (parts.length < 2) {
    console.log('Invalid input format. Please try again.');
    printStatement();
    return;
  }
  
  const [accountId, yearMonth] = parts;
  if (yearMonth.length !== 6) {
    console.log('Invalid year/month format. Please use YYYYMM format.');
    printStatement();
    return;
  }
  
  const year = yearMonth.substring(0, 4);
  const month = yearMonth.substring(4, 6);
  
  try {
    const statement = bankingSystem.generateStatement(accountId, year, month);
    
    console.log(`\nAccount: ${accountId}`);
    
    const headers = ['Date', 'Txn Id', 'Type', 'Amount', 'Balance'];
    const rows = [];
    
    let runningBalance = statement.beginningBalance;
    
    for (const txn of statement.transactions.sort((a, b) => a.date.localeCompare(b.date))) {
      if (txn.type === 'D' || txn.type === 'I') {
        runningBalance += txn.amount;
      } else if (txn.type === 'W') {
        runningBalance -= txn.amount;
      }
      
      rows.push([
        txn.date,
        txn.id.padEnd(11),
        txn.type.padEnd(4),
        txn.amount.toFixed(2).padStart(6),
        runningBalance.toFixed(2).padStart(7)
      ]);
    }
    
    console.log(formatTable(headers, rows));
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
  
  displayMainMenu();
}

function quit() {
  console.log('\nThank you for banking with AwesomeGIC Bank.\nHave a nice day!');
  rl.close();
}

displayMainMenu();
