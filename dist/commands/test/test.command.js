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
exports.TestCommand = void 0;
const nest_commander_1 = require("nest-commander");
const prisma_service_1 = require("../../clients/prisma/prisma.service");
const common_1 = require("@nestjs/common");
const web3_service_1 = require("../../clients/web3/web3.service");
const config_1 = require("@nestjs/config");
const token_transfer_service_1 = require("../../operations/token-transfer/token-transfer.service");
const swap_service_1 = require("../../operations/swap/swap.service");
const basic_operation_service_1 = require("../../operations/bot/basic-operation/basic-operation.service");
const HDWallet = require('ethereum-hdwallet');
let TestCommand = class TestCommand extends nest_commander_1.CommandRunner {
    prisma;
    web3Service;
    configService;
    tokenTransferService;
    swapService;
    basicOperationService;
    constructor(prisma, web3Service, configService, tokenTransferService, swapService, basicOperationService) {
        super();
        this.prisma = prisma;
        this.web3Service = web3Service;
        this.configService = configService;
        this.tokenTransferService = tokenTransferService;
        this.swapService = swapService;
        this.basicOperationService = basicOperationService;
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
    async getWallet(number) {
        const wallet = await this.prisma.wallet.findFirst({
            skip: number,
            take: 1,
            orderBy: { createdAt: 'asc' },
        });
        if (!wallet) {
            throw new Error('Wallet not found');
        }
        return wallet;
    }
    async testTokenTransfer() {
        const wallet = await this.getMainWallet();
        const wallet2 = await this.getWallet(1);
        console.log('=== Testing Token Transfer ===');
        const transferResult = await this.tokenTransferService.transferTokens(this.configService.get('web3.tokens.busd') || '', wallet?.id || '', wallet2.address, '1', true, 3, 60000);
        console.log(`Transfer result: ${JSON.stringify(transferResult)}`);
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
    async getSwapFeeEstimate(wallet, tokenIn, tokenOut, amountIn) {
        console.log('2. Testing swap fee estimate...');
        try {
            const feeEstimate = await this.swapService.getSwapFeeEstimate(wallet.id, tokenIn, tokenOut, amountIn);
            console.log(`✅ Swap fee estimate successful:`);
            console.log(`   Gas Limit: ${feeEstimate.gasLimit}`);
            console.log(`   Gas Price: ${feeEstimate.gasPrice} Gwei`);
            console.log(`   Estimated Fee: ${feeEstimate.estimatedFee} ETH`);
        }
        catch (error) {
            console.log(`❌ Swap fee estimate failed: ${error.message}`);
        }
    }
    async approveTokens(wallet, tokenIn, amountIn) {
        console.log('3. Testing token approval...');
        try {
            const routerAddress = this.configService.get('web3.swap.uniswapV3Router');
            const approvalResult = await this.tokenTransferService.approveTokens(tokenIn, wallet.id, routerAddress, amountIn);
            if (approvalResult.success) {
                console.log(`✅ Token approval successful`);
                if (approvalResult.txHash) {
                    console.log(`   Transaction: ${approvalResult.txHash}`);
                    console.log(`   Current allowance: ${approvalResult.currentAllowance} tokens`);
                    console.log(`   Additional approved: ${approvalResult.approvedAmount} tokens`);
                }
            }
            else {
                console.log(`❌ Token approval failed`);
                throw new Error('Token approval failed');
            }
        }
        catch (error) {
            console.log(`❌ Token approval failed: ${error.message}`);
        }
    }
    async test() {
        const balance = await this.basicOperationService.runBot();
        return;
    }
    async run() {
        try {
            console.log('Starting Test...');
            await this.test();
            console.log('Test completed successfully');
        }
        catch (error) {
            console.error('Error during test:', error);
            throw error;
        }
    }
};
exports.TestCommand = TestCommand;
exports.TestCommand = TestCommand = __decorate([
    (0, common_1.Injectable)(),
    (0, nest_commander_1.Command)({
        name: 'test',
        description: 'Test command',
    }),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        web3_service_1.Web3Service,
        config_1.ConfigService,
        token_transfer_service_1.TokenTransferService,
        swap_service_1.SwapService,
        basic_operation_service_1.BasicOperationService])
], TestCommand);
//# sourceMappingURL=test.command.js.map