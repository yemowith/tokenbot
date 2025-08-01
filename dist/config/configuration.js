"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    database: {
        url: process.env.DATABASE_URL || '',
    },
    web3: {
        rpcUrl: process.env.MODE === 'development'
            ? process.env.RPC_URL_DEV
            : process.env.RPC_URL_PROD,
        mainWallet: {
            privateKey: process.env.MAIN_WALLET_PRIVATE_KEY || '',
        },
        tokens: {
            busd: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
            usdt: '0x55d398326f99059ff775485246999027b3197955',
            usdc: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
            wbnb: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
            wbtc: '0x0555E30da8f98308EdB960aa94C0Db47230d2B9c',
        },
        swap: {
            uniswapV3Router: '0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2',
            uniswapV3Quoter: '0x78D78E420Da98ad378D7799bE8f4AF69033EB077',
        },
        botTokens: {
            opusd: '0xEBfc9435A2A0fD7D562D2ea4B0F931AF7DfdC73C',
        },
    },
});
//# sourceMappingURL=configuration.js.map