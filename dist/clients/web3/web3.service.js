"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3Service = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const web3_1 = require("web3");
let Web3Service = class Web3Service {
    configService;
    web3;
    constructor(configService) {
        this.configService = configService;
        this.web3 = new web3_1.default(this.configService.get('web3.rpcUrl') || 'http://localhost:8545');
    }
    getWeb3() {
        return this.web3;
    }
    connectToNetwork(rpcUrl) {
        this.web3 = new web3_1.default(rpcUrl);
    }
    getContract(contractAddress, abi) {
        return new this.web3.eth.Contract(abi, contractAddress);
    }
    async sendTransaction(fromAddress, toAddress, privateKey, value, gasLimit = 21000) {
        const nonce = await this.web3.eth.getTransactionCount(fromAddress, 'pending');
        const gasPrice = await this.web3.eth.getGasPrice();
        const transaction = {
            from: fromAddress,
            to: toAddress,
            value: this.web3.utils.toWei(value, 'ether'),
            gas: gasLimit,
            gasPrice: gasPrice,
            nonce: nonce,
        };
        const signedTx = await this.web3.eth.accounts.signTransaction(transaction, privateKey);
        const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        return String(receipt.transactionHash);
    }
    async getBalance(address) {
        const balance = await this.web3.eth.getBalance(address);
        return this.web3.utils.fromWei(balance, 'ether');
    }
    createAccountFromPrivateKey(privateKey) {
        return this.web3.eth.accounts.privateKeyToAccount(privateKey).address;
    }
    isValidAddress(address) {
        return this.web3.utils.isAddress(address);
    }
    async getGasPrice() {
        const gasPrice = await this.web3.eth.getGasPrice();
        return this.web3.utils.fromWei(gasPrice, 'gwei');
    }
    async estimateGas(fromAddress, toAddress, value = '0', data = '0x') {
        const gasEstimate = await this.web3.eth.estimateGas({
            from: fromAddress,
            to: toAddress,
            value: this.web3.utils.toWei(value, 'ether'),
            data: data,
        });
        return Number(gasEstimate);
    }
    async calculateTransactionFee(fromAddress, toAddress, value = '0', data = '0x', gasPrice) {
        const currentGasPrice = gasPrice
            ? this.web3.utils.toWei(gasPrice, 'gwei')
            : await this.web3.eth.getGasPrice();
        const estimatedGas = await this.estimateGas(fromAddress, toAddress, value, data);
        const totalFeeWei = BigInt(currentGasPrice) * BigInt(estimatedGas);
        const totalFeeEth = this.web3.utils.fromWei(totalFeeWei.toString(), 'ether');
        const totalFeeGwei = this.web3.utils.fromWei(totalFeeWei.toString(), 'gwei');
        return {
            gasLimit: estimatedGas,
            gasPrice: this.web3.utils.fromWei(currentGasPrice, 'gwei'),
            gasPriceGwei: this.web3.utils.fromWei(currentGasPrice, 'gwei'),
            totalFee: totalFeeEth,
            totalFeeGwei: totalFeeGwei,
        };
    }
    async calculateERC20TransactionFee(contractAddress, fromAddress, toAddress, amount, decimals = 18, gasPrice) {
        const contract = new this.web3.eth.Contract(require('../constants/contracts-apis/ERC20.json'), contractAddress);
        const multiplier = Math.pow(10, decimals);
        const tokenAmount = (parseFloat(amount) * multiplier).toString();
        const data = contract.methods.transfer(toAddress, tokenAmount).encodeABI();
        return await this.calculateTransactionFee(fromAddress, contractAddress, '0', data, gasPrice);
    }
    async hasSufficientBalance(address, amount, fee) {
        const balance = await this.getBalance(address);
        const totalRequired = parseFloat(amount) + parseFloat(fee);
        const deficit = totalRequired - parseFloat(balance);
        return {
            sufficient: parseFloat(balance) >= totalRequired,
            balance,
            required: totalRequired.toString(),
            deficit: deficit > 0 ? deficit.toString() : '0',
        };
    }
    async waitForTransactionConfirmation(txHash, confirmations = 1, timeout = 60000) {
        const startTime = Date.now();
        let i = 0;
        while (Date.now() - startTime < timeout) {
            try {
                const receipt = await this.web3.eth.getTransactionReceipt(txHash);
                if (receipt && receipt.blockNumber) {
                    const currentBlock = await this.web3.eth.getBlockNumber();
                    const confirmationsCount = Number(currentBlock) - Number(receipt.blockNumber) + 1;
                    if (confirmationsCount >= confirmations) {
                        return {
                            confirmed: true,
                            blockNumber: Number(receipt.blockNumber),
                            receipt,
                        };
                    }
                    console.log(`Waiting for transaction confirmation... ${confirmationsCount}:confirmations / ${i}:iterations`);
                    i++;
                }
                await new Promise((resolve) => setTimeout(resolve, 1500));
            }
            catch (error) {
                console.error('Error checking transaction confirmation:', error);
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }
        }
        return { confirmed: false };
    }
    async sendTransactionAndWait(fromAddress, toAddress, privateKey, value, gasLimit = 21000, confirmations = 1) {
        const txHash = await this.sendTransaction(fromAddress, toAddress, privateKey, value, gasLimit);
        const confirmation = await this.waitForTransactionConfirmation(txHash, confirmations);
        return {
            txHash,
            confirmed: confirmation.confirmed,
            blockNumber: confirmation.blockNumber,
        };
    }
};
exports.Web3Service = Web3Service;
exports.Web3Service = Web3Service = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], Web3Service);
//# sourceMappingURL=web3.service.js.map