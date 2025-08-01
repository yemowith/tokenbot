import { ConfigService } from '@nestjs/config';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
export declare class Web3Service {
    private readonly configService;
    private web3;
    constructor(configService: ConfigService);
    getWeb3(): Web3;
    connectToNetwork(rpcUrl: string): void;
    getContract(contractAddress: string, abi: AbiItem[]): any;
    sendTransaction(fromAddress: string, toAddress: string, privateKey: string, value: string, gasLimit?: number): Promise<string>;
    getBalance(address: string): Promise<string>;
    createAccountFromPrivateKey(privateKey: string): string;
    isValidAddress(address: string): boolean;
    getGasPrice(): Promise<string>;
    estimateGas(fromAddress: string, toAddress: string, value?: string, data?: string): Promise<number>;
    calculateTransactionFee(fromAddress: string, toAddress: string, value?: string, data?: string, gasPrice?: string): Promise<{
        gasLimit: number;
        gasPrice: string;
        gasPriceGwei: string;
        totalFee: string;
        totalFeeGwei: string;
    }>;
    calculateERC20TransactionFee(contractAddress: string, fromAddress: string, toAddress: string, amount: string, decimals?: number, gasPrice?: string): Promise<{
        gasLimit: number;
        gasPrice: string;
        gasPriceGwei: string;
        totalFee: string;
        totalFeeGwei: string;
    }>;
    hasSufficientBalance(address: string, amount: string, fee: string): Promise<{
        sufficient: boolean;
        balance: string;
        required: string;
        deficit: string;
    }>;
    waitForTransactionConfirmation(txHash: string, confirmations?: number, timeout?: number): Promise<{
        confirmed: boolean;
        blockNumber?: number;
        receipt?: any;
    }>;
    sendTransactionAndWait(fromAddress: string, toAddress: string, privateKey: string, value: string, gasLimit?: number, confirmations?: number): Promise<{
        txHash: string;
        confirmed: boolean;
        blockNumber?: number;
    }>;
}
