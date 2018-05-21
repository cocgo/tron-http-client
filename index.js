const axios = require("axios");
const qs = require('qs');
const tools = require("tron-http-tools");
const config = require("./config.json");

module.exports = class{

    constructor(){
        this.url = config.api_url;
    }

    /*********************************************
     * ***************** GRPC ********************
     ********************************************/
    async getAccountProto(address){
        return await axios.get(this.url + "/grpc/getAccount?address=" + address).then(r => tools.accounts.accountFromBase64(r.data));
    }

    async getTransactionsToThisProto(address){
        return await axios.get(this.url + "/grpc/getTransactionsToThis?address=" + address).then(r => tools.transactions.transactionListFromBase64(r.data));
    }

    async getTransactionsFromThisProto(address){
        return await axios.get(this.url + "/grpc/getTransactionsFromThis?address=" + address).then(r => tools.transactions.transactionListFromBase64(r.data));
    }

    async getLastBlock(){
        return await axios.get(this.url + "/grpc/getLastBlock").then(r => tools.blocks.blockFromBase64(r.data));
    }

    /*********************************************
     ************ API USING OUR DB ***************
     ********************************************/

    async getAccount(address){
        return await axios.get(this.url + "/getAccount?address=" + address).then(x => x.data);
    }

    async getTransactionsToThis(address){
        return await axios.get(this.url + "/getTransactionsToThis?address=" + address).then(x => x.data);
    }

    async getTransactionsFromThis(address){
        return await axios.get(this.url + "/getTransactionsFromThis?address=" + address).then(x => x.data);
    }

    /*********************************************
     *********** TRON FUNCTIONALITY **************
     ********************************************/

    async sendTrx(privateKey, recipient, amount){
        return new Promise(async (resolve, reject) => {
            let nowBlock = await this.getLastBlock();

            let myAddress = tools.accounts.privateKeyToAddress(privateKey);

            let unsigned = await tools.transactions.createUnsignedTransferTransaction(myAddress, recipient, amount, nowBlock);//why does this need an await? maybe i'm too tired
            let signed = tools.transactions.signTransaction(privateKey, unsigned);
            let base64Signed = tools.utils.base64EncodeToString(signed.serializeBinary());

            let response = await axios.post(this.url + "/broadcastTransaction", qs.stringify({transaction:base64Signed}));
            let decoded = tools.api.returnFromBase64(response.data).toObject();
            if(decoded && !decoded.result)
                decoded.message = Buffer.from(decoded.message, 'base64').toString();

            resolve(decoded);
        });
    }


}

let client = new module.exports();

async function testAccount(){
    console.log("proto");
    let accountProto = await client.getAccountProto("27aqorRGesA7ptBpy2QYTaQBa5TQAg5sGbn");
    console.log(accountProto);
    console.log("obj");
    let accountObj = await client.getAccountObj("27aqorRGesA7ptBpy2QYTaQBa5TQAg5sGbn");
    console.log(accountObj);
}

async function testTransaction(){
    console.log("proto");
    let listProto = await client.getTransactionsFromThisProto("27aqorRGesA7ptBpy2QYTaQBa5TQAg5sGbn");
    console.log(listProto);
}

async function testSend(){
    let sendResponse = await client.sendTrx(
        "6D65629F6A1F79E2B277604F7A362AD9CE83B06E9EB8F007D8B682E389662097",
        "27aqorRGesA7ptBpy2QYTaQBa5TQAg5sGbn",
        1000000
    );
    console.log(sendResponse);
}

async function testGetLastBlock(){
    let block = await client.getLastBlock();
    let transactions = block.toObject();

    console.log(transactions);
}
//testSend();
//testGetLastBlock();

async function testHttpApi(){
    let account = await client.getAccount("27aqorRGesA7ptBpy2QYTaQBa5TQAg5sGbn");
    console.log(account);
    let transactionsTo = await client.getTransactionsToThis("27aqorRGesA7ptBpy2QYTaQBa5TQAg5sGbn");
    console.log('to:');
    console.log(transactionsTo);
    let transactionsFrom = await client.getTransactionsFromThis("27aqorRGesA7ptBpy2QYTaQBa5TQAg5sGbn");
    console.log('from:');
    console.log(transactionsFrom);
}

//testHttpApi();
