"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3Module = void 0;
const common_1 = require("@nestjs/common");
const web3_service_1 = require("./web3.service");
let Web3Module = class Web3Module {
};
exports.Web3Module = Web3Module;
exports.Web3Module = Web3Module = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [web3_service_1.Web3Service],
        exports: [web3_service_1.Web3Service],
    })
], Web3Module);
//# sourceMappingURL=web3.module.js.map