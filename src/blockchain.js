const crypto = require('crypto');
const EC     = require('elliptic').ec;
const ec     = new EC('secp256k1');

class Transaction{
    constructor(fromAddress, toAddress, amount){
        this.fromAddress = fromAddress;
        this.toAddress   = toAddress;
        this.amount      = amount;
        this.timestamp   = Date.now();
    }

    calculateHash(){
        return crypto.createHash('sha256').update(this.fromAddress + this.toAddress + this.amount + this.timestamp).digest('hex');
    }

    signTransation(signingKey){
        if(signingKey.getPublic('hex') !== this.fromAddress){
            throw new Error('You cannot sign transactions for other wallets.');
        }

        const hashTx   = this.calculateHash();
        const sig      = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }

    isValid(){
        //mining reward
        if(this.fromAddress === null) return true;

        //empty signature
        if(!this.signature || this.signature.length === 0){
            throw new Error('No signature in this transaction.');
        }

        //check that signature matches
        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);
    }
}

class Block{
    constructor(timestamp, transactions, previousHash = ''){
        this.previousHash = previousHash;
        this.timestamp    = timestamp;
        this.transactions = transactions;
        this.nonce        = 0;
        this.hash         = this.calculateHash();
    }

    calculateHash(){
        const val = crypto.createHash('sha256').update(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).digest('hex');
        return val;
    }

    mineBlock(difficulty){
        while(this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')){
            this.nonce++;
            this.hash = this.calculateHash();
        }
        console.log("Block mined: " + this.hash);
    }

    hasValidTransactions(){
        for(const tx of this.transactions){
            if(!tx.isValid()){
                return false;
            }
        }
        return true;
    }
}

class Blockchain{
    constructor(){
        this.chain               = [this.createGenesisBlock()];
        this.difficulty          = 2;
        this.pendingTransactions = [];
        this.miningReward        = 100;
    }

    createGenesisBlock(){  
        return new Block(Date.parse('2023-05-20'), [], '0');
    }

    getLatestBlock(){
        return this.chain[this.chain.length - 1];
    }

    minePendingTransactions(miningRewardAddress){
        let block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);

        console.log('Block successfully mined.');
        this.chain.push(block);

        this.pendingTransactions = [
            new Transaction(null, miningRewardAddress, this.miningReward)
        ];
    }

    addTransaction(transaction){
        //ensure from and to addresses are filled in
        if(!transaction.fromAddress || !transaction.toAddress){
            throw new Error('Transaction must include from and to address.');
        }

        //verify that transaction is valid
        if(!transaction.isValid()){
            throw new Error('Cannot add invalid transaction to chain.');
        }

        //Ensure amount is higher than 0
        if(transaction.amount <= 0){
            throw new Error('Transaction amount should be higher than 0')
        }
        /*
        //Ensure amount sent is not more than existing balance
        const walletBalance = this.getBalanceOfAddress(transaction.fromAddress);
        if(walletBalance < transaction.amount){
            throw new Error('Balance too low to perform transaction.');
        }

        //Get pending transactions from wallet
        const pendingTxForWallet = this.pendingTransactions.filter(tx => tx.fromAddress === transaction.fromAddress);

        //If wallet has pending transactions calculate total amount of spend coins and refuse transaction if balance is exceeded
        if(pendingTxForWallet.length > 0){
            const totalPendingAmount = pendingTxForWallet.map(tx => tx.amount).reduce((prev,curr) => prev + curr);
            const totalAmount        = totalPendingAmount + transaction.amount;

            if(totalAmount > walletBalance){
                throw new Error('Pending transactions for this wallet is higher than its balance.');
            }
        }*/
        this.pendingTransactions.push(transaction);
        console.log('Transaction added: ' + transaction);
    }
    
    getBalanceOfAddress(address){
        let balance = 0;

        for(const block of this.chain){
            for(const trans of block.transactions){
                if(trans.fromAddress === address){
                    balance -= trans.amount;
                }

                if(trans.toAddress === address){
                    balance += trans.amount;
                }
            }
        }
        return balance;
    }

    isChainValid(){
        for(let i = 1; i < this.chain.length; i++){
            const currentBlock  = this.chain[i];
            const previousBlock = this.chain[i - 1];

            //if any transactions are invalid
            if(!currentBlock.hasValidTransactions()){
                return false;
            }

            // check if current block's data has been changed
            if(currentBlock.hash !== currentBlock.calculateHash()){
                return false;
            }
            
            // Does current block point to previous block
            if(currentBlock.previousHash !== previousBlock.hash){
                return false;
            }
        }
        return true;
    }
    // add functionality to roll back to previous correct block in case of tampering
}

module.exports.Transaction = Transaction;
module.exports.Blockchain  = Blockchain;