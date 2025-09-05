import React, { useState, useEffect, createContext, useContext } from 'react';
import { ethers } from 'ethers';

// Create Web3 Context
const Web3Context = createContext();

// Contract ABIs (simplified for demo)
const REGISTRY_ABI = [
  "function registerParticipant(string memory name, uint8 participantType) external",
  "function getParticipant(address participant) external view returns (string memory, uint8, bool)",
  "function isValidated(address participant) external view returns (bool)"
];

const PROJECT_ABI = [
  "function createProject(string memory name, string memory location, uint256 area, string memory ipfsHash) external returns (uint256)",
  "function getProject(uint256 projectId) external view returns (string memory, string memory, uint256, string memory, address, uint8)",
  "function updateProjectStatus(uint256 projectId, uint8 status) external"
];

const TOKEN_ABI = [
  "function mintCarbonCredits(uint256 projectId, uint256 amount, address to) external",
  "function balanceOf(address account, uint256 id) external view returns (uint256)",
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external"
];

// Contract addresses (will be updated with real addresses after deployment)
const CONTRACT_ADDRESSES = {
  REGISTRY: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Local addresses from our test
  PROJECT: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  TOKEN: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contracts, setContracts] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0');

  // Initialize Web3 connection
  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        // Request account access
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });

        // Create provider and signer
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const network = await provider.getNetwork();

        // Get balance
        const balance = await provider.getBalance(accounts[0]);
        
        // Initialize contracts
        const registryContract = new ethers.Contract(
          CONTRACT_ADDRESSES.REGISTRY,
          REGISTRY_ABI,
          signer
        );
        
        const projectContract = new ethers.Contract(
          CONTRACT_ADDRESSES.PROJECT,
          PROJECT_ABI,
          signer
        );
        
        const tokenContract = new ethers.Contract(
          CONTRACT_ADDRESSES.TOKEN,
          TOKEN_ABI,
          signer
        );

        // Update state
        setAccount(accounts[0]);
        setProvider(provider);
        setSigner(signer);
        setChainId(network.chainId.toString());
        setBalance(ethers.formatEther(balance));
        setContracts({
          registry: registryContract,
          project: projectContract,
          token: tokenContract
        });
        setIsConnected(true);

        console.log('✅ Wallet connected:', accounts[0]);
        console.log('🌐 Network:', network.name, 'Chain ID:', network.chainId.toString());
        
      } else {
        alert('Please install MetaMask to use blockchain features!');
      }
    } catch (error) {
      console.error('❌ Error connecting wallet:', error);
      alert('Failed to connect wallet: ' + error.message);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContracts({});
    setIsConnected(false);
    setChainId(null);
    setBalance('0');
    console.log('👋 Wallet disconnected');
  };

  // Switch to Mumbai testnet
  const switchToMumbai = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x13881' }], // Mumbai testnet chain ID
      });
    } catch (switchError) {
      // Network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x13881',
              chainName: 'Mumbai Testnet',
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18
              },
              rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
              blockExplorerUrls: ['https://mumbai.polygonscan.com/']
            }]
          });
        } catch (addError) {
          console.error('❌ Error adding Mumbai network:', addError);
        }
      }
    }
  };

  // Register as participant on blockchain
  const registerParticipant = async (name, participantType) => {
    try {
      if (!contracts.registry) throw new Error('Registry contract not loaded');
      
      const tx = await contracts.registry.registerParticipant(name, participantType);
      console.log('📝 Registration transaction:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Participant registered on blockchain:', receipt);
      
      return receipt;
    } catch (error) {
      console.error('❌ Error registering participant:', error);
      throw error;
    }
  };

  // Create project on blockchain
  const createProject = async (name, location, area, ipfsHash) => {
    try {
      if (!contracts.project) throw new Error('Project contract not loaded');
      
      const tx = await contracts.project.createProject(name, location, area, ipfsHash);
      console.log('🌿 Project creation transaction:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Project created on blockchain:', receipt);
      
      // Extract project ID from events
      const projectId = receipt.logs[0]?.args?.[0] || 0;
      return { receipt, projectId: projectId.toString() };
    } catch (error) {
      console.error('❌ Error creating project:', error);
      throw error;
    }
  };

  // Mint carbon credits
  const mintCarbonCredits = async (projectId, amount, recipient) => {
    try {
      if (!contracts.token) throw new Error('Token contract not loaded');
      
      const tx = await contracts.token.mintCarbonCredits(
        projectId, 
        ethers.parseUnits(amount.toString(), 18), 
        recipient
      );
      console.log('🪙 Carbon credit minting transaction:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Carbon credits minted:', receipt);
      
      return receipt;
    } catch (error) {
      console.error('❌ Error minting carbon credits:', error);
      throw error;
    }
  };

  // Get carbon credit balance
  const getCarbonCreditBalance = async (address, tokenId) => {
    try {
      if (!contracts.token) throw new Error('Token contract not loaded');
      
      const balance = await contracts.token.balanceOf(address, tokenId);
      return ethers.formatUnits(balance, 18);
    } catch (error) {
      console.error('❌ Error getting balance:', error);
      return '0';
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
        }
      });

      window.ethereum.on('chainChanged', (chainId) => {
        setChainId(parseInt(chainId, 16).toString());
        // Reload page on chain change for consistency
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  const contextValue = {
    account,
    provider,
    signer,
    contracts,
    isConnected,
    chainId,
    balance,
    connectWallet,
    disconnectWallet,
    switchToMumbai,
    registerParticipant,
    createProject,
    mintCarbonCredits,
    getCarbonCreditBalance
  };

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
