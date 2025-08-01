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
exports.BasicOperationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../../clients/prisma/prisma.service");
const web3_service_1 = require("../../../clients/web3/web3.service");
const swap_service_1 = require("../../swap/swap.service");
const token_transfer_service_1 = require("../../token-transfer/token-transfer.service");
let BasicOperationService = class BasicOperationService {
    web3Service;
    prisma;
    tokenTransferService;
    configService;
    swapService;
    amountRange = {
        min: 10.5,
        max: 1000.5,
    };
    feeAmount = '0.001';
    botToken = '';
    botTokenName = 'OPUSD';
    tokensToSwap = ['busd', 'usdt', 'usdc', 'wbtc'];
    operations = [
        'no-operation',
        'transfer',
        'swap',
        'stake',
        'no-operation',
    ];
    constructor(web3Service, prisma, tokenTransferService, configService, swapService) {
        this.web3Service = web3Service;
        this.prisma = prisma;
        this.tokenTransferService = tokenTransferService;
        this.configService = configService;
        this.swapService = swapService;
        this.botToken = this.configService.get('web3.botTokens.opusd') || '';
    }
    async getMainWallet() {
        const wallet = await this.prisma.wallet.findFirst({
            where: { isMain: true },
        });
        if (!wallet) {
            throw new Error('Wallet not found');
        }
        return wallet;
    }
    async getRandomWallet() {
        const availableWalletsCount = await this.prisma.wallet.count({
            where: { isMain: false, isUsed: false },
        });
        if (availableWalletsCount === 0) {
            throw new Error('No available wallets found');
        }
        const randomOffset = Math.floor(Math.random() * availableWalletsCount);
        const wallet = await this.prisma.wallet.findFirst({
            where: { isMain: false, isUsed: false },
            skip: randomOffset,
        });
        if (!wallet) {
            throw new Error('Wallet not found');
        }
        return wallet;
    }
    async markWalletAsUsed(walletId) {
        await this.prisma.wallet.update({
            where: { id: walletId },
            data: { isUsed: true },
        });
    }
    async resetWalletUsage(walletId) {
        await this.prisma.wallet.update({
            where: { id: walletId },
            data: { isUsed: false },
        });
    }
    async resetAllWalletUsage() {
        await this.prisma.wallet.updateMany({
            where: { isMain: false },
            data: { isUsed: false },
        });
    }
    async getWalletStats() {
        const [total, used, available, main] = await Promise.all([
            this.prisma.wallet.count(),
            this.prisma.wallet.count({ where: { isUsed: true } }),
            this.prisma.wallet.count({ where: { isUsed: false, isMain: false } }),
            this.prisma.wallet.count({ where: { isMain: true } }),
        ]);
        return { total, used, available, main };
    }
    async getRandomAmount() {
        return Math.floor(Math.random() * (this.amountRange.max - this.amountRange.min + 1) +
            this.amountRange.min);
    }
    async balabceMainWallet() {
        const wallet = await this.getMainWallet();
        const balance = await this.tokenTransferService.getTokenBalance(this.botToken, wallet.id);
        return balance;
    }
    async sendFee(wallet) {
        console.log('Sending fee to wallet', wallet.address);
        try {
            const feeWallet = await this.getMainWallet();
            const txHash = await this.web3Service.sendTransaction(feeWallet.address, wallet.address, feeWallet.privateKey, this.feeAmount);
            if (!txHash) {
                throw new Error('Fee transfer failed');
            }
            const receipt = await this.web3Service.waitForTransactionConfirmation(txHash, 5, 10000);
            console.log('Fee sent to wallet', wallet.address);
        }
        catch (error) {
            console.log('Fee transfer failed', error);
            throw error;
        }
    }
    async sendFeeToMainWallet(wallet) {
        console.log('Sending fee to main wallet', wallet.address);
        try {
            const feeWallet = await this.getMainWallet();
            const balance = await this.web3Service.getBalance(wallet.address);
            const feeCalculation = await this.web3Service.calculateTransactionFee(wallet.address, feeWallet.address, balance);
            const amountToSend = parseFloat(balance) - parseFloat(feeCalculation.totalFee);
            if (amountToSend <= 0) {
                console.log('Insufficient balance to cover gas costs');
                return;
            }
            const balanceCheck = await this.web3Service.hasSufficientBalance(wallet.address, amountToSend.toString(), feeCalculation.totalFee);
            if (!balanceCheck.sufficient) {
                console.log(`Insufficient balance: ${balanceCheck.balance} ETH, required: ${balanceCheck.required} ETH`);
                return;
            }
            const txHash = await this.web3Service.sendTransaction(wallet.address, feeWallet.address, wallet.privateKey, amountToSend.toString());
            if (!txHash) {
                throw new Error('Fee transfer failed');
            }
            const receipt = await this.web3Service.waitForTransactionConfirmation(txHash, 2, 10000);
            console.log('Fee sent to main wallet successfully');
        }
        catch (error) {
            console.log('Fee transfer failed', error);
            throw error;
        }
    }
    async getRandomOperation() {
        const randomIndex = Math.floor(Math.random() * this.operations.length);
        return this.operations[randomIndex];
    }
    async getRandomTokenToSwap() {
        const randomIndex = Math.floor(Math.random() * this.tokensToSwap.length);
        return this.tokensToSwap[randomIndex];
    }
    async getPriceQuote(tokenIn, tokenInName, tokenOut, tokenOutName, amountIn) {
        console.log('1. Testing price quote...');
        try {
            const quote = await this.swapService.getTokenPriceQuote(tokenIn, tokenOut, amountIn, 3000);
            console.log(`✅ Price quote successful: ${quote.amountOut} ${tokenOutName} for ${amountIn} ${tokenInName}`);
            return quote;
        }
        catch (error) {
            console.log(`❌ Price quote failed: ${error.message}`);
            throw error;
        }
    }
    async swapTokens(wallet, amount) {
        console.log('Swapping tokens', wallet.address);
        const tokenIn = this.botToken;
        const tokenInName = this.botTokenName;
        const tokenOut = await this.getRandomTokenToSwap();
        const tokenOutName = tokenOut.toUpperCase();
        const amountIn = amount.toString();
        const quote = await this.getPriceQuote(tokenIn, tokenInName, tokenOut, tokenOutName, amountIn);
        try {
            await this.swapService.swapTokens(wallet.id, tokenIn, tokenOut, amountIn, quote.amountOut);
        }
        catch (error) {
            console.log(`❌ Swap failed: ${error.message}`);
        }
    }
    async stakeTokens(wallet, amount) {
        console.log('Staking tokens', wallet.address);
    }
    async afterSendToken(wallet, amount) {
        const operation = await this.getRandomOperation();
        if (operation === 'no-operation') {
            return;
        }
        await this.sendFee(wallet);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        switch (operation) {
            case 'stake':
                await this.stakeTokens(wallet, amount);
                break;
            case 'swap':
                await this.swapTokens(wallet, amount);
        }
        await this.sendFeeToMainWallet(wallet);
    }
    async runBot() {
        const wallet = await this.getMainWallet();
        const randomWallet = await this.getRandomWallet();
        const amount = await this.getRandomAmount();
        const balance = await this.balabceMainWallet();
        if (parseFloat(balance) < amount) {
            console.log('Not enough balance');
            return;
        }
        try {
            const transfer = await this.tokenTransferService.transferTokens(this.botToken, wallet.id, randomWallet.address, amount.toString(), true, 2, 10000);
            if (!transfer.success) {
                throw new Error('Transfer failed');
            }
            await this.prisma.action.create({
                data: {
                    action: 'transfer',
                    walletId: randomWallet.id,
                    amount: amount.toString(),
                },
            });
            await this.resetWalletUsage(randomWallet.id);
        }
        catch (error) {
            console.log(error);
        }
    }
};
exports.BasicOperationService = BasicOperationService;
exports.BasicOperationService = BasicOperationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [web3_service_1.Web3Service,
        prisma_service_1.PrismaService,
        token_transfer_service_1.TokenTransferService,
        config_1.ConfigService,
        swap_service_1.SwapService])
], BasicOperationService);
//# sourceMappingURL=basic-operation.service.js.map