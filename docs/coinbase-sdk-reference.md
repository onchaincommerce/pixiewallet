# Coinbase Developer Platform SDK Reference

This reference document provides common usage patterns and code snippets for the Coinbase Developer Platform (CDP) SDK.

## Initialization

```javascript
import { CoinbaseWalletSDK } from '@coinbase/wallet-sdk';

// Initialize the CDP client
const sdk = new CoinbaseWalletSDK({
  appName: 'Super Wallet',
  appLogoUrl: 'https://example.com/logo.png',
  apiKey: 'YOUR_API_KEY'
});

// Connect to the client
const client = await sdk.connect();
```

## EOA (Externally Owned Account) Operations

### Creating an EOA Account

```javascript
// Create a new EOA account
const newAccount = await client.createAccount({
  name: 'My Primary Account',
  chainId: 'eip155:1' // Ethereum Mainnet
});

console.log('New account created:', newAccount.id);
```

### Getting EOA Account Details

```javascript
// Retrieve account details by ID
const accountDetails = await client.getAccount(accountId);

console.log('Account address:', accountDetails.address);
console.log('Account chain:', accountDetails.chainId);
console.log('Account balance:', accountDetails.balance);
```

### Listing EOA Accounts

```javascript
// List all EOA accounts
const accounts = await client.listAccounts();

accounts.forEach(account => {
  console.log(`Account ID: ${account.id}, Address: ${account.address}`);
});
```

## Smart Wallet Operations

### Creating a Smart Wallet

```javascript
// First, you need an EOA account to be the owner
const ownerAccount = await client.getAccount(ownerAccountId);

// Create a smart wallet with the EOA as the owner
const smartWallet = await client.createSmartWallet({
  name: 'My Smart Wallet',
  chainId: 'eip155:1', // Ethereum Mainnet
  owner: ownerAccount.id
});

console.log('Smart Wallet created:', smartWallet.id);
console.log('Owner account:', smartWallet.ownerAccountId);

// Note: Smart wallet creation is a multi-step process
// The wallet starts in a "pending" state and needs to be deployed
```

### Deploying a Smart Wallet

```javascript
// Check deployment status
const walletDetails = await client.getSmartWallet(smartWalletId);

if (walletDetails.status === 'pending') {
  // Deploy the wallet
  const deploymentTx = await client.deploySmartWallet(smartWalletId);
  
  // Monitor the deployment transaction
  const deploymentStatus = await client.getTransaction(deploymentTx.id);
  console.log('Deployment status:', deploymentStatus.status);
}
```

### Listing Smart Wallets

```javascript
// List all smart wallets
const smartWallets = await client.listSmartWallets();

smartWallets.forEach(wallet => {
  console.log(`Smart Wallet ID: ${wallet.id}`);
  console.log(`Status: ${wallet.status}`);
  console.log(`Owner Account: ${wallet.ownerAccountId}`);
});
```

## Transaction Operations

### Signing and Sending Transactions (EOA)

```javascript
// Create a transaction
const transaction = {
  from: accountId,
  to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  value: '0.01', // ETH
  chainId: 'eip155:1' // Ethereum Mainnet
};

// Sign and send transaction
const txResponse = await client.signAndSendTransaction(transaction);

console.log('Transaction ID:', txResponse.id);
console.log('Transaction hash:', txResponse.hash);
```

### Smart Wallet Transactions

```javascript
// Send transaction from smart wallet
const transaction = {
  from: smartWalletId,
  to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  value: '0.01', // ETH
  chainId: 'eip155:1' // Ethereum Mainnet
};

// Execute transaction
const txResponse = await client.executeTransaction(transaction);

console.log('Transaction ID:', txResponse.id);
console.log('Transaction hash:', txResponse.hash);
```

### Batch Transactions (Smart Wallet Only)

```javascript
// Create multiple transactions to be executed in a single batch
const transactions = [
  {
    to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    value: '0.01', // ETH
    data: '0x' // No calldata
  },
  {
    to: '0x1234567890123456789012345678901234567890',
    value: '0',
    data: '0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e0000000000000000000000000000000000000000000000000de0b6b3a7640000' // ERC-20 transfer
  }
];

// Execute batch transaction
const batchTxResponse = await client.executeBatchTransaction({
  from: smartWalletId,
  transactions,
  chainId: 'eip155:1'
});

console.log('Batch transaction ID:', batchTxResponse.id);
```

## React Component Example for Smart Wallet Creation

```jsx
import React, { useState, useEffect } from 'react';
import { CoinbaseWalletSDK } from '@coinbase/wallet-sdk';

function SmartWalletCreator() {
  const [sdk, setSdk] = useState(null);
  const [client, setClient] = useState(null);
  const [ownerAccount, setOwnerAccount] = useState(null);
  const [smartWallet, setSmartWallet] = useState(null);
  const [deploymentStep, setDeploymentStep] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);

  // Initialize SDK
  useEffect(() => {
    const initSDK = async () => {
      const sdkInstance = new CoinbaseWalletSDK({
        appName: 'Super Wallet',
        apiKey: process.env.COINBASE_API_KEY
      });
      
      setSdk(sdkInstance);
      
      try {
        const clientInstance = await sdkInstance.connect();
        setClient(clientInstance);
        
        // Get the first account as owner
        const accounts = await clientInstance.listAccounts();
        if (accounts.length > 0) {
          setOwnerAccount(accounts[0]);
        }
      } catch (error) {
        console.error('Failed to connect:', error);
      }
    };
    
    initSDK();
  }, []);

  const createSmartWallet = async () => {
    if (!client || !ownerAccount) return;
    
    try {
      setDeploymentStep(1);
      
      // Create the smart wallet
      const newWallet = await client.createSmartWallet({
        name: 'My Smart Wallet',
        chainId: 'eip155:1',
        owner: ownerAccount.id
      });
      
      setSmartWallet(newWallet);
      setDeploymentStep(2);
      
      // Deploy the wallet
      setIsDeploying(true);
      const deployTx = await client.deploySmartWallet(newWallet.id);
      
      // Poll for deployment status
      const checkDeployment = async () => {
        const txStatus = await client.getTransaction(deployTx.id);
        
        if (txStatus.status === 'confirmed') {
          setDeploymentStep(3);
          setIsDeploying(false);
          
          // Refresh wallet details
          const updatedWallet = await client.getSmartWallet(newWallet.id);
          setSmartWallet(updatedWallet);
        } else if (txStatus.status === 'failed') {
          setIsDeploying(false);
          console.error('Deployment failed');
        } else {
          setTimeout(checkDeployment, 3000); // Poll every 3 seconds
        }
      };
      
      checkDeployment();
    } catch (error) {
      console.error('Failed to create smart wallet:', error);
      setIsDeploying(false);
    }
  };

  return (
    <div>
      <h2>Smart Wallet Creator</h2>
      
      {!ownerAccount ? (
        <p>Loading owner account...</p>
      ) : (
        <div>
          <p>Owner Account: {ownerAccount.address}</p>
          
          {!smartWallet ? (
            <button onClick={createSmartWallet} disabled={isDeploying}>
              Create Smart Wallet
            </button>
          ) : (
            <div>
              <h3>Smart Wallet Created</h3>
              <p>ID: {smartWallet.id}</p>
              <p>Status: {smartWallet.status}</p>
              <p>Owner: {smartWallet.ownerAccountId}</p>
              
              <div className="deployment-progress">
                <div className={`step ${deploymentStep >= 1 ? 'complete' : ''}`}>
                  Create Wallet
                </div>
                <div className={`step ${deploymentStep >= 2 ? 'complete' : ''}`}>
                  Initialize Deployment
                </div>
                <div className={`step ${deploymentStep >= 3 ? 'complete' : ''}`}>
                  {deploymentStep === 3 ? 'Deployed!' : 'Deploying...'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SmartWalletCreator;
```

## Important Notes

### Security
- Keep API keys secure and never expose them in client-side code.
- For production applications, use server-side authentication flows.
- Follow security best practices for handling private keys and sensitive data.

### Recovery Options
- Smart wallets offer recovery options not available with standard EOA accounts.
- Consider implementing social recovery or multi-sig configurations for critical wallets.

### Transaction Fees
- Smart wallet operations (especially deployment) require gas fees.
- Ensure accounts have sufficient funds for operations.

### Network Support
- The CDP SDK supports multiple networks, including:
  - Ethereum Mainnet (`eip155:1`)
  - Ethereum Goerli Testnet (`eip155:5`)
  - Base Mainnet (`eip155:8453`)
  - Base Goerli Testnet (`eip155:84531`)

### Contract Verification
- For security, verify the smart wallet contract addresses used by the SDK.
- Smart wallet contracts follow the ERC-4337 account abstraction standard.

## Error Handling

```javascript
try {
  const smartWallet = await client.createSmartWallet({
    name: 'My Smart Wallet',
    chainId: 'eip155:1',
    owner: ownerAccountId
  });
} catch (error) {
  // Check for specific error types
  if (error.code === 'insufficient_funds') {
    console.error('Not enough funds to deploy the smart wallet');
  } else if (error.code === 'user_rejected') {
    console.error('User rejected the operation');
  } else {
    console.error('Operation failed:', error.message);
  }
}
``` 