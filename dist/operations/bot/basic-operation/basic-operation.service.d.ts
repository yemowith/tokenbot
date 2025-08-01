import { ConfigService } from '@nestjs/config';
import { Wallet } from '@prisma/client';
import { PrismaService } from 'src/clients/prisma/prisma.service';
import { Web3Service } from 'src/clients/web3/web3.service';
import { SwapService } from 'src/operations/swap/swap.service';
import { TokenTransferService } from 'src/operations/token-transfer/token-transfer.service';
export declare class BasicOperationService {
    private readonly web3Service;
    private readonly prisma;
    private readonly tokenTransferService;
    private readonly configService;
    private readonly swapService;
    private amountRange;
    private feeAmount;
    private botToken;
    private botTokenName;
    private tokensToSwap;
    private operations;
    constructor(web3Service: Web3Service, prisma: PrismaService, tokenTransferService: TokenTransferService, configService: ConfigService, swapService: SwapService);
    getMainWallet(): Promise<Wallet>;
    getRandomWallet(): Promise<Wallet>;
    markWalletAsUsed(walletId: string): Promise<void>;
    resetWalletUsage(walletId: string): Promise<void>;
    resetAllWalletUsage(): Promise<void>;
    getWalletStats(): Promise<{
        total: number;
        used: number;
        available: number;
        main: number;
    }>;
    getRandomAmount(): Promise<number>;
    balabceMainWallet(): Promise<string>;
    sendFee(wallet: Wallet): Promise<void>;
    sendFeeToMainWallet(wallet: Wallet): Promise<void>;
    getRandomOperation(): Promise<string>;
    getRandomTokenToSwap(): Promise<string>;
    getPriceQuote(tokenIn: string, tokenInName: string, tokenOut: string, tokenOutName: string, amountIn: string): Promise<{
        amountOut: string;
        priceImpact: string;
        fee: number;
    }>;
    swapTokens(wallet: Wallet, amount: number): Promise<void>;
    stakeTokens(wallet: Wallet, amount: number): Promise<void>;
    afterSendToken(wallet: Wallet, amount: number): Promise<void>;
    runBot(): Promise<void>;
}
