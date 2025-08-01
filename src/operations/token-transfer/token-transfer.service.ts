import { Injectable } from '@nestjs/common';
import { Web3Service } from '../../clients/web3/web3.service';
import { PrismaService } from '../../clients/prisma/prisma.service';

@Injectable()
export class TokenTransferService {
  constructor(
    private readonly web3Service: Web3Service,
    private readonly prismaService: PrismaService,
  ) {}

  /**
   * Send ERC20 token transaction
   */
  async sendERC20Transaction(
    contractAddress: string,
    fromAddress: string,
    toAddress: string,
    privateKey: string,
    amount: string,
    decimals?: number,
  ): Promise<string> {
    const contract = this.web3Service.getContract(
      contractAddress,
      require('../../constants/contracts-apis/ERC20.json'),
    );

    const nonce = await this.web3Service
      .getWeb3()
      .eth.getTransactionCount(fromAddress, 'pending');
    const gasPrice = await this.web3Service.getWeb3().eth.getGasPrice();

    // Get decimals from contract if not provided
    const tokenDecimals =
      decimals ?? (await this.getERC20Decimals(contractAddress));

    // Calculate amount with decimals using string manipulation
    const multiplier = Math.pow(10, tokenDecimals);
    const tokenAmount = (parseFloat(amount) * multiplier).toString();

    const data = contract.methods.transfer(toAddress, tokenAmount).encodeABI();

    const transaction = {
      from: fromAddress,
      to: contractAddress,
      data: data,
      gas: 100000, // Estimate gas for ERC20 transfer
      gasPrice: gasPrice,
      nonce: nonce,
    };

    const signedTx = await this.web3Service
      .getWeb3()
      .eth.accounts.signTransaction(transaction, privateKey);
    const receipt = await this.web3Service
      .getWeb3()
      .eth.sendSignedTransaction(signedTx.rawTransaction);

    return String(receipt.transactionHash);
  }

  /**
   * Get ERC20 token decimals from contract
   */
  async getERC20Decimals(contractAddress: string): Promise<number> {
    const contract = this.web3Service.getContract(
      contractAddress,
      require('../../constants/contracts-apis/ERC20.json'),
    );
    const decimals = await contract.methods.decimals().call();
    return Number(decimals);
  }

  /**
   * Get ERC20 token balance
   */
  async getERC20Balance(
    contractAddress: string,
    walletAddress: string,
    decimals?: number,
  ): Promise<string> {
    const contract = this.web3Service.getContract(
      contractAddress,
      require('../../constants/contracts-apis/ERC20.json'),
    );
    const balance = await contract.methods.balanceOf(walletAddress).call();

    // Get decimals from contract if not provided
    const tokenDecimals =
      decimals ?? (await this.getERC20Decimals(contractAddress));

    return this.web3Service.getWeb3().utils.fromWei(balance, tokenDecimals);
  }

  /**
   * Transfer ERC20 tokens from one wallet to another
   */
  async transferTokens(
    contractAddress: string,
    fromWalletId: string,
    toAddress: string,
    amount: string,
    waitForConfirmation: boolean = false,
    confirmations: number = 1,
    timeout: number = 60000,
  ): Promise<{
    txHash: string;
    success: boolean;
    confirmed?: boolean;
    blockNumber?: number;
  }> {
    try {
      // Get wallet from database
      const wallet = await this.prismaService.wallet.findUnique({
        where: { id: fromWalletId },
      });

      if (!wallet) {
        throw new Error(`Wallet with ID ${fromWalletId} not found`);
      }

      // Validate addresses
      if (!this.web3Service.isValidAddress(toAddress)) {
        throw new Error('Invalid recipient address');
      }

      if (!this.web3Service.isValidAddress(contractAddress)) {
        throw new Error('Invalid contract address');
      }

      const decimals = await this.getERC20Decimals(contractAddress);

      // Check token balance before transfer
      const balance = await this.getERC20Balance(
        contractAddress,
        wallet.address,
        decimals,
      );

      if (parseFloat(balance) < parseFloat(amount)) {
        throw new Error(
          `Insufficient token balance. Available: ${balance}, Required: ${amount}`,
        );
      }

      // Send ERC20 transaction
      const txHash = await this.sendERC20Transaction(
        contractAddress,
        wallet.address,
        toAddress,
        wallet.privateKey,
        amount,
        decimals,
      );

      // Log transaction to console
      console.log(
        `Transaction sent: ${txHash} from ${wallet.address} to ${toAddress} amount: ${amount}`,
      );

      // Wait for confirmation if requested
      if (waitForConfirmation) {
        const confirmation = await this.web3Service.waitForTransactionConfirmation(
          txHash,
          confirmations,
          timeout,
        );

        if (confirmation.confirmed) {
          console.log(
            `✅ Transaction confirmed in block ${confirmation.blockNumber}`,
          );
        } else {
          console.log(`⏳ Transaction pending confirmation`);
        }

        return {
          txHash,
          success: true,
          confirmed: confirmation.confirmed,
          blockNumber: confirmation.blockNumber,
        };
      }

      return { txHash, success: true };
    } catch (error) {
      console.error('Token transfer failed:', error);
      return { txHash: '', success: false };
    }
  }

  /**
   * Bulk transfer ERC20 tokens to multiple addresses
   */
  async bulkTransferTokens(
    contractAddress: string,
    fromWalletId: string,
    transfers: Array<{ toAddress: string; amount: string }>,
  ): Promise<{
    success: number;
    failed: number;
    results: Array<{ toAddress: string; txHash: string; success: boolean }>;
  }> {
    const results: Array<{
      toAddress: string;
      txHash: string;
      success: boolean;
    }> = [];
    let successCount = 0;
    let failedCount = 0;

    const decimals = await this.getERC20Decimals(contractAddress);

    for (const transfer of transfers) {
      try {
        const result = await this.transferTokens(
          contractAddress,
          fromWalletId,
          transfer.toAddress,
          transfer.amount,
        );

        results.push({
          toAddress: transfer.toAddress,
          txHash: result.txHash,
          success: result.success,
        });

        if (result.success) {
          successCount++;
        } else {
          failedCount++;
        }

        // Add delay between transactions to avoid nonce issues
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Bulk transfer failed for ${transfer.toAddress}:`, error);
        results.push({
          toAddress: transfer.toAddress,
          txHash: '',
          success: false,
        });
        failedCount++;
      }
    }

    return { success: successCount, failed: failedCount, results };
  }

  /**
   * Get token balance for a wallet
   */
  async getTokenBalance(
    contractAddress: string,
    walletId: string,
  ): Promise<string> {
    const wallet = await this.prismaService.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new Error(`Wallet with ID ${walletId} not found`);
    }

    const decimals = await this.getERC20Decimals(contractAddress);

    return await this.getERC20Balance(
      contractAddress,
      wallet.address,
      decimals,
    );
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(
    txHash: string,
  ): Promise<{ status: string; blockNumber?: number }> {
    try {
      const receipt = await this.web3Service
        .getWeb3()
        .eth.getTransactionReceipt(txHash);

      if (!receipt) {
        return { status: 'PENDING' };
      }

      return {
        status: receipt.status ? 'CONFIRMED' : 'FAILED',
        blockNumber: Number(receipt.blockNumber),
      };
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return { status: 'UNKNOWN' };
    }
  }

  /**
   * Get all wallets with their token balances
   */
  async getWalletsWithBalances(
    contractAddress: string,
    decimals?: number,
  ): Promise<Array<{ id: string; address: string; balance: string }>> {
    const wallets = await this.prismaService.wallet.findMany();
    const walletsWithBalances: Array<{
      id: string;
      address: string;
      balance: string;
    }> = [];

    for (const wallet of wallets) {
      try {
        const balance = await this.getERC20Balance(
          contractAddress,
          wallet.address,
          decimals,
        );

        walletsWithBalances.push({
          id: wallet.id,
          address: wallet.address,
          balance,
        });
      } catch (error) {
        console.error(
          `Error getting balance for wallet ${wallet.address}:`,
          error,
        );
        walletsWithBalances.push({
          id: wallet.id,
          address: wallet.address,
          balance: '0',
        });
      }
    }

    return walletsWithBalances;
  }

  /**
   * Get token allowance for a spender
   */
  async getTokenAllowance(
    contractAddress: string,
    ownerAddress: string,
    spenderAddress: string,
    decimals?: number,
  ): Promise<string> {
    const contract = this.web3Service.getContract(
      contractAddress,
      require('../../constants/contracts-apis/ERC20.json'),
    );

    const allowance = await contract.methods
      .allowance(ownerAddress, spenderAddress)
      .call();

    // Get decimals from contract if not provided
    const tokenDecimals =
      decimals ?? (await this.getERC20Decimals(contractAddress));

    // Convert from wei to token units
    const allowanceInTokens = (
      parseFloat(allowance) / Math.pow(10, tokenDecimals)
    ).toString();

    return allowanceInTokens;
  }

  /**
   * Approve tokens for a spender
   */
  async approveTokens(
    contractAddress: string,
    walletId: string,
    spenderAddress: string,
    amount: string,
  ): Promise<{
    txHash: string;
    success: boolean;
    currentAllowance?: string;
    approvedAmount?: string;
  }> {
    try {
      const wallet = await this.prismaService.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new Error(`Wallet with ID ${walletId} not found`);
      }

      // Get current allowance
      const currentAllowance = await this.getTokenAllowance(
        contractAddress,
        wallet.address,
        spenderAddress,
      );

      console.log(`Current allowance: ${currentAllowance} tokens`);
      console.log(`Required amount: ${amount} tokens`);

      // Check if approval is needed
      if (parseFloat(currentAllowance) >= parseFloat(amount)) {
        console.log('✅ Sufficient allowance already exists');
        return {
          txHash: '',
          success: true,
          currentAllowance,
          approvedAmount: '0',
        };
      }

      // Calculate additional amount needed
      const additionalAmount =
        parseFloat(amount) - parseFloat(currentAllowance);
      console.log(`Additional amount needed: ${additionalAmount} tokens`);

      const tokenContract = this.web3Service.getContract(
        contractAddress,
        require('../../constants/contracts-apis/ERC20.json'),
      );

      // Get token decimals
      const decimals = await this.getERC20Decimals(contractAddress);
      const amountWei = (
        parseFloat(amount) * Math.pow(10, decimals)
      ).toString();

      // Encode approve function
      const approveData = tokenContract.methods
        .approve(spenderAddress, amountWei)
        .encodeABI();

      // Get gas price and estimate gas
      const gasPrice = await this.web3Service.getGasPrice();
      const estimatedGas = await this.web3Service.estimateGas(
        wallet.address,
        contractAddress,
        '0',
        approveData,
      );

      // Apply safety margin
      const gasLimit = Math.ceil(estimatedGas * 1.3);
      const gasPriceWei = this.web3Service
        .getWeb3()
        .utils.toWei(gasPrice, 'gwei');

      // Get nonce
      const nonce = await this.web3Service
        .getWeb3()
        .eth.getTransactionCount(wallet.address, 'pending');

      // Create transaction
      const transaction = {
        from: wallet.address,
        to: contractAddress,
        data: approveData,
        gas: gasLimit,
        gasPrice: gasPriceWei,
        nonce: nonce,
      };

      // Sign and send transaction
      const signedTx = await this.web3Service
        .getWeb3()
        .eth.accounts.signTransaction(transaction, wallet.privateKey);
      const receipt = await this.web3Service
        .getWeb3()
        .eth.sendSignedTransaction(signedTx.rawTransaction);

      console.log(`Token approval sent: ${String(receipt.transactionHash)}`);
      console.log(`Approved total amount: ${amount} tokens`);

      // Wait for transaction confirmation
      console.log('⏳ Waiting for approval confirmation...');
      const confirmation = await this.web3Service.waitForTransactionConfirmation(
        String(receipt.transactionHash),
        1, // 1 confirmation
        60000, // 60 seconds timeout
      );

      if (confirmation.confirmed) {
        console.log(
          `✅ Approval confirmed in block ${confirmation.blockNumber}`,
        );
      } else {
        console.log(`⏳ Approval still pending confirmation`);
      }

      return {
        txHash: String(receipt.transactionHash),
        success: true,
        currentAllowance,
        approvedAmount: additionalAmount.toString(),
      };
    } catch (error) {
      console.error('Token approval failed:', error);
      return {
        txHash: '',
        success: false,
      };
    }
  }

  /**
   * Check if approval is needed and approve if necessary
   */
  async checkAndApproveTokens(
    contractAddress: string,
    walletId: string,
    spenderAddress: string,
    amount: string,
  ): Promise<{
    approvalNeeded: boolean;
    approvalTxHash?: string;
    success: boolean;
  }> {
    try {
      const wallet = await this.prismaService.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new Error(`Wallet with ID ${walletId} not found`);
      }

      // Get current allowance
      const currentAllowance = await this.getTokenAllowance(
        contractAddress,
        wallet.address,
        spenderAddress,
      );

      console.log(`Current allowance: ${currentAllowance} tokens`);
      console.log(`Required amount: ${amount} tokens`);

      if (parseFloat(currentAllowance) >= parseFloat(amount)) {
        console.log('✅ Sufficient allowance already exists');
        return {
          approvalNeeded: false,
          success: true,
        };
      }

      console.log('⚠️  Insufficient allowance, approving tokens...');

      // Approve tokens
      const approvalResult = await this.approveTokens(
        contractAddress,
        walletId,
        spenderAddress,
        amount,
      );

      return {
        approvalNeeded: true,
        approvalTxHash: approvalResult.txHash,
        success: approvalResult.success,
      };
    } catch (error) {
      console.error('Error checking/approving tokens:', error);
      return {
        approvalNeeded: false,
        success: false,
      };
    }
  }
}
