'use client';

import WalletInterface from './components/WalletInterface';

export default function App() {
  return (
    <div className="flex flex-col min-h-screen font-sans dark:bg-gray-950 dark:text-white bg-gray-50 text-black">
      <header className="py-4 px-6 bg-white dark:bg-gray-900 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">Pixie Wallet</h1>
          <a 
            href="https://docs.cdp.coinbase.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
          >
            Docs
          </a>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <WalletInterface />

          <div className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm">
            <p>Powered by Coinbase CDP SDK</p>
          </div>
        </div>
      </main>

      <footer className="py-4 px-6 bg-white dark:bg-gray-900 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>© 2024 Pixie Wallet. All rights reserved.</p>
      </footer>
    </div>
  );
}
