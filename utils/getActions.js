require("dotenv").config();
const fetch = require("node-fetch");
const fs = require("fs");
const api = process.env.CHAIN_API;
const accounts = process.env.ACCOUNTS.split(",");
const chain = process.env.CHAIN;

const makeDirectories = () => {
  fs.mkdirSync(`./json/${chain}/actions`, { recursive: true });
  fs.mkdirSync(`./json/${chain}/memos`, { recursive: true });
  fs.mkdirSync(`./json/${chain}/accounts`, { recursive: true });
  fs.mkdirSync(`./json/${chain}/accounts/individual`, { recursive: true });
};

const getActions = async (pos = -1, account_name, offset) => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      account_name,
      pos,
      offset,
    }),
  };
  try {
    const request = await fetch(`${api}/get_actions`, options);

    if (request.status === 200) {
      const data = await request.json();
      return data;
    } else {
      return 'retry';
    }

  } catch (error) {
    console.log(error);
    return 'retry';
  }
};

const populateTransactions = async (account, pos = 100, array = []) => {
  let collecting = true;
  const offset = -100;

  if (array.length === 0) {
    console.log(`Fetching ${account}...`);
  }

  while (collecting) {
    let actions = await getActions(pos, account, offset);

    if (actions === "retry") {
      console.log("Too many requests, trying again");
      return setTimeout(() => populateTransactions(account, pos, array), 10000);
    }

    console.log(`Still fetching ${account}, ${array.length} entries so far...`);
    if (
      !actions ||
      typeof actions.actions === "undefined" ||
      actions.actions.length === 0
    ) {
      console.log(
        `Done fetching ${account}, ${array.length} entries fetched...`
      );
      collecting = false;
      console.log(`Writing to ${account}.json...`);
      fs.writeFileSync(
        `./json/${chain}/actions/${account}.actions.json`,
        JSON.stringify({ transactions: array })
      );
      console.log("Done writing...");
      return;
    }

    array = [...array, ...actions.actions];
    pos += 100;
  }
};

makeDirectories();

accounts.forEach(async (account) => {
  await populateTransactions(account);
  return;
});
