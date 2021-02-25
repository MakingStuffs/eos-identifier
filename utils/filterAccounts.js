require("dotenv").config();
const fs = require("fs");
const chain = process.env.CHAIN;

const accountsObject = JSON.parse(
  fs.readFileSync(`./json/${chain}/accounts/sorted.accounts.acc.json`, "utf-8")
);

let blacklist = [];
const checkBlacklist = (account) => blacklist.includes(account);

const reducer = (output, current) => {
  let isUnique;
  const isBlacklisted = checkBlacklist(current.account_name);
  const hasAssociates = current.associated_accounts.length > 0;

  if (isBlacklisted || hasAssociates) {
    isUnique = false;
  } else {
    isUnique = true;
  }

  if (hasAssociates) {
    current.associated_accounts.forEach((account) => {
      const isBlacklisted = checkBlacklist(account.account_name);
      if (!isBlacklisted) {
        blacklist.push(account.account_name);
      }
    });
  }

  if (isUnique) {
    output += 1;
  }

  return output;
};

console.log('Filtering unique accounts by paired memo...')

const interval = setInterval(() => {
    console.log('Still filtering accounts...')
}, 2000)

const uniqueAccounts = accountsObject.accounts.reduce(reducer, 0);

clearInterval(interval);

console.log('----------------');
console.log(`There are ${uniqueAccounts} unique accounts from ${accountsObject.accounts.length} on the ${chain.toUpperCase()} network which have interacted with the following wallets: ${process.env.ACCOUNTS.split(',').join(', ')}`);
console.log('----------------');
