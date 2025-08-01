import { TokenTransferService } from '../token-transfer/token-transfer.service';
import { Web3Service } from '../../clients/web3/web3.service';
import { PrismaService } from '../../clients/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
export declare class SwapService {
    private readonly tokenTransferService;
    private readonly web3Service;
    private readonly prismaService;
    private readonly configService;
    private wallet;
    constructor(tokenTransferService: TokenTransferService, web3Service: Web3Service, prismaService: PrismaService, configService: ConfigService);
    setWallet(walletId: string): Promise<void>;
    private getUniswapV3Router;
    private getUniswapV3Quoter;
    getTokenPriceQuote(tokenIn: string, tokenOut: string, amountIn: string, fee?: number): Promise<{
        amountOut: string;
        priceImpact: string;
        fee: number;
    }>;
    swapTokens(walletId: string, tokenIn: string, tokenOut: string, amountIn: string, amountOutMin: string, fee?: number, deadline?: number): Promise<{
        txHash: string;
        success: boolean;
        amountIn: string;
        amountOut: string;
    } | void>;
    swapETHForTokens(walletId: string, tokenOut: string, amountOutMin: string, fee?: number, deadline?: number): Promise<{
        txHash: string;
        success: boolean;
        amountIn: string;
        amountOut: string;
    }>;
    swapTokensForETH(walletId: string, tokenIn: string, amountIn: string, amountOutMin: string, fee?: number, deadline?: number): Promise<{
        txHash: string;
        success: boolean;
        amountIn: string;
        amountOut: string;
    }>;
    getSwapFeeEstimate(walletId: string, tokenIn: string, tokenOut: string, amountIn: string, fee?: number): Promise<{
        gasLimit: number;
        gasPrice: string;
        estimatedFee: string;
        estimatedFeeGwei: string;
    }>;
}
