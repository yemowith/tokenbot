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
exports.TokenTransferService = void 0;
const common_1 = require("@nestjs/common");
const web3_service_1 = require("../../clients/web3/web3.service");
const prisma_service_1 = require("../../clients/prisma/prisma.service");
let TokenTransferService = class TokenTransferService {
    web3Service;
    prismaService;
    constructor(web3Service, prismaService) {
        this.web3Service = web3Service;
        this.prismaService = prismaService;
    }
    async sendERC20Transaction(contractAddress, fromAddress, toAddress, privateKey, amount, decimals) {
        const contract = this.web3Service.getContract(contractAddress, require('../../constants/contracts-apis/ERC20.json'));
        const nonce = await this.web3Service
            .getWeb3()
            .eth.getTransactionCount(fromAddress, 'pending');
        const gasPrice = await this.web3Service.getWeb3().eth.getGasPrice();
        const tokenDecimals = decimals ?? (await this.getERC20Decimals(contractAddress));
        const multiplier = Math.pow(10, tokenDecimals);
        const tokenAmount = (parseFloat(amount) * multiplier).toString();
        const data = contract.methods.transfer(toAddress, tokenAmount).encodeABI();
        const transaction = {
            from: fromAddress,
            to: contractAddress,
            data: data,
            gas: 100000,
            gasPrice: gasPrice,
            nonce: nonce,
        };
        const signedTx = await this.web3Service
            .getWeb3()
            .eth.accounts.signTransaction(transaction, privateKey);
        const receipt = await this.web3Service
            .getWeb3()
            .eth.sendSignedTransaction(signedTx.rawTransaction);
        return String(receipt.transactionHash);
    }
    async getERC20Decimals(contractAddress) {
        const contract = this.web3Service.getContract(contractAddress, require('../../constants/contracts-apis/ERC20.json'));
        const decimals = await contract.methods.decimals().call();
        return Number(decimals);
    }
    async getERC20Balance(contractAddress, walletAddress, decimals) {
        const contract = this.web3Service.getContract(contractAddress, require('../../constants/contracts-apis/ERC20.json'));
        const balance = await contract.methods.balanceOf(walletAddress).call();
        const tokenDecimals = decimals ?? (await this.getERC20Decimals(contractAddress));
        return this.web3Service.getWeb3().utils.fromWei(balance, tokenDecimals);
    }
    async transferTokens(contractAddress, fromWalletId, toAddress, amount, waitForConfirmation = false, confirmations = 1, timeout = 60000) {
        try {
            const wallet = await this.prismaService.wallet.findUnique({
                where: { id: fromWalletId },
            });
            if (!wallet) {
                throw new Error(`Wallet with ID ${fromWalletId} not found`);
            }
            if (!this.web3Service.isValidAddress(toAddress)) {
                throw new Error('Invalid recipient address');
            }
            if (!this.web3Service.isValidAddress(contractAddress)) {
                throw new Error('Invalid contract address');
            }
            const decimals = await this.getERC20Decimals(contractAddress);
            const balance = await this.getERC20Balance(contractAddress, wallet.address, decimals);
            if (parseFloat(balance) < parseFloat(amount)) {
                throw new Error(`Insufficient token balance. Available: ${balance}, Required: ${amount}`);
            }
            const txHash = await this.sendERC20Transaction(contractAddress, wallet.address, toAddress, wallet.privateKey, amount, decimals);
            console.log(`Transaction sent: ${txHash} from ${wallet.address} to ${toAddress} amount: ${amount}`);
            if (waitForConfirmation) {
                const confirmation = await this.web3Service.waitForTransactionConfirmation(txHash, confirmations, timeout);
                if (confirmation.confirmed) {
                    console.log(`✅ Transaction confirmed in block ${confirmation.blockNumber}`);
                }
                else {
                    console.log(`⏳ Transaction pending confirmation`);
                }
                return {
                    txHash,
                    success: true,
                    confirmed: confirmation.confirmed,
                    blockNumber: confirmation.blockNumber,
                };
            }
            return { txHash, success: true };
        }
        catch (error) {
            console.error('Token transfer failed:', error);
            return { txHash: '', success: false };
        }
    }
    async bulkTransferTokens(contractAddress, fromWalletId, transfers) {
        const results = [];
        let successCount = 0;
        let failedCount = 0;
        const decimals = await this.getERC20Decimals(contractAddress);
        for (const transfer of transfers) {
            try {
                const result = await this.transferTokens(contractAddress, fromWalletId, transfer.toAddress, transfer.amount);
                results.push({
                    toAddress: transfer.toAddress,
                    txHash: result.txHash,
                    success: result.success,
                });
                if (result.success) {
                    successCount++;
                }
                else {
                    failedCount++;
                }
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            catch (error) {
                console.error(`Bulk transfer failed for ${transfer.toAddress}:`, error);
                results.push({
                    toAddress: transfer.toAddress,
                    txHash: '',
                    success: false,
                });
                failedCount++;
            }
        }
        return { success: successCount, failed: failedCount, results };
    }
    async getTokenBalance(contractAddress, walletId) {
        const wallet = await this.prismaService.wallet.findUnique({
            where: { id: walletId },
        });
        if (!wallet) {
            throw new Error(`Wallet with ID ${walletId} not found`);
        }
        const decimals = await this.getERC20Decimals(contractAddress);
        return await this.getERC20Balance(contractAddress, wallet.address, decimals);
    }
    async getTransactionStatus(txHash) {
        try {
            const receipt = await this.web3Service
                .getWeb3()
                .eth.getTransactionReceipt(txHash);
            if (!receipt) {
                return { status: 'PENDING' };
            }
            return {
                status: receipt.status ? 'CONFIRMED' : 'FAILED',
                blockNumber: Number(receipt.blockNumber),
            };
        }
        catch (error) {
            console.error('Error getting transaction status:', error);
            return { status: 'UNKNOWN' };
        }
    }
    async getWalletsWithBalances(contractAddress, decimals) {
        const wallets = await this.prismaService.wallet.findMany();
        const walletsWithBalances = [];
        for (const wallet of wallets) {
            try {
                const balance = await this.getERC20Balance(contractAddress, wallet.address, decimals);
                walletsWithBalances.push({
                    id: wallet.id,
                    address: wallet.address,
                    balance,
                });
            }
            catch (error) {
                console.error(`Error getting balance for wallet ${wallet.address}:`, error);
                walletsWithBalances.push({
                    id: wallet.id,
                    address: wallet.address,
                    balance: '0',
                });
            }
        }
        return walletsWithBalances;
    }
    async getTokenAllowance(contractAddress, ownerAddress, spenderAddress, decimals) {
        const contract = this.web3Service.getContract(contractAddress, require('../../constants/contracts-apis/ERC20.json'));
        const allowance = await contract.methods
            .allowance(ownerAddress, spenderAddress)
            .call();
        const tokenDecimals = decimals ?? (await this.getERC20Decimals(contractAddress));
        const allowanceInTokens = (parseFloat(allowance) / Math.pow(10, tokenDecimals)).toString();
        return allowanceInTokens;
    }
    async approveTokens(contractAddress, walletId, spenderAddress, amount) {
        try {
            const wallet = await this.prismaService.wallet.findUnique({
                where: { id: walletId },
            });
            if (!wallet) {
                throw new Error(`Wallet with ID ${walletId} not found`);
            }
            const currentAllowance = await this.getTokenAllowance(contractAddress, wallet.address, spenderAddress);
            console.log(`Current allowance: ${currentAllowance} tokens`);
            console.log(`Required amount: ${amount} tokens`);
            if (parseFloat(currentAllowance) >= parseFloat(amount)) {
                console.log('✅ Sufficient allowance already exists');
                return {
                    txHash: '',
                    success: true,
                    currentAllowance,
                    approvedAmount: '0',
                };
            }
            const additionalAmount = parseFloat(amount) - parseFloat(currentAllowance);
            console.log(`Additional amount needed: ${additionalAmount} tokens`);
            const tokenContract = this.web3Service.getContract(contractAddress, require('../../constants/contracts-apis/ERC20.json'));
            const decimals = await this.getERC20Decimals(contractAddress);
            const amountWei = (parseFloat(amount) * Math.pow(10, decimals)).toString();
            const approveData = tokenContract.methods
                .approve(spenderAddress, amountWei)
                .encodeABI();
            const gasPrice = await this.web3Service.getGasPrice();
            const estimatedGas = await this.web3Service.estimateGas(wallet.address, contractAddress, '0', approveData);
            const gasLimit = Math.ceil(estimatedGas * 1.3);
            const gasPriceWei = this.web3Service
                .getWeb3()
                .utils.toWei(gasPrice, 'gwei');
            const nonce = await this.web3Service
                .getWeb3()
                .eth.getTransactionCount(wallet.address, 'pending');
            const transaction = {
                from: wallet.address,
                to: contractAddress,
                data: approveData,
                gas: gasLimit,
                gasPrice: gasPriceWei,
                nonce: nonce,
            };
            const signedTx = await this.web3Service
                .getWeb3()
                .eth.accounts.signTransaction(transaction, wallet.privateKey);
            const receipt = await this.web3Service
                .getWeb3()
                .eth.sendSignedTransaction(signedTx.rawTransaction);
            console.log(`Token approval sent: ${String(receipt.transactionHash)}`);
            console.log(`Approved total amount: ${amount} tokens`);
            console.log('⏳ Waiting for approval confirmation...');
            const confirmation = await this.web3Service.waitForTransactionConfirmation(String(receipt.transactionHash), 1, 60000);
            if (confirmation.confirmed) {
                console.log(`✅ Approval confirmed in block ${confirmation.blockNumber}`);
            }
            else {
                console.log(`⏳ Approval still pending confirmation`);
            }
            return {
                txHash: String(receipt.transactionHash),
                success: true,
                currentAllowance,
                approvedAmount: additionalAmount.toString(),
            };
        }
        catch (error) {
            console.error('Token approval failed:', error);
            return {
                txHash: '',
                success: false,
            };
        }
    }
    async checkAndApproveTokens(contractAddress, walletId, spenderAddress, amount) {
        try {
            const wallet = await this.prismaService.wallet.findUnique({
                where: { id: walletId },
            });
            if (!wallet) {
                throw new Error(`Wallet with ID ${walletId} not found`);
            }
            const currentAllowance = await this.getTokenAllowance(contractAddress, wallet.address, spenderAddress);
            console.log(`Current allowance: ${currentAllowance} tokens`);
            console.log(`Required amount: ${amount} tokens`);
            if (parseFloat(currentAllowance) >= parseFloat(amount)) {
                console.log('✅ Sufficient allowance already exists');
                return {
                    approvalNeeded: false,
                    success: true,
                };
            }
            console.log('⚠️  Insufficient allowance, approving tokens...');
            const approvalResult = await this.approveTokens(contractAddress, walletId, spenderAddress, amount);
            return {
                approvalNeeded: true,
                approvalTxHash: approvalResult.txHash,
                success: approvalResult.success,
            };
        }
        catch (error) {
            console.error('Error checking/approving tokens:', error);
            return {
                approvalNeeded: false,
                success: false,
            };
        }
    }
};
exports.TokenTransferService = TokenTransferService;
exports.TokenTransferService = TokenTransferService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [web3_service_1.Web3Service,
        prisma_service_1.PrismaService])
], TokenTransferService);
//# sourceMappingURL=token-transfer.service.js.map