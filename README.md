# Pixie Wallet

A magical Ethereum wallet powered by Coinbase CDP SDK, designed with a pixel art theme for an enchanting Web3 experience.

![Pixie Wallet](./public/images/pixie-wallet-banner.png)

## 🧙‍♂️ Features

- **EOA & Smart Contract Wallets**: Create and manage both standard EOA wallets and advanced smart contract wallets
- **Cross-Chain Support**: Built on Base Sepolia testnet, easily adaptable to other EVM chains
- **Pixel Art UI**: Delightful retro pixel-art themed interface with magical animations
- **Mobile-Optimized**: PWA support for installation on mobile devices
- **Secure Authentication**: Email magic link authentication with Supabase
- **Testnet Faucet**: Built-in faucet integration for testnet ETH

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Coinbase CDP API credentials
- Supabase project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/onchaincommerce/pixiewallet.git
   cd pixiewallet
   ```

2. Install the dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables by creating a `.env` file based on `.env.example`:
   ```
   # Coinbase CDP SDK Environment Variables
   CDP_API_KEY_ID=your_cdp_key_id
   CDP_API_KEY_SECRET=your_cdp_key_secret
   CDP_WALLET_SECRET=your_cdp_wallet_secret
   CDP_API_URL=https://api.cdp.coinbase.com
   NEXT_PUBLIC_CDP_NETWORK_ID=base-sepolia

   # Supabase Credentials
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Site URL (for OAuth)
   NEXT_PUBLIC_SITE_URL=your_site_url
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📱 PWA Support

Pixie Wallet can be installed as a Progressive Web App on mobile devices:

1. Open the website in your mobile browser
2. For iOS: Tap the share button and select "Add to Home Screen"
3. For Android: Tap the menu button and select "Install App" or "Add to Home Screen"

## 🔐 Wallet Creation

Pixie Wallet supports two types of wallets:

1. **EOA Wallet**: Standard Externally Owned Account with a single key
2. **Smart Wallet**: Advanced account abstraction wallet with special abilities:
   - Batched transactions
   - Sponsored gas
   - Enhanced security features

## 💻 Technology Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Next.js API routes, Supabase
- **Blockchain**: Coinbase CDP SDK, EVM
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL

## 🧪 Testing

Run tests with:

```bash
npm test
# or
yarn test
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔮 Roadmap

- Multi-chain support
- NFT display and management
- Swap integration
- DApp browser
- Mobile app version

## ⚠️ Disclaimer

This wallet is currently in beta and connected to testnet only. Do not use for production assets.
