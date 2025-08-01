import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Wallet } from '@prisma/client';
import { PrismaService } from 'src/clients/prisma/prisma.service';
import { Web3Service } from 'src/clients/web3/web3.service';
import { SwapService } from 'src/operations/swap/swap.service';
import { TokenTransferService } from 'src/operations/token-transfer/token-transfer.service';

@Injectable()
export class BasicOperationService {
  private amountRange = {
    min: 10.5,
    max: 1000.5,
  };

  private feeAmount = '0.001';

  private botToken = '';
  private botTokenName = 'OPUSD';
  private tokensToSwap = ['busd', 'usdt', 'usdc', 'wbtc'];

  private operations = [
    'no-operation',
    'transfer',
    'swap',
    'stake',
    'no-operation',
  ];

  constructor(
    private readonly web3Service: Web3Service,
    private readonly prisma: PrismaService,
    private readonly tokenTransferService: TokenTransferService,
    private readonly configService: ConfigService,
    private readonly swapService: SwapService,
  ) {
    this.botToken = this.configService.get('web3.botTokens.opusd') || '';
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

  async getRandomWallet(): Promise<Wallet> {
    // Get count of available wallets
    const availableWalletsCount = await this.prisma.wallet.count({
      where: { isMain: false, isUsed: false },
    });

    if (availableWalletsCount === 0) {
      throw new Error('No available wallets found');
    }

    // Get a random offset
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

  async markWalletAsUsed(walletId: string): Promise<void> {
    await this.prisma.wallet.update({
      where: { id: walletId },
      data: { isUsed: true },
    });
  }

  async resetWalletUsage(walletId: string): Promise<void> {
    await this.prisma.wallet.update({
      where: { id: walletId },
      data: { isUsed: false },
    });
  }

  async resetAllWalletUsage(): Promise<void> {
    await this.prisma.wallet.updateMany({
      where: { isMain: false },
      data: { isUsed: false },
    });
  }

  async getWalletStats(): Promise<{
    total: number;
    used: number;
    available: number;
    main: number;
  }> {
    const [total, used, available, main] = await Promise.all([
      this.prisma.wallet.count(),
      this.prisma.wallet.count({ where: { isUsed: true } }),
      this.prisma.wallet.count({ where: { isUsed: false, isMain: false } }),
      this.prisma.wallet.count({ where: { isMain: true } }),
    ]);

    return { total, used, available, main };
  }

  async getRandomAmount(): Promise<number> {
    return Math.floor(
      Math.random() * (this.amountRange.max - this.amountRange.min + 1) +
        this.amountRange.min,
    );
  }

  async balabceMainWallet(): Promise<string> {
    const wallet = await this.getMainWallet();
    const balance = await this.tokenTransferService.getTokenBalance(
      this.botToken,
      wallet.id,
    );
    return balance;
  }

  async sendFee(wallet: Wallet) {
    console.log('Sending fee to wallet', wallet.address);

    try {
      const feeWallet = await this.getMainWallet();
      const txHash = await this.web3Service.sendTransaction(
        feeWallet.address,
        wallet.address,
        feeWallet.privateKey,
        this.feeAmount,
      );

      if (!txHash) {
        throw new Error('Fee transfer failed');
      }

      const receipt = await this.web3Service.waitForTransactionConfirmation(
        txHash,
        5,
        10000,
      );

      console.log('Fee sent to wallet', wallet.address);
    } catch (error) {
      console.log('Fee transfer failed', error);
      throw error;
    }
  }

  async sendFeeToMainWallet(wallet: Wallet) {
    console.log('Sending fee to main wallet', wallet.address);

    try {
      const feeWallet = await this.getMainWallet();
      const balance = await this.web3Service.getBalance(wallet.address);

      // Calculate transaction fee
      const feeCalculation = await this.web3Service.calculateTransactionFee(
        wallet.address,
        feeWallet.address,
        balance,
      );

      // Calculate the amount to send (balance minus gas cost)
      const amountToSend =
        parseFloat(balance) - parseFloat(feeCalculation.totalFee);

      // Only proceed if we have enough balance after gas costs
      if (amountToSend <= 0) {
        console.log('Insufficient balance to cover gas costs');
        return;
      }

      // Double-check if we have sufficient balance for the transaction
      const balanceCheck = await this.web3Service.hasSufficientBalance(
        wallet.address,
        amountToSend.toString(),
        feeCalculation.totalFee,
      );

      if (!balanceCheck.sufficient) {
        console.log(
          `Insufficient balance: ${balanceCheck.balance} ETH, required: ${balanceCheck.required} ETH`,
        );
        return;
      }

      const txHash = await this.web3Service.sendTransaction(
        wallet.address,
        feeWallet.address,
        wallet.privateKey,
        amountToSend.toString(),
      );

      if (!txHash) {
        throw new Error('Fee transfer failed');
      }

      const receipt = await this.web3Service.waitForTransactionConfirmation(
        txHash,
        2,
        10000,
      );

      console.log('Fee sent to main wallet successfully');
    } catch (error) {
      console.log('Fee transfer failed', error);
      throw error;
    }
  }

  async getRandomOperation(): Promise<string> {
    const randomIndex = Math.floor(Math.random() * this.operations.length);
    return this.operations[randomIndex];
  }

  async getRandomTokenToSwap(): Promise<string> {
    const randomIndex = Math.floor(Math.random() * this.tokensToSwap.length);
    return this.tokensToSwap[randomIndex];
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

  async swapTokens(wallet: Wallet, amount: number) {
    console.log('Swapping tokens', wallet.address);

    const tokenIn = this.botToken;
    const tokenInName = this.botTokenName;
    const tokenOut = await this.getRandomTokenToSwap();
    const tokenOutName = tokenOut.toUpperCase();
    const amountIn = amount.toString();

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
  }

  async stakeTokens(wallet: Wallet, amount: number) {
    console.log('Staking tokens', wallet.address);
  }

  async afterSendToken(wallet: Wallet, amount: number) {
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

  async runBot(): Promise<void> {
    const wallet = await this.getMainWallet();
    const randomWallet = await this.getRandomWallet();

    const amount = await this.getRandomAmount();

    const balance = await this.balabceMainWallet();
    if (parseFloat(balance) < amount) {
      console.log('Not enough balance');
      return;
    }

    try {
      const transfer = await this.tokenTransferService.transferTokens(
        this.botToken,
        wallet.id,
        randomWallet.address,
        amount.toString(),
        true,
        2,
        10000,
      );

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
    } catch (error) {
      console.log(error);
    }
  }
}
