import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

@Injectable()
export class Web3Service {
  private web3: Web3;

  constructor(private readonly configService: ConfigService) {
    // Initialize with default provider (you can configure this via environment variables)
    this.web3 = new Web3(
      this.configService.get('web3.rpcUrl') || 'http://localhost:8545',
    );
  }

  /**
   * Get Web3 instance
   */
  getWeb3(): Web3 {
    return this.web3;
  }

  /**
   * Connect to a specific network
   */
  connectToNetwork(rpcUrl: string): void {
    this.web3 = new Web3(rpcUrl);
  }

  /**
   * Get contract instance
   */
  getContract(contractAddress: string, abi: AbiItem[]): any {
    return new this.web3.eth.Contract(abi, contractAddress);
  }

  /**
   * Send transaction
   */
  async sendTransaction(
    fromAddress: string,
    toAddress: string,
    privateKey: string,
    value: string,
    gasLimit: number = 21000,
  ): Promise<string> {
    const nonce = await this.web3.eth.getTransactionCount(
      fromAddress,
      'pending',
    );
    const gasPrice = await this.web3.eth.getGasPrice();

    const transaction = {
      from: fromAddress,
      to: toAddress,
      value: this.web3.utils.toWei(value, 'ether'),
      gas: gasLimit,
      gasPrice: gasPrice,
      nonce: nonce,
    };

    const signedTx = await this.web3.eth.accounts.signTransaction(
      transaction,
      privateKey,
    );
    const receipt = await this.web3.eth.sendSignedTransaction(
      signedTx.rawTransaction,
    );

    return String(receipt.transactionHash);
  }

  /**
   * Get account balance
   */
  async getBalance(address: string): Promise<string> {
    const balance = await this.web3.eth.getBalance(address);
    return this.web3.utils.fromWei(balance, 'ether');
  }

  /**
   * Create account from private key
   */
  createAccountFromPrivateKey(privateKey: string): string {
    return this.web3.eth.accounts.privateKeyToAccount(privateKey).address;
  }

  /**
   * Validate address
   */
  isValidAddress(address: string): boolean {
    return this.web3.utils.isAddress(address);
  }

  /**
   * Calculate gas price in Gwei
   */
  async getGasPrice(): Promise<string> {
    const gasPrice = await this.web3.eth.getGasPrice();
    return this.web3.utils.fromWei(gasPrice, 'gwei');
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(
    fromAddress: string,
    toAddress: string,
    value: string = '0',
    data: string = '0x',
  ): Promise<number> {
    const gasEstimate = await this.web3.eth.estimateGas({
      from: fromAddress,
      to: toAddress,
      value: this.web3.utils.toWei(value, 'ether'),
      data: data,
    });
    return Number(gasEstimate);
  }

  /**
   * Calculate transaction fee
   */
  async calculateTransactionFee(
    fromAddress: string,
    toAddress: string,
    value: string = '0',
    data: string = '0x',
    gasPrice?: string,
  ): Promise<{
    gasLimit: number;
    gasPrice: string;
    gasPriceGwei: string;
    totalFee: string;
    totalFeeGwei: string;
  }> {
    // Get gas price if not provided
    const currentGasPrice = gasPrice
      ? this.web3.utils.toWei(gasPrice, 'gwei')
      : await this.web3.eth.getGasPrice();

    // Estimate gas limit
    const estimatedGas = await this.estimateGas(
      fromAddress,
      toAddress,
      value,
      data,
    );

    // Calculate total fee
    const totalFeeWei = BigInt(currentGasPrice) * BigInt(estimatedGas);
    const totalFeeEth = this.web3.utils.fromWei(
      totalFeeWei.toString(),
      'ether',
    );
    const totalFeeGwei = this.web3.utils.fromWei(
      totalFeeWei.toString(),
      'gwei',
    );

    return {
      gasLimit: estimatedGas,
      gasPrice: this.web3.utils.fromWei(currentGasPrice, 'gwei'),
      gasPriceGwei: this.web3.utils.fromWei(currentGasPrice, 'gwei'),
      totalFee: totalFeeEth,
      totalFeeGwei: totalFeeGwei,
    };
  }

  /**
   * Calculate ERC20 transaction fee
   */
  async calculateERC20TransactionFee(
    contractAddress: string,
    fromAddress: string,
    toAddress: string,
    amount: string,
    decimals: number = 18,
    gasPrice?: string,
  ): Promise<{
    gasLimit: number;
    gasPrice: string;
    gasPriceGwei: string;
    totalFee: string;
    totalFeeGwei: string;
  }> {
    // Create contract instance
    const contract = new this.web3.eth.Contract(
      require('../constants/contracts-apis/ERC20.json'),
      contractAddress,
    );

    // Calculate amount with decimals
    const multiplier = Math.pow(10, decimals);
    const tokenAmount = (parseFloat(amount) * multiplier).toString();

    // Encode transfer function data
    const data = contract.methods.transfer(toAddress, tokenAmount).encodeABI();

    // Calculate fee
    return await this.calculateTransactionFee(
      fromAddress,
      contractAddress,
      '0', // ERC20 transfers don't send ETH
      data,
      gasPrice,
    );
  }

  /**
   * Check if address has sufficient balance for transaction
   */
  async hasSufficientBalance(
    address: string,
    amount: string,
    fee: string,
  ): Promise<{
    sufficient: boolean;
    balance: string;
    required: string;
    deficit: string;
  }> {
    const balance = await this.getBalance(address);
    const totalRequired = parseFloat(amount) + parseFloat(fee);
    const deficit = totalRequired - parseFloat(balance);

    return {
      sufficient: parseFloat(balance) >= totalRequired,
      balance,
      required: totalRequired.toString(),
      deficit: deficit > 0 ? deficit.toString() : '0',
    };
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransactionConfirmation(
    txHash: string,
    confirmations: number = 1,
    timeout: number = 60000, // 60 seconds default timeout
  ): Promise<{ confirmed: boolean; blockNumber?: number; receipt?: any }> {
    const startTime = Date.now();
    let i = 0;
    while (Date.now() - startTime < timeout) {
      try {
        const receipt = await this.web3.eth.getTransactionReceipt(txHash);

        if (receipt && receipt.blockNumber) {
          const currentBlock = await this.web3.eth.getBlockNumber();
          const confirmationsCount =
            Number(currentBlock) - Number(receipt.blockNumber) + 1;

          if (confirmationsCount >= confirmations) {
            return {
              confirmed: true,
              blockNumber: Number(receipt.blockNumber),
              receipt,
            };
          }

          console.log(
            `Waiting for transaction confirmation... ${confirmationsCount}:confirmations / ${i}:iterations`,
          );

          i++;
        }

        // Wait 1.5 seconds before checking again
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        console.error('Error checking transaction confirmation:', error);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return { confirmed: false };
  }

  /**
   * Send transaction and wait for confirmation
   */
  async sendTransactionAndWait(
    fromAddress: string,
    toAddress: string,
    privateKey: string,
    value: string,
    gasLimit: number = 21000,
    confirmations: number = 1,
  ): Promise<{ txHash: string; confirmed: boolean; blockNumber?: number }> {
    const txHash = await this.sendTransaction(
      fromAddress,
      toAddress,
      privateKey,
      value,
      gasLimit,
    );

    const confirmation = await this.waitForTransactionConfirmation(
      txHash,
      confirmations,
    );

    return {
      txHash,
      confirmed: confirmation.confirmed,
      blockNumber: confirmation.blockNumber,
    };
  }
}
