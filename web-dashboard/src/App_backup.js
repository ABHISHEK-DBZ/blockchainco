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
import LiveTelemetry from './components/LiveTelemetry';
import ProjectManager from './components/ProjectManager';
import CarbonCreditsManager from './components/CarbonCreditsManager';
import FieldDataManager from './components/FieldDataManager';
import MapWrapper from './components/MapWrapper';
import { NotificationProvider, useNotification } from './components/NotificationSystem';
import { Web3Provider } from './contexts/Web3Context';
import { RealTimeProvider } from './context/RealTimeContext';
import { jwtDecode } from 'jwt-decode';
import { logger } from './utils/logger';
import { apiClient } from './utils/apiClient';
import { Bar } from 'react-chartjs-2';
import './App.css';

function AppContent() {
  const [token, setToken] = useState(() => {
    // Initialize token from localStorage
    return localStorage.getItem('blue_carbon_token') || null;
  });
  const [showRegister, setShowRegister] = useState(false);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('management');
  const [activeBlockchainTab, setActiveBlockchainTab] = useState('summary');
  const [activeManagementTab, setActiveManagementTab] = useState('projects');
  const [systemHealth, setSystemHealth] = useState('checking');
  const { showSuccess, showError, showInfo } = useNotification();

  // Handle token changes and localStorage persistence
  const handleSetToken = (newToken) => {
    if (newToken) {
      localStorage.setItem('blue_carbon_token', newToken);
      logger.userAction('user_login', { timestamp: new Date().toISOString() });
    } else {
      localStorage.removeItem('blue_carbon_token');
      logger.userAction('user_logout', { timestamp: new Date().toISOString() });
    }
    setToken(newToken);
  };

  // System startup and health monitoring
  useEffect(() => {
    logger.info('Blue Carbon Registry Application Starting', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Check system health
    const checkSystemHealth = async () => {
      try {
        const response = await apiClient.get('/health');
        setSystemHealth('healthy');
        logger.info('System health check passed', response.data);
      } catch (error) {
        setSystemHealth('unhealthy');
        logger.error('System health check failed', error);
        showError('System health check failed. Some features may not work properly.');
      }
    };

    checkSystemHealth();
    
    // Performance monitoring
    logger.performance('App startup time', Date.now());
  }, [showError]);

  useEffect(() => {
    if (token) {
      showInfo('Loading projects...');
      logger.info('Loading projects for authenticated user');
      
      // Use enhanced API client with retry logic
      apiClient.get('/projects')
        .then(data => {
          setProjects(data.projects || []);
          showSuccess(`Loaded ${data.projects?.length || 0} projects`);
          logger.info('Projects loaded successfully', { count: data.projects?.length || 0 });
        })
        .catch(error => {
          console.error('Error fetching projects:', error);
          showError('Failed to load projects');
          logger.error('Failed to load projects', error);
        });
    }
  }, [token, showInfo, showSuccess, showError]);

  if (!token) {
    return (
      <div className="auth-container">
        {showRegister ? (
          <Register onRegister={() => setShowRegister(false)} />
        ) : (
          <Login onLogin={handleSetToken} />
        )}
        <button onClick={() => setShowRegister(r => !r)} className="auth-toggle">
          {showRegister ? 'Back to Login' : 'Register'}
        </button>
      </div>
    );
  }

  let user = null;
  let isAdmin = false;
  
  if (token) {
    try {
      // Try to decode as JWT token
      user = jwtDecode(token);
      isAdmin = user && user.role === 'admin';
    } catch (error) {
      // If token is not a valid JWT, handle demo token format
      console.log('Token is not a valid JWT, using demo authentication');
      const tokenParts = token.split('_');
      if (tokenParts.length >= 2 && tokenParts[0] === 'demo' && tokenParts[1] === 'token') {
        const username = tokenParts[2];
        user = {
          username: username,
          role: username === 'admin' ? 'admin' : 'user'
        };
        isAdmin = user.role === 'admin';
      } else {
        // Invalid token format, clear it
        handleSetToken(null);
        user = null;
        isAdmin = false;
      }
    }
  }

  const chartData = {
    labels: projects.map(p => p.location),
    datasets: [{
      label: 'Area (hectares)',
      data: projects.map(p => p.area_hectares),
      backgroundColor: 'rgba(75,192,192,0.6)'
    }]
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🌊 Blue Carbon Registry</h1>
        <span className={`health-indicator ${systemHealth}`} title={`System Status: ${systemHealth}`}>
          {systemHealth === 'healthy' ? '🟢' : systemHealth === 'unhealthy' ? '🔴' : '🟡'}
        </span>
        <p>Blockchain-Powered Coastal Ecosystem Restoration</p>
          
          {/* Web3 Connection Component */}
          <Web3Connect />
          
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button 
              className={`tab-btn ${activeTab === 'management' ? 'active' : ''}`}
              onClick={() => setActiveTab('management')}
            >
              🏢 Management System
            </button>
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
            <button onClick={() => handleSetToken(null)} className="logout-btn">
              Logout
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'management' ? (
            <div className="management-content">
              <div className="management-tabs">
                <div className="management-tab-nav">
                  <button 
                    className={`management-tab-btn ${activeManagementTab === 'projects' ? 'active' : ''}`}
                    onClick={() => setActiveManagementTab('projects')}
                  >
                    🏗️ Project Manager
                  </button>
                  <button 
                    className={`management-tab-btn ${activeManagementTab === 'credits' ? 'active' : ''}`}
                    onClick={() => setActiveManagementTab('credits')}
                  >
                    💳 Carbon Credits
                  </button>
                  <button 
                    className={`management-tab-btn ${activeManagementTab === 'fielddata' ? 'active' : ''}`}
                    onClick={() => setActiveManagementTab('fielddata')}
                  >
                    📊 Field Data
                  </button>
                  <button 
                    className={`management-tab-btn ${activeManagementTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveManagementTab('dashboard')}
                  >
                    🏠 Dashboard
                  </button>
                </div>
                
                <div className="management-tab-content">
                  {activeManagementTab === 'projects' ? (
                    <ProjectManager />
                  ) : activeManagementTab === 'credits' ? (
                    <CarbonCreditsManager />
                  ) : activeManagementTab === 'fielddata' ? (
                    <FieldDataManager />
                  ) : (
                    <DashboardSummary />
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'traditional' ? (
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
                  <MapWrapper 
                    center={[20, 78]} 
                    zoom={5} 
                    markers={projects.filter(p => p.latitude && p.longitude).map(p => ({
                      position: [p.latitude, p.longitude],
                      popup: `${p.name}<br/>${p.location}${p.ipfs_hash ? `<br/><a href="https://ipfs.io/ipfs/${p.ipfs_hash}" target="_blank" rel="noopener noreferrer">View Photo</a>` : ''}`
                    }))}
                    style={{ height: '400px', width: '100%' }}
                  />
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
                  <button 
                    className={`blockchain-tab-btn ${activeBlockchainTab === 'telemetry' ? 'active' : ''}`}
                    onClick={() => setActiveBlockchainTab('telemetry')}
                  >
                    🛰️ Telemetry
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
                    activeBlockchainTab === 'status' ? <SystemStatus /> : <LiveTelemetry />
                  )}
                </div>
              </div>
            </div>
          )}
        </header>
      </div>
    </div>
  );
}

function App() {
  return (
    <NotificationProvider>
      <Web3Provider>
        <RealTimeProvider>
          <AppContent />
        </RealTimeProvider>
      </Web3Provider>
    </NotificationProvider>
  );
}

export default App;
