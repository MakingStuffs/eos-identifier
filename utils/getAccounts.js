const fs = require("fs");
require('dotenv').config()
const chain = process.env.CHAIN;
const memoPath = `./json/${chain}/memos/`;
const accountPath = `./json/${chain}/accounts/`;
const memosFilenamesArray = fs.readdirSync(memoPath, "utf-8");

/**
 * {
 *  account_name: account_name,
 *  exchanges: [
 *      {
 *          wallet: exchange_wallet,
 *          memo: memo
 *      }
 *  ]
 *  associated_accounts: [
 *      {
 *          account_name: account_name,
 *          paired_exchange: exchange_wallet
 *      }
 *  ]
 * }
 */

let accounts = [];

const getFileDataAsJson = (filePath) =>
  JSON.parse(fs.readFileSync(filePath, "utf-8"));
const buildExchangeObject = (wallet, memo_id) => ({ wallet, memo_id });
const getAssociatedAccounts = (
  accounts,
  accountToFind,
  paired_exchange,
  memo
) =>
  accounts.reduce((op, curr) => {
    if (curr !== accountToFind) {
      op.push({
        paired_exchange,
        account_name: curr,
        memo,
      });
      return op;
    }
    return op;
  }, []);
const getAccountObjectFromArray = (array, account) => {
  const output = array.find((obj) => obj.account_name === account);
  return typeof output === "undefined" ? null : output;
};
// Iterate all memo files
memosFilenamesArray.forEach((memoFilename) => {
  // Get the file data and parse into JSON
  const file = getFileDataAsJson(`${memoPath}${memoFilename}`);

  const { account_name, memos } = file;

  const reducer = (output, current) => {
    // Iterate accounts in the current memo's user account array
    current.accounts.map((account) => {
      // Check if this account is already in the output array
      const currentAccountObject = getAccountObjectFromArray(output, account);

      if (currentAccountObject) {
        return output;
      }

      const associated_accounts = getAssociatedAccounts(
        current.accounts,
        account,
        account_name,
        current.memo
      );
      const exchangeObject = buildExchangeObject(account_name, current.memo);

      // New object
      const newAccountObject = {
        account_name: account,
        exchanges: [exchangeObject],
        associated_accounts,
      };

      output.push(newAccountObject);
    });

    return output;
  };
  const accountList = memos.reduce(reducer, []);

  accounts = [...accounts, ...accountList];
});

const accountsReducers = (output, current) => {
  const currentObject = output.find(
    (item) => item.account_name === current.account_name
  );

  if (typeof currentObject !== "undefined") {
    const currentExchangeObject = currentObject.exchanges.find(
      (exchange) => exchange.wallet === current.exchanges[0].wallet
    );

    if (typeof currentExchangeObject === "undefined") {
      currentObject.exchanges = [
        ...currentObject.exchanges,
        ...current.exchanges,
      ];
    }

    currentObject.associated_accounts = [
      ...currentObject.associated_accounts,
      ...current.associated_accounts,
    ];

    return output;
  } else {
    output.push(current);
    return output;
  }
};

const sorted = accounts.reduce(accountsReducers, []);

sorted.forEach((acc) => {
  fs.writeFileSync(
    `${accountPath}individual/${acc.account_name}.accounts.acc.json`,
    JSON.stringify(acc)
  );
});

fs.writeFileSync(`${accountPath}accounts.acc.json`, JSON.stringify(accounts));
fs.writeFileSync(
  `${accountPath}sorted.accounts.acc.json`,
  JSON.stringify({ total_accounts: sorted.length, accounts: sorted })
);

console.log(`Pre sort: ${accounts.length}`)
console.log(`Post sort: ${sorted.length}`)