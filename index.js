const axios = require("axios");
const qs = require('qs');
const config = require("./config.json");
const tools = require("tron-http-tools");

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

    async listWitnesses(){
        return await axios.get(this.url + "/grpc/listWitnesses").then(r => tools.witnesses.witnessesFromWitnessListBase64(r.data));
    }

    /*********************************************
     ************ API USING OUR DB ***************
     ********************************************/

    async getAccount(address){
        return await axios.get(this.url + "/getAccount?address=" + address).then(x => x.data);
    }

    async getAccounts(addresses){
        return await axios.get(this.url + "/getAccounts?addresses=" + addresses.join(",")).then(x => x.data);
    }

    async getTransactionsToThis(address){
        return await axios.get(this.url + "/getTransactionsToThis?address=" + address).then(x => x.data);
    }

    async getTransactionsFromThis(address){
        return await axios.get(this.url + "/getTransactionsFromThis?address=" + address).then(x => x.data);
    }

    async getTransactionsRelatedToThis(address){
        return await axios.get(this.url + "/getTransactionsRelatedToThis?address=" + address).then(x => x.data);
    }

    async getTokens(){
        return await axios.get(this.url + "/getTokens").then(x => x.data);
    }

    /*********************************************
     *********** TRON FUNCTIONALITY **************
     ********************************************/

    async signAndBroadcastTransaction(privateKey, unsigned){
        let signed = tools.transactions.signTransaction(privateKey, unsigned);
        let base64Signed = tools.utils.base64EncodeToString(signed.serializeBinary());
        let response = await axios.post(this.url + "/grpc/broadcastTransaction", qs.stringify({transaction:base64Signed}));
        let decoded = tools.api.returnFromBase64(response.data).toObject();
        if(decoded && !decoded.result)
            decoded.message = Buffer.from(decoded.message, 'base64').toString();
        return decoded;
    }

    async sendTrx(privateKey, recipient, amount){
        let nowBlock = await this.getLastBlock();
        let myAddress = tools.accounts.privateKeyToAddress(privateKey);
        console.log(myAddress);
        let props = {
            sender : myAddress,
            recipient : recipient,
            amount : amount
        };
        let unsigned = await tools.transactions.createUnsignedTransferTransaction(props, nowBlock);
        return this.signAndBroadcastTransaction(privateKey, unsigned);
    }

    async sendToken(privateKey, recipient, amount, token){
        let nowBlock = await this.getLastBlock();
        let myAddress = tools.accounts.privateKeyToAddress(privateKey);
        console.log(myAddress);
        let props = {
            sender : myAddress,
            recipient : recipient,
            amount : amount,
            assetName: token
        };
        let unsigned = await tools.transactions.createUnsignedTransferAssetTransaction(props, nowBlock);
        return this.signAndBroadcastTransaction(privateKey, unsigned);
    }

    async issueAsset(privateKey, props){
        let nowBlock = await this.getLastBlock();
        props.sender = tools.accounts.privateKeyToAddress(privateKey);

        let unsigned = await tools.transactions.createUnsignedAssetIssueTransaction(props, nowBlock);
        return this.signAndBroadcastTransaction(privateKey, unsigned);
    }

    async freezeTrx(privateKey, amount, duration=3){
        let nowBlock = await this.getLastBlock();
        let props = {
            ownerAddress : tools.accounts.privateKeyToAddress(privateKey),
            amount : amount,
            duration : duration
        };

        let unsigned = await tools.transactions.createUnsignedFreezeBalanceTransaction(props, nowBlock);
        console.log(unsigned.toObject());
        return this.signAndBroadcastTransaction(privateKey, unsigned);
    }

    async unfreezeTrx(privateKey){
        let nowBlock = await this.getLastBlock();
        let props = {
            ownerAddress : tools.accounts.privateKeyToAddress(privateKey),
        };

        let unsigned = await tools.transactions.createUnsignedUnfreezeBalanceTransaction(props, nowBlock);
        return this.signAndBroadcastTransaction(privateKey, unsigned);
    }
};

/*
let client = new module.exports();
async function testTokenSend(){
   client.sendToken("639044ccb48a99b9f1f1818b43f58f0df53fba261ea9fa59c067c04fd7c2dbd7","27d3byPxZXKQWfXX7sJvemJJuv5M65F3vjS",1,"TestTokenOne");

}
testTokenSend();

*/


/*
function testSend(){
    client.sendTrx("0e90a10554e94bff057c32227d020604ac8a8c7fe1849a47de830c952768ce68","27d3byPxZXKQWfXX7sJvemJJuv5M65F3vjS",5);
}

async function testCreateToken(){
    let startTime = Date.now() + (60*1000);
    let endTime = Date.now() + (60*1000*60*24);

    let props = {
        assetName : "TronWatchTest",
        assetAbbr : "TWT",
        totalSupply : 5000000,
        num : 1,
        trxNum : 1,
        endTime : endTime,
        startTime : startTime,
        description : "test token description here",
        url : "https://tron.watch"
    };

    let response = await client.issueAsset("0e90a10554e94bff057c32227d020604ac8a8c7fe1849a47de830c952768ce68", props);
    console.log(response);
}
async function testFreezing(){
    let response = await client.freezeTrx("0e90a10554e94bff057c32227d020604ac8a8c7fe1849a47de830c952768ce68", 5000);
    console.log(response);
}

//testSend();
//testCreateToken();

testFreezing();
*/
