import { Web3Service } from '../../clients/web3/web3.service';
import { PrismaService } from '../../clients/prisma/prisma.service';
export declare class TokenTransferService {
    private readonly web3Service;
    private readonly prismaService;
    constructor(web3Service: Web3Service, prismaService: PrismaService);
    sendERC20Transaction(contractAddress: string, fromAddress: string, toAddress: string, privateKey: string, amount: string, decimals?: number): Promise<string>;
    getERC20Decimals(contractAddress: string): Promise<number>;
    getERC20Balance(contractAddress: string, walletAddress: string, decimals?: number): Promise<string>;
    transferTokens(contractAddress: string, fromWalletId: string, toAddress: string, amount: string, waitForConfirmation?: boolean, confirmations?: number, timeout?: number): Promise<{
        txHash: string;
        success: boolean;
        confirmed?: boolean;
        blockNumber?: number;
    }>;
    bulkTransferTokens(contractAddress: string, fromWalletId: string, transfers: Array<{
        toAddress: string;
        amount: string;
    }>): Promise<{
        success: number;
        failed: number;
        results: Array<{
            toAddress: string;
            txHash: string;
            success: boolean;
        }>;
    }>;
    getTokenBalance(contractAddress: string, walletId: string): Promise<string>;
    getTransactionStatus(txHash: string): Promise<{
        status: string;
        blockNumber?: number;
    }>;
    getWalletsWithBalances(contractAddress: string, decimals?: number): Promise<Array<{
        id: string;
        address: string;
        balance: string;
    }>>;
    getTokenAllowance(contractAddress: string, ownerAddress: string, spenderAddress: string, decimals?: number): Promise<string>;
    approveTokens(contractAddress: string, walletId: string, spenderAddress: string, amount: string): Promise<{
        txHash: string;
        success: boolean;
        currentAllowance?: string;
        approvedAmount?: string;
    }>;
    checkAndApproveTokens(contractAddress: string, walletId: string, spenderAddress: string, amount: string): Promise<{
        approvalNeeded: boolean;
        approvalTxHash?: string;
        success: boolean;
    }>;
}
