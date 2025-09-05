import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import './NFTCertificates.css';

const NFTCertificates = () => {
  const { isConnected, account } = useWeb3();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showMintForm, setShowMintForm] = useState(false);
  const [mintForm, setMintForm] = useState({
    projectName: '',
    credits: '',
    description: '',
    imageUrl: ''
  });

  useEffect(() => {
    if (isConnected && account) {
      loadCertificates();
    }
  }, [isConnected, account]);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      // Mock NFT certificates data
      const mockCertificates = [
        {
          id: 1,
          tokenId: 'BCR-001',
          projectName: 'Mangrove Restoration Project #1',
          credits: 1000,
          issuedDate: '2024-01-15',
          validUntil: '2034-01-15',
          status: 'Active',
          owner: account,
          metadata: {
            location: 'Sundarbans, Bangladesh',
            area: '50 hectares',
            co2Sequestered: '2,500 tons',
            biodiversityScore: 95
          },
          imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
          certificate: {
            issuer: 'Blue Carbon Registry',
            standard: 'Verified Carbon Standard (VCS)',
            methodology: 'VM0033 - Tidal Wetland and Seagrass Restoration',
            verificationBody: 'DNV GL'
          }
        },
        {
          id: 2,
          tokenId: 'BCR-002',
          projectName: 'Seagrass Conservation Initiative',
          credits: 750,
          issuedDate: '2024-02-20',
          validUntil: '2034-02-20',
          status: 'Active',
          owner: account,
          metadata: {
            location: 'Great Barrier Reef, Australia',
            area: '30 hectares',
            co2Sequestered: '1,875 tons',
            biodiversityScore: 88
          },
          imageUrl: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400',
          certificate: {
            issuer: 'Blue Carbon Registry',
            standard: 'Gold Standard',
            methodology: 'GS-WETLANDS-01',
            verificationBody: 'Bureau Veritas'
          }
        },
        {
          id: 3,
          tokenId: 'BCR-003',
          projectName: 'Coastal Wetlands Protection',
          credits: 1250,
          issuedDate: '2024-03-10',
          validUntil: '2034-03-10',
          status: 'Retired',
          owner: '0x1234567890abcdef1234567890abcdef12345678',
          metadata: {
            location: 'Chesapeake Bay, USA',
            area: '75 hectares',
            co2Sequestered: '3,125 tons',
            biodiversityScore: 92
          },
          imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
          certificate: {
            issuer: 'Blue Carbon Registry',
            standard: 'Climate Action Reserve',
            methodology: 'CAR-WETLANDS-02',
            verificationBody: 'SCS Global Services'
          }
        }
      ];

      await new Promise(resolve => setTimeout(resolve, 1000));
      setCertificates(mockCertificates);
    } catch (error) {
      console.error('Error loading certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMintCertificate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate minting process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newCertificate = {
        id: certificates.length + 1,
        tokenId: `BCR-${String(certificates.length + 1).padStart(3, '0')}`,
        projectName: mintForm.projectName,
        credits: parseInt(mintForm.credits),
        issuedDate: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Active',
        owner: account,
        metadata: {
          location: 'To be verified',
          area: 'To be verified',
          co2Sequestered: `${parseInt(mintForm.credits) * 2.5} tons`,
          biodiversityScore: 'Pending assessment'
        },
        imageUrl: mintForm.imageUrl || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
        certificate: {
          issuer: 'Blue Carbon Registry',
          standard: 'Verified Carbon Standard (VCS)',
          methodology: 'VM0033 - Tidal Wetland and Seagrass Restoration',
          verificationBody: 'Pending verification'
        }
      };

      setCertificates(prev => [newCertificate, ...prev]);
      setMintForm({ projectName: '', credits: '', description: '', imageUrl: '' });
      setShowMintForm(false);
      alert('NFT Certificate minted successfully!');
    } catch (error) {
      console.error('Error minting certificate:', error);
      alert('Failed to mint certificate');
    } finally {
      setLoading(false);
    }
  };

  const retireCertificate = async (certificateId) => {
    if (window.confirm('Are you sure you want to retire this certificate? This action cannot be undone.')) {
      setCertificates(prev =>
        prev.map(cert =>
          cert.id === certificateId ? { ...cert, status: 'Retired' } : cert
        )
      );
      alert('Certificate retired successfully!');
    }
  };

  const downloadCertificate = (certificate) => {
    // In a real implementation, this would generate a PDF certificate
    const certificateData = {
      tokenId: certificate.tokenId,
      projectName: certificate.projectName,
      credits: certificate.credits,
      owner: certificate.owner,
      issuedDate: certificate.issuedDate,
      ...certificate.certificate
    };
    
    const dataStr = JSON.stringify(certificateData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${certificate.tokenId}-certificate.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isConnected) {
    return (
      <div className="nft-certificates">
        <div className="not-connected">
          <h3>🔗 Connect Your Wallet</h3>
          <p>Please connect your wallet to view and manage NFT certificates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nft-certificates">
      <div className="header-section">
        <h2>🏆 Carbon Credit NFT Certificates</h2>
        <button 
          className="mint-btn"
          onClick={() => setShowMintForm(true)}
          disabled={loading}
        >
          ➕ Mint New Certificate
        </button>
      </div>

      {showMintForm && (
        <div className="mint-form-modal">
          <div className="mint-form-content">
            <h3>🎨 Mint New NFT Certificate</h3>
            <form onSubmit={handleMintCertificate}>
              <div className="form-group">
                <label>Project Name:</label>
                <input
                  type="text"
                  value={mintForm.projectName}
                  onChange={(e) => setMintForm(prev => ({ ...prev, projectName: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Carbon Credits:</label>
                <input
                  type="number"
                  value={mintForm.credits}
                  onChange={(e) => setMintForm(prev => ({ ...prev, credits: e.target.value }))}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={mintForm.description}
                  onChange={(e) => setMintForm(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Image URL:</label>
                <input
                  type="url"
                  value={mintForm.imageUrl}
                  onChange={(e) => setMintForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="form-actions">
                <button type="submit" disabled={loading}>
                  {loading ? 'Minting...' : 'Mint Certificate'}
                </button>
                <button type="button" onClick={() => setShowMintForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && certificates.length === 0 ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading certificates...</p>
        </div>
      ) : (
        <div className="certificates-grid">
          {certificates.map(certificate => (
            <div key={certificate.id} className={`certificate-card ${certificate.status.toLowerCase()}`}>
              <div className="certificate-image">
                <img src={certificate.imageUrl} alt={certificate.projectName} />
                <div className="certificate-status">
                  <span className={`status-badge ${certificate.status.toLowerCase()}`}>
                    {certificate.status}
                  </span>
                </div>
              </div>
              
              <div className="certificate-content">
                <h3>{certificate.projectName}</h3>
                <div className="certificate-meta">
                  <div className="meta-item">
                    <span className="label">Token ID:</span>
                    <span className="value">{certificate.tokenId}</span>
                  </div>
                  <div className="meta-item">
                    <span className="label">Credits:</span>
                    <span className="value">{certificate.credits.toLocaleString()}</span>
                  </div>
                  <div className="meta-item">
                    <span className="label">Issued:</span>
                    <span className="value">{new Date(certificate.issuedDate).toLocaleDateString()}</span>
                  </div>
                  <div className="meta-item">
                    <span className="label">Valid Until:</span>
                    <span className="value">{new Date(certificate.validUntil).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="certificate-actions">
                  <button onClick={() => setSelectedCertificate(certificate)}>
                    👁️ View Details
                  </button>
                  <button onClick={() => downloadCertificate(certificate)}>
                    📥 Download
                  </button>
                  {certificate.owner === account && certificate.status === 'Active' && (
                    <button 
                      onClick={() => retireCertificate(certificate.id)}
                      className="retire-btn"
                    >
                      🔒 Retire
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCertificate && (
        <div className="certificate-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>🏆 Certificate Details</h3>
              <button onClick={() => setSelectedCertificate(null)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="certificate-details">
                <img src={selectedCertificate.imageUrl} alt={selectedCertificate.projectName} />
                
                <div className="details-grid">
                  <div className="detail-section">
                    <h4>📋 Basic Information</h4>
                    <div className="detail-item">
                      <span>Token ID:</span>
                      <span>{selectedCertificate.tokenId}</span>
                    </div>
                    <div className="detail-item">
                      <span>Project:</span>
                      <span>{selectedCertificate.projectName}</span>
                    </div>
                    <div className="detail-item">
                      <span>Carbon Credits:</span>
                      <span>{selectedCertificate.credits.toLocaleString()}</span>
                    </div>
                    <div className="detail-item">
                      <span>Status:</span>
                      <span className={`status-badge ${selectedCertificate.status.toLowerCase()}`}>
                        {selectedCertificate.status}
                      </span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>🌍 Environmental Impact</h4>
                    <div className="detail-item">
                      <span>Location:</span>
                      <span>{selectedCertificate.metadata.location}</span>
                    </div>
                    <div className="detail-item">
                      <span>Area Protected:</span>
                      <span>{selectedCertificate.metadata.area}</span>
                    </div>
                    <div className="detail-item">
                      <span>CO₂ Sequestered:</span>
                      <span>{selectedCertificate.metadata.co2Sequestered}</span>
                    </div>
                    <div className="detail-item">
                      <span>Biodiversity Score:</span>
                      <span>{selectedCertificate.metadata.biodiversityScore}</span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>✅ Certification</h4>
                    <div className="detail-item">
                      <span>Issuer:</span>
                      <span>{selectedCertificate.certificate.issuer}</span>
                    </div>
                    <div className="detail-item">
                      <span>Standard:</span>
                      <span>{selectedCertificate.certificate.standard}</span>
                    </div>
                    <div className="detail-item">
                      <span>Methodology:</span>
                      <span>{selectedCertificate.certificate.methodology}</span>
                    </div>
                    <div className="detail-item">
                      <span>Verification Body:</span>
                      <span>{selectedCertificate.certificate.verificationBody}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTCertificates;
