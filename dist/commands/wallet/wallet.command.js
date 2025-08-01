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
exports.WalletCommand = void 0;
const nest_commander_1 = require("nest-commander");
const prisma_service_1 = require("../../clients/prisma/prisma.service");
const common_1 = require("@nestjs/common");
const bip39 = require("bip39");
const HDWallet = require('ethereum-hdwallet');
let WalletCommand = class WalletCommand extends nest_commander_1.CommandRunner {
    prisma;
    constructor(prisma) {
        super();
        this.prisma = prisma;
    }
    async generateMnemonic() {
        return bip39.generateMnemonic();
    }
    async generateWallet() {
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
    async createWallets(count, chunkSize = 100) {
        const wallets = [];
        for (let i = 0; i < count; i++) {
            const wallet = await this.generateWallet();
            wallets.push(wallet);
            if (wallets.length >= chunkSize || i === count - 1) {
                await this.prisma.wallet.createMany({
                    data: wallets,
                });
                console.log(`Created ${wallets.length} wallets (${i + 1}/${count})`);
                wallets.length = 0;
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }
    async run() {
        try {
            console.log('Starting wallet creation...');
            await this.createWallets(10000);
            console.log('Wallet creation completed successfully');
        }
        catch (error) {
            console.error('Error during wallet creation:', error);
            throw error;
        }
    }
};
exports.WalletCommand = WalletCommand;
exports.WalletCommand = WalletCommand = __decorate([
    (0, common_1.Injectable)(),
    (0, nest_commander_1.Command)({
        name: 'wallet:create',
        description: 'Create a bulk wallet',
    }),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WalletCommand);
//# sourceMappingURL=wallet.command.js.map