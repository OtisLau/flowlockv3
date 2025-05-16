import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';

// Set up supported wallets
const wallets = [new PetraWallet()];

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AptosWalletAdapterProvider plugins={wallets} autoConnect={true}>
        <App />
      </AptosWalletAdapterProvider>
    </BrowserRouter>
  </React.StrictMode>
); 