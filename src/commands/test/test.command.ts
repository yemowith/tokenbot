import { Command, CommandRunner } from 'nest-commander';
import { PrismaService } from '../../clients/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import * as bip39 from 'bip39';
import { Web3Service } from 'src/clients/web3/web3.service';
import { ConfigService } from '@nestjs/config';
import { TokenTransferService } from 'src/operations/token-transfer/token-transfer.service';
import { SwapService } from 'src/operations/swap/swap.service';
import { Wallet } from '@prisma/client';
import { BasicOperationService } from 'src/operations/bot/basic-operation/basic-operation.service';

const HDWallet = require('ethereum-hdwallet');

@Injectable()
@Command({
  name: 'test',
  description: 'Test command',
})
export class TestCommand extends CommandRunner {
  constructor(
    private readonly prisma: PrismaService,
    private readonly web3Service: Web3Service,
    private readonly configService: ConfigService,
    private readonly tokenTransferService: TokenTransferService,
    private readonly swapService: SwapService,
    private readonly basicOperationService: BasicOperationService,
  ) {
    super();
  }

  async getMainWallet(): Promise<Wallet> {
    const wallet = await this.prisma.wallet.findFirst({
      where: { isMain: true },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    return wallet;
  }

  async getWallet(number: number): Promise<Wallet> {
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

  async testTokenTransfer(): Promise<void> {
    const wallet = await this.getMainWallet();
    const wallet2 = await this.getWallet(1);

    console.log('=== Testing Token Transfer ===');
    const transferResult = await this.tokenTransferService.transferTokens(
      this.configService.get('web3.tokens.busd') || '',
      wallet?.id || '',
      wallet2.address,
      '1',
      true,
      3,
      60000,
    );
    console.log(`Transfer result: ${JSON.stringify(transferResult)}`);
  }

  async getPriceQuote(
    tokenIn: string,
    tokenInName: string,
    tokenOut: string,
    tokenOutName: string,
    amountIn: string,
  ): Promise<{
    amountOut: string;
    priceImpact: string;
    fee: number;
  }> {
    console.log('1. Testing price quote...');
    try {
      const quote = await this.swapService.getTokenPriceQuote(
        tokenIn, // BUSD
        tokenOut, // wbnb
        amountIn, // amount in
        3000, // 0.3% fee
      );
      console.log(
        `✅ Price quote successful: ${quote.amountOut} ${tokenOutName} for ${amountIn} ${tokenInName}`,
      );
      return quote;
    } catch (error) {
      console.log(`❌ Price quote failed: ${error.message}`);
      throw error;
    }
  }

  async getSwapFeeEstimate(
    wallet: Wallet,
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
  ): Promise<void> {
    console.log('2. Testing swap fee estimate...');
    try {
      const feeEstimate = await this.swapService.getSwapFeeEstimate(
        wallet.id,
        tokenIn,
        tokenOut,
        amountIn,
      );

      console.log(`✅ Swap fee estimate successful:`);
      console.log(`   Gas Limit: ${feeEstimate.gasLimit}`);
      console.log(`   Gas Price: ${feeEstimate.gasPrice} Gwei`);
      console.log(`   Estimated Fee: ${feeEstimate.estimatedFee} ETH`);
    } catch (error) {
      console.log(`❌ Swap fee estimate failed: ${error.message}`);
    }
  }

  async approveTokens(
    wallet: Wallet,
    tokenIn: string,
    amountIn: string,
  ): Promise<void> {
    console.log('3. Testing token approval...');
    try {
      // Get router address for approval
      const routerAddress = this.configService.get('web3.swap.uniswapV3Router');

      const approvalResult = await this.tokenTransferService.approveTokens(
        tokenIn,
        wallet.id,
        routerAddress,
        amountIn,
      );

      if (approvalResult.success) {
        console.log(`✅ Token approval successful`);
        if (approvalResult.txHash) {
          console.log(`   Transaction: ${approvalResult.txHash}`);
          console.log(
            `   Current allowance: ${approvalResult.currentAllowance} tokens`,
          );
          console.log(
            `   Additional approved: ${approvalResult.approvedAmount} tokens`,
          );
        }
      } else {
        console.log(`❌ Token approval failed`);
        throw new Error('Token approval failed');
      }
    } catch (error) {
      console.log(`❌ Token approval failed: ${error.message}`);
    }
  }

  async test(): Promise<void> {
    const balance = await this.basicOperationService.runBot();
    return;

    /*
    const wallet2 = await this.getWallet(1);

    console.log('\n=== Testing Swap Functions ===');

    const tokenIn = this.configService.get('web3.tokens.busd') || '';
    const tokenInName = 'BUSD';
    const tokenOut = this.configService.get('web3.tokens.wbnb') || '';
    const tokenOutName = 'WBNB';
    const amountIn = '150';

    // Validate token addresses
    if (!tokenIn || !tokenOut) {
      console.log('⚠️  Token addresses not configured, using mock data');
      console.log(`TokenIn: ${tokenIn}`);
      console.log(`TokenOut: ${tokenOut}`);
    }

    await this.swapService.setWallet(wallet.id);

    // Test 1: Get price quote
    const quote = await this.getPriceQuote(
      tokenIn,
      tokenInName,
      tokenOut,
      tokenOutName,
      amountIn,
    );

    try {
      await this.swapService.swapTokens(
        wallet.id,
        tokenIn,
        tokenOut,
        amountIn,
        quote.amountOut,
      );
    } catch (error) {
      console.log(`❌ Swap failed: ${error.message}`);
    }
    */
  }

  async run(): Promise<void> {
    try {
      console.log('Starting Test...');

      await this.test();

      console.log('Test completed successfully');
    } catch (error) {
      console.error('Error during test:', error);
      throw error;
    }
  }
}
