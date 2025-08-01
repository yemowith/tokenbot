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
exports.BasicOperationCommand = void 0;
const nest_commander_1 = require("nest-commander");
const common_1 = require("@nestjs/common");
const basic_operation_service_1 = require("../../operations/bot/basic-operation/basic-operation.service");
let BasicOperationCommand = class BasicOperationCommand extends nest_commander_1.CommandRunner {
    basicOperationService;
    constructor(basicOperationService) {
        super();
        this.basicOperationService = basicOperationService;
    }
    async run() {
        try {
            console.log('=== Testing Basic Operation Service ===');
            console.log('\n1. Getting wallet stats...');
            const stats = await this.basicOperationService.getWalletStats();
            console.log(`📊 Wallet Stats:`);
            console.log(`   Total: ${stats.total}`);
            console.log(`   Used: ${stats.used}`);
            console.log(`   Available: ${stats.available}`);
            console.log(`   Main: ${stats.main}`);
            console.log('\n2. Getting main wallet...');
            try {
                const mainWallet = await this.basicOperationService.getMainWallet();
                console.log(`✅ Main wallet: ${mainWallet.address}`);
            }
            catch (error) {
                console.log(`❌ Main wallet not found: ${error.message}`);
            }
            console.log('\n3. Getting random wallet...');
            try {
                const randomWallet = await this.basicOperationService.getRandomWallet();
                console.log(`✅ Random wallet: ${randomWallet.address}`);
                console.log(`   Used: ${randomWallet.isUsed}`);
                console.log(`   Main: ${randomWallet.isMain}`);
            }
            catch (error) {
                console.log(`❌ Random wallet not found: ${error.message}`);
            }
            console.log('\n4. Getting multiple random wallets...');
            try {
                const multipleWallets = await this.basicOperationService.getMultipleRandomWallets(3);
                console.log(`✅ Found ${multipleWallets.length} random wallets:`);
                multipleWallets.forEach((wallet, index) => {
                    console.log(`   ${index + 1}. ${wallet.address} (Used: ${wallet.isUsed})`);
                });
            }
            catch (error) {
                console.log(`❌ Multiple wallets not found: ${error.message}`);
            }
            console.log('\n5. Getting random amounts...');
            for (let i = 0; i < 5; i++) {
                const amount = await this.basicOperationService.getRandomAmount();
                console.log(`   Random amount ${i + 1}: ${amount}`);
            }
            console.log('\n=== Basic Operation Test Completed ===');
        }
        catch (error) {
            console.error('Error during basic operation test:', error);
            throw error;
        }
    }
};
exports.BasicOperationCommand = BasicOperationCommand;
exports.BasicOperationCommand = BasicOperationCommand = __decorate([
    (0, common_1.Injectable)(),
    (0, nest_commander_1.Command)({
        name: 'basic-operation',
        description: 'Test basic operation service methods',
    }),
    __metadata("design:paramtypes", [basic_operation_service_1.BasicOperationService])
], BasicOperationCommand);
//# sourceMappingURL=basic-operation.command.js.map