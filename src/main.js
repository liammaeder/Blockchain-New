const { Blockchain, Transaction,  } = require('./blockchain');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const myKey           = ec.keyFromPrivate('fd6497d37d7afebd2b31c596f25641dd02c6d0a5eba772ad24a2495cd54d1c3e');
const myWalletAddress = myKey.getPublic('hex');

let coin = new Blockchain();

const tx1 = new Transaction(myWalletAddress, 'public key goes here', 10);
tx1.signTransation(myKey);
coin.addTransaction(tx1);

console.log('\n Starting the miner');
coin.minePendingTransactions(myWalletAddress);

console.log('\n Balance is ', coin.getBalanceOfAddress(myWalletAddress));

//coin.chain[1].transactions[0].amount = 1;

console.log('Is chain valid?', coin.isChainValid());

console.log(JSON.stringify(coin, null, 4));

console.log("THis is my test")