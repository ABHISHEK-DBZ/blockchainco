import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import './BlockchainProject.css';

const BlockchainProject = () => {
  const { isConnected, createProject, mintCarbonCredits } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: '',
    location: '',
    area: '',
    description: ''
  });
  const [mintForm, setMintForm] = useState({
    projectId: '',
    amount: '',
    recipient: ''
  });

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      // In a real app, you would upload to IPFS first
      const fakeIpfsHash = `QmProject${Date.now()}`;
      
      const result = await createProject(
        projectForm.name,
        projectForm.location,
        parseInt(projectForm.area),
        fakeIpfsHash
      );

      alert(`✅ Project created on blockchain!\nProject ID: ${result.projectId}\nTransaction: ${result.receipt.hash}`);
      
      // Reset form
      setProjectForm({ name: '', location: '', area: '', description: '' });
    } catch (error) {
      alert(`❌ Error creating project: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMintSubmit = async (e) => {
    e.preventDefault();
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      const result = await mintCarbonCredits(
        parseInt(mintForm.projectId),
        parseFloat(mintForm.amount),
        mintForm.recipient
      );

      alert(`✅ Carbon credits minted!\nTransaction: ${result.hash}`);
      
      // Reset form
      setMintForm({ projectId: '', amount: '', recipient: '' });
    } catch (error) {
      alert(`❌ Error minting credits: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (form, setForm) => (e) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isConnected) {
    return (
      <div className="blockchain-project">
        <div className="not-connected">
          <h3>🔗 Blockchain Features</h3>
          <p>Connect your wallet to access blockchain functionality</p>
        </div>
      </div>
    );
  }

  return (
    <div className="blockchain-project">
      <h2>🌊 Blockchain Project Management</h2>
      
      {/* Create Project Section */}
      <div className="project-section">
        <h3>🌿 Create Project on Blockchain</h3>
        <form onSubmit={handleProjectSubmit} className="project-form">
          <div className="form-group">
            <label>Project Name:</label>
            <input
              type="text"
              name="name"
              value={projectForm.name}
              onChange={handleInputChange(projectForm, setProjectForm)}
              placeholder="e.g., Sundarbans Mangrove Restoration"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Location:</label>
            <input
              type="text"
              name="location"
              value={projectForm.location}
              onChange={handleInputChange(projectForm, setProjectForm)}
              placeholder="e.g., West Bengal, India"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Area (hectares):</label>
            <input
              type="number"
              name="area"
              value={projectForm.area}
              onChange={handleInputChange(projectForm, setProjectForm)}
              placeholder="e.g., 100"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Description:</label>
            <textarea
              name="description"
              value={projectForm.description}
              onChange={handleInputChange(projectForm, setProjectForm)}
              placeholder="Project description..."
              rows="3"
            />
          </div>
          
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isLoading}
          >
            {isLoading ? '⏳ Creating...' : '🚀 Create Project on Blockchain'}
          </button>
        </form>
      </div>

      {/* Mint Carbon Credits Section */}
      <div className="mint-section">
        <h3>🪙 Mint Carbon Credits</h3>
        <form onSubmit={handleMintSubmit} className="mint-form">
          <div className="form-group">
            <label>Project ID:</label>
            <input
              type="number"
              name="projectId"
              value={mintForm.projectId}
              onChange={handleInputChange(mintForm, setMintForm)}
              placeholder="e.g., 1"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Amount (tons CO2):</label>
            <input
              type="number"
              name="amount"
              value={mintForm.amount}
              onChange={handleInputChange(mintForm, setMintForm)}
              placeholder="e.g., 100"
              step="0.01"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Recipient Address:</label>
            <input
              type="text"
              name="recipient"
              value={mintForm.recipient}
              onChange={handleInputChange(mintForm, setMintForm)}
              placeholder="0x..."
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="submit-btn mint-btn"
            disabled={isLoading}
          >
            {isLoading ? '⏳ Minting...' : '🪙 Mint Carbon Credits'}
          </button>
        </form>
      </div>

      {/* Info Section */}
      <div className="info-section">
        <h3>ℹ️ How It Works</h3>
        <div className="info-cards">
          <div className="info-card">
            <h4>1. 📝 Register Project</h4>
            <p>Create restoration projects on the blockchain with immutable records</p>
          </div>
          <div className="info-card">
            <h4>2. 🔍 Monitor Progress</h4>
            <p>Track restoration progress and environmental impact through verified data</p>
          </div>
          <div className="info-card">
            <h4>3. 🪙 Mint Credits</h4>
            <p>Generate tokenized carbon credits based on verified sequestration</p>
          </div>
          <div className="info-card">
            <h4>4. 💰 Trade & Transfer</h4>
            <p>Transparent marketplace for buying, selling, and retiring carbon credits</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainProject;
