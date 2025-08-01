import { CommandRunner } from 'nest-commander';
import { PrismaService } from '../../clients/prisma/prisma.service';
export declare class WalletCommand extends CommandRunner {
    private readonly prisma;
    constructor(prisma: PrismaService);
    generateMnemonic(): Promise<string>;
    generateWallet(): Promise<{
        address: string;
        mnemonic: string;
        privateKey: string;
    }>;
    createWallets(count: number, chunkSize?: number): Promise<void>;
    run(): Promise<void>;
}
