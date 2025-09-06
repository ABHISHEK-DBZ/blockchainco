import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import './ContractDeployment.css';

const ContractDeployment = () => {
  const { isConnected, account } = useWeb3();
  const [deploymentStatus, setDeploymentStatus] = useState({
    isDeploying: false,
    deployed: false,
    addresses: {},
    transactions: []
  });
  
  const [networkConfig] = useState({
    chainId: 80001, // Mumbai testnet
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    name: 'Mumbai Testnet'
  });

  const contractsInfo = [
    {
      name: 'Registry Contract',
      description: 'Main registry for managing carbon credit projects',
      constructor: 'No parameters required',
      gasEstimate: '2,500,000'
    },
    {
      name: 'Project Contract',
      description: 'Individual project contract for specific blue carbon initiatives',
      constructor: 'Registry address required',
      gasEstimate: '1,800,000'
    },
    {
      name: 'Carbon Credit Token',
      description: 'ERC-20 token representing carbon credits',
      constructor: 'Project address required',
      gasEstimate: '2,200,000'
    }
  ];

  const deployAllContracts = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setDeploymentStatus(prev => ({ ...prev, isDeploying: true }));

    try {
      // Simulate contract deployment process
      const deploymentSteps = [
        'Compiling contracts...',
        'Deploying Registry Contract...',
        'Deploying Project Contract...',
        'Deploying Carbon Credit Token...',
        'Verifying contracts...',
        'Setting up permissions...'
      ];

      for (let i = 0; i < deploymentSteps.length; i++) {
        setDeploymentStatus(prev => ({
          ...prev,
          transactions: [...prev.transactions, {
            step: i + 1,
            message: deploymentSteps[i],
            status: 'in-progress',
            timestamp: new Date().toISOString()
          }]
        }));

        // Simulate deployment time
        await new Promise(resolve => setTimeout(resolve, 2000));

        setDeploymentStatus(prev => ({
          ...prev,
          transactions: prev.transactions.map((tx, index) =>
            index === i ? { ...tx, status: 'completed' } : tx
          )
        }));
      }

      // Mock deployed contract addresses
      const mockAddresses = {
        registry: '0x742d35Cc6634C0532925a3b8D39b4c56bbE342f5',
        project: '0x8ba1f109551bD432803012645Hac136c0c8b5F5',
        token: '0x123d45Cc6634C0532925a3b8D39b4c56bbE456d7'
      };

      setDeploymentStatus(prev => ({
        ...prev,
        deployed: true,
        addresses: mockAddresses,
        isDeploying: false
      }));

    } catch (error) {
      console.error('Deployment failed:', error);
      setDeploymentStatus(prev => ({
        ...prev,
        isDeploying: false,
        transactions: [...prev.transactions, {
          step: prev.transactions.length + 1,
          message: `Deployment failed: ${error.message}`,
          status: 'failed',
          timestamp: new Date().toISOString()
        }]
      }));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Address copied to clipboard!');
  };

  const viewOnExplorer = (address) => {
    window.open(`https://mumbai.polygonscan.com/address/${address}`, '_blank');
  };

  return (
    <div className="contract-deployment">
      <h2>🚀 Smart Contract Deployment</h2>
      
      {!isConnected ? (
        <div className="not-connected">
          <h3>🔗 Connect Your Wallet</h3>
          <p>Please connect your wallet to deploy smart contracts</p>
        </div>
      ) : (
        <>
          {/* Network Configuration */}
          <div className="network-config">
            <h3>🌐 Network Configuration</h3>
            <div className="config-grid">
              <div className="config-item">
                <label>Chain ID:</label>
                <span>{networkConfig.chainId}</span>
              </div>
              <div className="config-item">
                <label>Network:</label>
                <span>{networkConfig.name}</span>
              </div>
              <div className="config-item">
                <label>RPC URL:</label>
                <span>{networkConfig.rpcUrl}</span>
              </div>
              <div className="config-item">
                <label>Deployer:</label>
                <span>{account}</span>
              </div>
            </div>
          </div>

          {/* Contract Information */}
          <div className="contracts-info">
            <h3>📋 Contracts to Deploy</h3>
            <div className="contracts-grid">
              {contractsInfo.map((contract, index) => (
                <div key={index} className="contract-card">
                  <h4>{contract.name}</h4>
                  <p>{contract.description}</p>
                  <div className="contract-details">
                    <div className="detail-item">
                      <strong>Constructor:</strong> {contract.constructor}
                    </div>
                    <div className="detail-item">
                      <strong>Gas Estimate:</strong> {contract.gasEstimate}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deployment Controls */}
          <div className="deployment-controls">
            <button
              onClick={deployAllContracts}
              disabled={deploymentStatus.isDeploying || deploymentStatus.deployed}
              className="deploy-btn"
            >
              {deploymentStatus.isDeploying ? '🔄 Deploying...' : 
               deploymentStatus.deployed ? '✅ Deployed' : '🚀 Deploy All Contracts'}
            </button>
          </div>

          {/* Deployment Status */}
          {deploymentStatus.transactions.length > 0 && (
            <div className="deployment-status">
              <h3>📊 Deployment Progress</h3>
              <div className="status-list">
                {deploymentStatus.transactions.map((tx, index) => (
                  <div key={index} className={`status-item ${tx.status}`}>
                    <div className="status-icon">
                      {tx.status === 'completed' ? '✅' : 
                       tx.status === 'failed' ? '❌' : '🔄'}
                    </div>
                    <div className="status-content">
                      <div className="status-message">{tx.message}</div>
                      <div className="status-time">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deployed Contracts */}
          {deploymentStatus.deployed && (
            <div className="deployed-contracts">
              <h3>🎉 Deployment Successful!</h3>
              <div className="addresses-grid">
                <div className="address-card">
                  <h4>Registry Contract</h4>
                  <div className="address-display">
                    <code>{deploymentStatus.addresses.registry}</code>
                    <div className="address-actions">
                      <button onClick={() => copyToClipboard(deploymentStatus.addresses.registry)}>
                        📋 Copy
                      </button>
                      <button onClick={() => viewOnExplorer(deploymentStatus.addresses.registry)}>
                        🔍 View
                      </button>
                    </div>
                  </div>
                </div>

                <div className="address-card">
                  <h4>Project Contract</h4>
                  <div className="address-display">
                    <code>{deploymentStatus.addresses.project}</code>
                    <div className="address-actions">
                      <button onClick={() => copyToClipboard(deploymentStatus.addresses.project)}>
                        📋 Copy
                      </button>
                      <button onClick={() => viewOnExplorer(deploymentStatus.addresses.project)}>
                        🔍 View
                      </button>
                    </div>
                  </div>
                </div>

                <div className="address-card">
                  <h4>Carbon Credit Token</h4>
                  <div className="address-display">
                    <code>{deploymentStatus.addresses.token}</code>
                    <div className="address-actions">
                      <button onClick={() => copyToClipboard(deploymentStatus.addresses.token)}>
                        📋 Copy
                      </button>
                      <button onClick={() => viewOnExplorer(deploymentStatus.addresses.token)}>
                        🔍 View
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="next-steps">
                <h4>✨ Next Steps:</h4>
                <ul>
                  <li>Update your frontend configuration with the new contract addresses</li>
                  <li>Verify contracts on PolygonScan</li>
                  <li>Set up proper access controls and permissions</li>
                  <li>Test all contract interactions through the UI</li>
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ContractDeployment;
