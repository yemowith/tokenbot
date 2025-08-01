import { Command, CommandRunner } from 'nest-commander';
import { PrismaService } from '../../clients/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import * as bip39 from 'bip39';

const HDWallet = require('ethereum-hdwallet');

@Injectable()
@Command({
  name: 'wallet:create',
  description: 'Create a bulk wallet',
})
export class WalletCommand extends CommandRunner {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async generateMnemonic(): Promise<string> {
    return bip39.generateMnemonic();
  }

  async generateWallet(): Promise<{
    address: string;
    mnemonic: string;
    privateKey: string;
  }> {
    const drive = "m/44'/60'/0'/0/0";
    const mnemonic = await this.generateMnemonic();
    const hdWallet = HDWallet.fromMnemonic(mnemonic);
    const address = `0x${hdWallet.derive(drive).getAddress().toString('hex')}`;
    const privateKey = hdWallet.derive(drive).getPrivateKey().toString('hex');

    return {
      address,
      mnemonic,
      privateKey,
    };
  }

  async createWallets(count: number, chunkSize: number = 100): Promise<void> {
    const wallets: Array<{
      address: string;
      mnemonic: string;
      privateKey: string;
    }> = [];

    for (let i = 0; i < count; i++) {
      const wallet = await this.generateWallet();
      wallets.push(wallet);

      // Insert in chunks
      if (wallets.length >= chunkSize || i === count - 1) {
        await this.prisma.wallet.createMany({
          data: wallets,
        });
        console.log(`Created ${wallets.length} wallets (${i + 1}/${count})`);
        wallets.length = 0; // Clear array for next chunk
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  async run(): Promise<void> {
    try {
      console.log('Starting wallet creation...');

      await this.createWallets(10000);

      console.log('Wallet creation completed successfully');
    } catch (error) {
      console.error('Error during wallet creation:', error);
      throw error;
    }
  }
}
