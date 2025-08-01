"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicOperationModule = void 0;
const common_1 = require("@nestjs/common");
const basic_operation_service_1 = require("./basic-operation.service");
const token_transfer_module_1 = require("../../token-transfer/token-transfer.module");
const swap_module_1 = require("../../swap/swap.module");
let BasicOperationModule = class BasicOperationModule {
};
exports.BasicOperationModule = BasicOperationModule;
exports.BasicOperationModule = BasicOperationModule = __decorate([
    (0, common_1.Module)({
        imports: [token_transfer_module_1.TokenTransferModule, swap_module_1.SwapModule],
        providers: [basic_operation_service_1.BasicOperationService],
        exports: [basic_operation_service_1.BasicOperationService],
    })
], BasicOperationModule);
//# sourceMappingURL=basic-operation.module.js.map