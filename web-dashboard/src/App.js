import React, { useEffect, useState } from 'react';
import './chartSetup';
import './CoolTheme.css';
import Login from './Login';
import Register from './Register';
import AdminPanel from './AdminPanel';
import Web3Connect from './components/Web3Connect';
import BlockchainProject from './components/BlockchainProject';
import CarbonCreditAnalytics from './components/CarbonCreditAnalytics';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import DataManagement from './components/DataManagement';
import DashboardSummary from './components/DashboardSummary';
import ContractDeployment from './components/ContractDeployment';
import NFTCertificates from './components/NFTCertificates';
import SystemStatus from './components/SystemStatus';
import { NotificationProvider, useNotification } from './components/NotificationSystem';
import { Web3Provider } from './contexts/Web3Context';
import { jwtDecode } from 'jwt-decode';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Bar } from 'react-chartjs-2';
import 'leaflet/dist/leaflet.css';
import './App.css';

function AppContent() {
  const [token, setToken] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('traditional');
  const [activeBlockchainTab, setActiveBlockchainTab] = useState('summary');
  const { showSuccess, showError, showInfo } = useNotification();

  useEffect(() => {
    if (token) {
      showInfo('Loading projects...');
      fetch('http://localhost:5000/projects', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) {
            return res.json();
          }
          throw new Error('Failed to fetch projects');
        })
        .then(data => {
          setProjects(data.projects);
          showSuccess(`Loaded ${data.projects.length} projects`);
        })
        .catch(error => {
          console.error('Error fetching projects:', error);
          showError('Failed to load projects');
        });
    }
  }, [token, showInfo, showSuccess, showError]);

  if (!token) {
    return (
      <Web3Provider>
        <div className="auth-container">
          {showRegister ? (
            <Register onRegister={() => setShowRegister(false)} />
          ) : (
            <Login onLogin={setToken} />
          )}
          <button onClick={() => setShowRegister(r => !r)} className="auth-toggle">
            {showRegister ? 'Back to Login' : 'Register'}
          </button>
        </div>
      </Web3Provider>
    );
  }

  const user = token ? jwtDecode(token) : null;
  const isAdmin = user && user.role === 'admin';

  const chartData = {
    labels: projects.map(p => p.location),
    datasets: [{
      label: 'Area (hectares)',
      data: projects.map(p => p.area_hectares),
      backgroundColor: 'rgba(75,192,192,0.6)'
    }]
  };

  return (
    <Web3Provider>
      <div className="App">
        <header className="App-header">
          <h1>🌊 Blue Carbon Registry</h1>
          <p>Blockchain-Powered Coastal Ecosystem Restoration</p>
          
          {/* Web3 Connection Component */}
          <Web3Connect />
          
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button 
              className={`tab-btn ${activeTab === 'traditional' ? 'active' : ''}`}
              onClick={() => setActiveTab('traditional')}
            >
              📊 Traditional Dashboard
            </button>
            <button 
              className={`tab-btn ${activeTab === 'blockchain' ? 'active' : ''}`}
              onClick={() => setActiveTab('blockchain')}
            >
              🔗 Blockchain Features
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'traditional' ? (
            <div className="traditional-content">
              <h2>Restoration Projects Overview</h2>
              {isAdmin && <AdminPanel projects={projects} />}
              
              <div className="dashboard-grid">
                <div className="chart-section">
                  <h3>Projects by Area</h3>
                  <Bar data={chartData} />
                </div>
                
                <div className="map-section">
                  <h3>Project Locations</h3>
                  <MapContainer center={[20, 78]} zoom={5} style={{ height: '400px', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {projects.map(p => (
                      p.latitude && p.longitude && (
                        <Marker key={p.id} position={[p.latitude, p.longitude]}>
                          <Popup>
                            {p.name} <br /> {p.location}
                            {p.ipfs_hash && (
                              <a href={`https://ipfs.io/ipfs/${p.ipfs_hash}`} target="_blank" rel="noopener noreferrer">
                                View Photo
                              </a>
                            )}
                          </Popup>
                        </Marker>
                      )
                    ))}
                  </MapContainer>
                </div>
              </div>

              <div className="projects-grid">
                {projects.map(project => (
                  <div key={project.id} className="project-card">
                    <h4>{project.name}</h4>
                    <p><strong>Location:</strong> {project.location}</p>
                    <p><strong>Area:</strong> {project.area_hectares} hectares</p>
                    <p><strong>Description:</strong> {project.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="blockchain-content">
              <Web3Connect />
              <div className="blockchain-tabs">
                <div className="blockchain-tab-nav">
                  <button 
                    className={`blockchain-tab-btn ${activeBlockchainTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setActiveBlockchainTab('summary')}
                  >
                    🏠 Summary
                  </button>
                  <button 
                    className={`blockchain-tab-btn ${activeBlockchainTab === 'projects' ? 'active' : ''}`}
                    onClick={() => setActiveBlockchainTab('projects')}
                  >
                    🏗️ Projects
                  </button>
                  <button 
                    className={`blockchain-tab-btn ${activeBlockchainTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => setActiveBlockchainTab('analytics')}
                  >
                    📊 Analytics
                  </button>
                  <button 
                    className={`blockchain-tab-btn ${activeBlockchainTab === 'advanced-analytics' ? 'active' : ''}`}
                    onClick={() => setActiveBlockchainTab('advanced-analytics')}
                  >
                    📈 Advanced Analytics
                  </button>
                  <button 
                    className={`blockchain-tab-btn ${activeBlockchainTab === 'data' ? 'active' : ''}`}
                    onClick={() => setActiveBlockchainTab('data')}
                  >
                    💾 Data Management
                  </button>
                  <button 
                    className={`blockchain-tab-btn ${activeBlockchainTab === 'certificates' ? 'active' : ''}`}
                    onClick={() => setActiveBlockchainTab('certificates')}
                  >
                    🏆 NFTs
                  </button>
                  <button 
                    className={`blockchain-tab-btn ${activeBlockchainTab === 'deployment' ? 'active' : ''}`}
                    onClick={() => setActiveBlockchainTab('deployment')}
                  >
                    🚀 Deploy
                  </button>
                  <button 
                    className={`blockchain-tab-btn ${activeBlockchainTab === 'status' ? 'active' : ''}`}
                    onClick={() => setActiveBlockchainTab('status')}
                  >
                    ⚙️ Status
                  </button>
                </div>
                
                <div className="blockchain-tab-content">
                  {activeBlockchainTab === 'summary' ? (
                    <DashboardSummary />
                  ) : activeBlockchainTab === 'projects' ? (
                    <BlockchainProject />
                  ) : activeBlockchainTab === 'analytics' ? (
                    <CarbonCreditAnalytics />
                  ) : activeBlockchainTab === 'advanced-analytics' ? (
                    <AdvancedAnalytics />
                  ) : activeBlockchainTab === 'data' ? (
                    <DataManagement />
                  ) : activeBlockchainTab === 'certificates' ? (
                    <NFTCertificates />
                  ) : activeBlockchainTab === 'deployment' ? (
                    <ContractDeployment />
                  ) : (
                    <SystemStatus />
                  )}
                </div>
              </div>
            </div>
          )}

          <button onClick={() => setToken(null)} className="logout-btn">
            Logout
          </button>
        </header>
      </div>
    </Web3Provider>
  );
}

function App() {
  return (
    <NotificationProvider>
      <Web3Provider>
        <AppContent />
      </Web3Provider>
    </NotificationProvider>
  );
}

export default App;
