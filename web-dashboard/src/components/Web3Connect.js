import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import './Web3Connect.css';

const Web3Connect = () => {
  const {
    account,
    isConnected,
    chainId,
    balance,
    connectWallet,
    disconnectWallet,
    switchToMumbai
  } = useWeb3();

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance) => {
    return parseFloat(balance).toFixed(4);
  };

  const isWrongNetwork = chainId && chainId !== '80001' && chainId !== '31337'; // Not Mumbai or local

  return (
    <div className="web3-connect">
      {!isConnected ? (
        <div className="connect-section">
          <button onClick={connectWallet} className="connect-btn">
            🦊 Connect MetaMask
          </button>
          <p className="connect-info">
            Connect your wallet to interact with blockchain features
          </p>
        </div>
      ) : (
        <div className="connected-section">
          <div className="wallet-info">
            <div className="account-info">
              <span className="account-label">Account:</span>
              <span className="account-address">{formatAddress(account)}</span>
            </div>
            
            <div className="balance-info">
              <span className="balance-label">Balance:</span>
              <span className="balance-amount">{formatBalance(balance)} MATIC</span>
            </div>
            
            <div className="network-info">
              <span className="network-label">Network:</span>
              <span className={`network-status ${isWrongNetwork ? 'wrong' : 'correct'}`}>
                {chainId === '80001' ? '🟢 Mumbai Testnet' : 
                 chainId === '31337' ? '🟡 Local Network' : 
                 '🔴 Wrong Network'}
              </span>
            </div>
          </div>

          {isWrongNetwork && (
            <div className="network-warning">
              <p>⚠️ Please switch to Mumbai testnet for full functionality</p>
              <button onClick={switchToMumbai} className="switch-network-btn">
                Switch to Mumbai
              </button>
            </div>
          )}

          <button onClick={disconnectWallet} className="disconnect-btn">
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default Web3Connect;
