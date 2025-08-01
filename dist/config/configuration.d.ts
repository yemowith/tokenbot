declare const _default: () => {
    port: number;
    database: {
        url: string;
    };
    web3: {
        rpcUrl: string | undefined;
        mainWallet: {
            privateKey: string;
        };
        tokens: {
            busd: string;
            usdt: string;
            usdc: string;
            wbnb: string;
            wbtc: string;
        };
        swap: {
            uniswapV3Router: string;
            uniswapV3Quoter: string;
        };
        botTokens: {
            opusd: string;
        };
    };
};
export default _default;
