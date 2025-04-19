# Super Wallet: Quick Start Guide

This guide will help you quickly get started with the Super Wallet application.

## Prerequisites

Before you begin, ensure you have:

1. Node.js (v16 or later) installed
2. npm or yarn installed
3. A Coinbase Developer Platform API key
4. Access to an Ethereum network (mainnet or testnet)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/super_wallet.git
cd super_wallet
```

### 2. Install Dependencies

```bash
npm install
# or
yarn
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```
NEXT_PUBLIC_COINBASE_API_KEY=your_api_key_here
```

### 4. Start the Development Server

```bash
npm run dev
# or
yarn dev
```

Navigate to `http://localhost:3000` to use the application.

## Using Super Wallet

### Creating an EOA Account

1. Navigate to the "Create Account" tab
2. Enter a name for your account
3. Select the network (Ethereum Mainnet, Goerli, Base, etc.)
4. Click "Create Account"
5. Your new account will appear in the sidebar

### Creating a Smart Wallet

1. You must have at least one EOA account before creating a smart wallet
2. Navigate to the "Create Smart Wallet" tab
3. Enter a name for your smart wallet
4. Select the network 
5. Choose an owner account from the dropdown
6. Click "Create Smart Wallet"
7. Wait for the deployment process to complete
8. Your smart wallet will appear in the sidebar when ready

### Sending Transactions

1. Select an account from the sidebar
2. Navigate to the "Send Transaction" tab
3. Enter the recipient address
4. Enter the amount to send (in ETH)
5. Click "Send Transaction"
6. Wait for the transaction to be confirmed

## Network Support

Super Wallet supports multiple networks:

- Ethereum Mainnet
- Ethereum Goerli (testnet)
- Base Mainnet
- Base Goerli (testnet)

For testing purposes, we recommend using the Goerli networks.

## Getting Testnet Funds

To test transaction functionality, you'll need testnet funds:

1. For Ethereum Goerli, visit [goerlifaucet.com](https://goerlifaucet.com/)
2. For Base Goerli, visit [faucet.base.org](https://faucet.base.org/)

## Troubleshooting

### Common Issues

1. **"Failed to initialize SDK"**: Check that your API key is correctly set up in the `.env.local` file.

2. **Transaction failures**: Ensure you have sufficient funds in your account for the transaction plus gas fees.

3. **Smart wallet deployment pending**: Smart wallet deployments can take time to confirm on the blockchain. Check the status indicator in the sidebar.

4. **Network connectivity issues**: Make sure you have a stable internet connection.

If you continue to experience issues, check the browser console for more detailed error messages.

## Next Steps

Once you're comfortable with the basics, you can explore more advanced features:

- Batch transactions with smart wallets
- Adding recovery options to your smart wallet
- Customizing gas settings for transactions
- Integrating with other blockchain applications

## Support

For additional support:

- Check the [documentation](./coinbase-sdk-reference.md)
- Review the [implementation guide](./implementation-guide.md)
- Visit the [Coinbase Developer Platform](https://docs.cloud.coinbase.com/cdp/docs) 