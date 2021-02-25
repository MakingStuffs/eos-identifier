// transaction.action_trace.act.data.memo
require('dotenv').config();
const fs = require("fs");
const regex = /^(([A-z0-9\.]){0,12}\.(actions\.json){1})$/i;
const chain = process.env.CHAIN;
const memosPath = `./json/${chain}/memos/`;

const getActionFilePaths = () =>
  fs.readdirSync(`./json/${chain}/actions/`).filter((file) => regex.test(file));

const getAccountNameFromPath = (path) => {
  const regex = /^(([\w\d\.]){12}(\.actions\.json))*$/gm;
  const fileExtensionRegex = /(\.actions\.json)/g;
  const filename = path.match(regex)[0];
  const withoutExtension = filename.split(fileExtensionRegex)[0]; 
  return withoutExtension;
};

const getActionFileData = (filePath) => {
  const fileData = JSON.parse(
    fs.readFileSync(`./json/${chain}/actions/${filePath}`, "utf-8")
  );
  const account_name = getAccountNameFromPath(filePath);
  return {
    account_name,
    ...fileData,
  };
};

const getMemosArray = (file) => {
  // Reduce the current transactions list into an array of memos
  // and the accounts which have deposited to them.
  const reducer = (output, current) => {
    const { memo, from, to } = current.action_trace.act.data;

    if (!memo || typeof memo === "undefined" || !/^[\da-z]*$/i.test(memo)) {
      return output;
    }

    if (to === from || from === file.account_name) {
      return output;
    }

    const currentObject = output.find((obj) => obj.memo === memo);
    // If this memo has been used with the current account move on
    const accountUsedBefore =
      currentObject && currentObject.accounts.indexOf(from) !== -1;

    if (accountUsedBefore) {
      return output;
    }

    // If there is a current object for this memo push the new account to
    // its accounts array
    if (currentObject) {
      currentObject.accounts.push(from);
      return output;
    }

    // Create a new object otherwise
    const newObject = {
      memo,
      accounts: [from],
    };
    output.push(newObject);
    return output;
  };
  const memos = file.transactions.reduce(reducer, []);

  return memos;
};

const writeOutputJson = (path) => {
  console.log(`Getting data for ${path}...`);
  const file = getActionFileData(path);
  console.log(`Building memos for ${file.account_name}...`);
  const memos = getMemosArray(file);
  console.log(`Writing to ${memosPath}${file.account_name}.memos.js...`);
  const output = {
    account_name: file.account_name,
    memos,
  };
  fs.writeFileSync(
    `${memosPath}${file.account_name}.memos.json`,
    JSON.stringify(output)
  );
  console.log(`Done, ${file.account_name} has ${memos.length} accounts...`);
};

const paths = getActionFilePaths();

paths.forEach((path) => writeOutputJson(path));
