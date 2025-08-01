# Token Bot

A sophisticated blockchain automation bot built with NestJS for managing token operations, wallet management, and automated trading strategies.

**Developed by [sayedsoft.com](https://sayedsoft.com) - Ahmad Yaman SAYED**

## 🚀 Features

- **Multi-Wallet Management**: Automated wallet rotation and balance management
- **Token Operations**: Transfer, swap, and stake tokens across different networks
- **Gas Fee Optimization**: Smart gas calculation and fee management
- **Database Integration**: Prisma ORM for persistent data storage
- **Web3 Integration**: Full blockchain interaction capabilities
- **Automated Trading**: Random operation selection for realistic bot behavior

## 🏗️ Architecture

```
token-bot/
├── src/
│   ├── clients/           # External service clients
│   │   ├── prisma/       # Database client
│   │   └── web3/         # Blockchain client
│   ├── commands/          # CLI commands
│   ├── operations/        # Core business logic
│   │   ├── bot/          # Bot operations
│   │   ├── swap/         # Token swapping
│   │   └── token-transfer/ # Token transfers
│   └── config/           # Configuration management
├── prisma/               # Database schema and migrations
└── test/                 # Test files
```

## 🛠️ Tech Stack

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with Prisma ORM
- **Blockchain**: Web3.js for Ethereum/BSC interactions
- **Language**: TypeScript
- **Testing**: Jest

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- Ethereum/BSC RPC endpoint
- Private keys for wallet operations

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd token-bot
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/token_bot"

   # Web3 Configuration
   WEB3_RPC_URL="https://bsc-dataseed.binance.org/"

   # Bot Tokens
   WEB3_BOT_TOKENS_OPUSD="0x..."

   # Wallet Configuration
   MAIN_WALLET_PRIVATE_KEY="your_main_wallet_private_key"
   ```

4. **Database Setup**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate dev

   # Seed initial data (if needed)
   npx prisma db seed
   ```

## 🏃‍♂️ Running the Application

### Development Mode

```bash
npm run start:dev
```

### Production Mode

```bash
npm run build
npm run start:prod
```

### CLI Commands

```bash
# Test command
npm run cli test

# Wallet operations
npm run cli wallet --help
```

## 📊 Database Schema

The application uses the following main entities:

- **Wallet**: Stores wallet addresses, private keys, and usage status
- **Action**: Tracks all bot operations and their results
- **Transaction**: Records blockchain transactions

## 🤖 Bot Operations

The bot supports various automated operations:

### 1. Token Transfer

- Transfer tokens between wallets
- Automatic gas fee calculation
- Transaction confirmation waiting

### 2. Token Swapping

- Swap tokens using Uniswap V3
- Price quote calculation
- Slippage protection

### 3. Wallet Management

- Random wallet selection
- Balance monitoring
- Fee distribution

### 4. Automated Strategies

- Random operation selection
- Realistic bot behavior simulation
- Multi-step operations

## 🔧 Configuration

### Web3 Configuration

```typescript
// src/config/configuration.ts
export default () => ({
  web3: {
    rpcUrl: process.env.WEB3_RPC_URL,
    botTokens: {
      opusd: process.env.WEB3_BOT_TOKENS_OPUSD,
    },
  },
});
```

### Bot Parameters

```typescript
// Amount ranges for operations
private amountRange = {
  min: 10.5,
  max: 1000.5,
};

// Supported tokens for swapping
private tokensToSwap = ['busd', 'usdt', 'usdc', 'wbtc'];
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 API Endpoints

The application provides REST API endpoints for:

- Wallet management
- Bot operation control
- Transaction monitoring
- Balance checking

## 🔒 Security Considerations

- **Private Key Management**: Store private keys securely
- **Environment Variables**: Never commit sensitive data
- **Network Security**: Use secure RPC endpoints
- **Gas Limits**: Set appropriate gas limits for transactions

## 🚨 Important Notes

1. **Gas Fees**: The bot automatically calculates and reserves gas fees
2. **Wallet Rotation**: Wallets are marked as used to prevent reuse
3. **Error Handling**: Comprehensive error handling for blockchain operations
4. **Transaction Confirmation**: Waits for transaction confirmations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the test files for usage examples

## 🔄 Updates

Stay updated with the latest changes:

- Monitor the repository for updates
- Check the changelog
- Review breaking changes in releases

---

**⚠️ Disclaimer**: This bot is for educational and development purposes. Use at your own risk and ensure compliance with local regulations.
