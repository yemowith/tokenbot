"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const configuration_1 = require("../config/configuration");
const prisma_module_1 = require("../clients/prisma/prisma.module");
const wallet_command_1 = require("./wallet/wallet.command");
const test_command_1 = require("./test/test.command");
const web3_module_1 = require("../clients/web3/web3.module");
const operations_module_1 = require("../operations/operations.module");
const swap_service_1 = require("../operations/swap/swap.service");
const basic_operation_service_1 = require("../operations/bot/basic-operation/basic-operation.service");
let CommandsModule = class CommandsModule {
};
exports.CommandsModule = CommandsModule;
exports.CommandsModule = CommandsModule = __decorate([
    (0, common_1.Module)({
        providers: [wallet_command_1.WalletCommand, test_command_1.TestCommand, swap_service_1.SwapService, basic_operation_service_1.BasicOperationService],
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, load: [configuration_1.default] }),
            prisma_module_1.PrismaModule,
            web3_module_1.Web3Module,
            operations_module_1.OperationsModule,
        ],
    })
], CommandsModule);
//# sourceMappingURL=commands.module.js.map