import { CommandRunner } from 'nest-commander';
import { PrismaService } from '../../clients/prisma/prisma.service';
import { Web3Service } from 'src/clients/web3/web3.service';
import { ConfigService } from '@nestjs/config';
import { TokenTransferService } from 'src/operations/token-transfer/token-transfer.service';
import { SwapService } from 'src/operations/swap/swap.service';
import { Wallet } from '@prisma/client';
import { BasicOperationService } from 'src/operations/bot/basic-operation/basic-operation.service';
export declare class TestCommand extends CommandRunner {
    private readonly prisma;
    private readonly web3Service;
    private readonly configService;
    private readonly tokenTransferService;
    private readonly swapService;
    private readonly basicOperationService;
    constructor(prisma: PrismaService, web3Service: Web3Service, configService: ConfigService, tokenTransferService: TokenTransferService, swapService: SwapService, basicOperationService: BasicOperationService);
    getMainWallet(): Promise<Wallet>;
    getWallet(number: number): Promise<Wallet>;
    testTokenTransfer(): Promise<void>;
    getPriceQuote(tokenIn: string, tokenInName: string, tokenOut: string, tokenOutName: string, amountIn: string): Promise<{
        amountOut: string;
        priceImpact: string;
        fee: number;
    }>;
    getSwapFeeEstimate(wallet: Wallet, tokenIn: string, tokenOut: string, amountIn: string): Promise<void>;
    approveTokens(wallet: Wallet, tokenIn: string, amountIn: string): Promise<void>;
    test(): Promise<void>;
    run(): Promise<void>;
}
