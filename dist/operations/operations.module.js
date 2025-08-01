"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationsModule = void 0;
const common_1 = require("@nestjs/common");
const token_transfer_module_1 = require("./token-transfer/token-transfer.module");
const swap_module_1 = require("./swap/swap.module");
const bot_module_1 = require("./bot/bot.module");
let OperationsModule = class OperationsModule {
};
exports.OperationsModule = OperationsModule;
exports.OperationsModule = OperationsModule = __decorate([
    (0, common_1.Module)({
        imports: [token_transfer_module_1.TokenTransferModule, swap_module_1.SwapModule, bot_module_1.BotModule],
        exports: [token_transfer_module_1.TokenTransferModule],
        providers: [],
    })
], OperationsModule);
//# sourceMappingURL=operations.module.js.map