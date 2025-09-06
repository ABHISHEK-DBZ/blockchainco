import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import './chartSetup';
import './App.css';

// Component imports
import Login from './components/Login';
import Register from './components/Register';
import ProjectManager from './components/ProjectManager';
import FieldDataManager from './components/FieldDataManager';
import CarbonCreditsManager from './components/CarbonCreditsManager';
import DashboardSummary from './components/DashboardSummary';
import MapWrapper from './components/MapWrapper';
import Web3Connect from './components/Web3Connect';

// New blockchain-focused components
import BlockchainProject from './components/BlockchainProject';
import CarbonCreditAnalytics from './components/CarbonCreditAnalytics';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import DataManagement from './components/DataManagement';
import NFTCertificates from './components/NFTCertificates';
import ContractDeployment from './components/ContractDeployment';
import SystemStatus from './components/SystemStatus';
import LiveTelemetry from './components/LiveTelemetry';

// Context providers
import { Web3Provider } from './contexts/Web3Context';
import { RealTimeProvider } from './contexts/RealTimeContext';
import { NotificationProvider } from './components/NotificationSystem';

function AppContent() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('management');
  const [activeManagementTab, setActiveManagementTab] = useState('dashboard');
  const [activeBlockchainTab, setActiveBlockchainTab] = useState('summary');
  const [showRegister, setShowRegister] = useState(false);
  const [systemHealth, setSystemHealth] = useState('healthy');

  const handleSetToken = (newToken) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
      setToken(newToken);
      console.log('Successfully logged in!');
    } else {
      localStorage.removeItem('token');
      setToken(null);
      console.log('Logged out successfully');
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects || []);
          setSystemHealth('healthy');
        } else {
          setSystemHealth('degraded');
          console.warn('Failed to fetch projects');
        }
      } catch (error) {
        setSystemHealth('unhealthy');
        console.error('Error fetching projects:', error);
      }
    };

    if (token) {
      fetchProjects();
    }
  }, [token]);

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
  
  if (token) {
    try {
      // Try to decode as JWT token first
      user = jwtDecode(token);
      console.log('JWT token decoded successfully');
    } catch (error) {
      // If token is not a valid JWT, handle demo token format
      console.log('Token is not a valid JWT, using demo authentication');
      
      // Check for demo token format
      if (typeof token === 'string') {
        const tokenParts = token.split('_');
        if (tokenParts.length >= 2 && tokenParts[0] === 'demo' && tokenParts[1] === 'token') {
          const username = tokenParts[2] || 'user';
          user = {
            username: username,
            role: username === 'admin' ? 'admin' : 'user',
            email: `${username}@demo.com`
          };
          console.log('Demo token validated for user:', username);
        } else {
          // Try to treat as simple username token
          user = {
            username: token,
            role: 'user',
            email: `${token}@demo.com`
          };
          console.log('Simple token validated for user:', token);
        }
      }
      
      // If we still don't have a valid user, clear the token
      if (!user) {
        console.warn('Invalid token format, clearing token');
        handleSetToken(null);
        return null;
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
                  <ProjectManager projects={projects} onProjectsUpdate={setProjects} token={token} />
                ) : activeManagementTab === 'credits' ? (
                  <CarbonCreditsManager token={token} />
                ) : activeManagementTab === 'fielddata' ? (
                  <FieldDataManager token={token} />
                ) : (
                  <DashboardSummary projects={projects} chartData={chartData} />
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'traditional' ? (
          <div className="dashboard-content">
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <h3>Project Overview</h3>
                <DashboardSummary projects={projects} chartData={chartData} />
              </div>
              
              <div className="dashboard-card">
                <h3>Interactive Map</h3>
                <MapWrapper projects={projects} />
              </div>
              
              <div className="dashboard-card">
                <h3>Recent Projects</h3>
                <ProjectManager projects={projects} onProjectsUpdate={setProjects} token={token} />
              </div>
              
              <div className="dashboard-card">
                <h3>Field Data</h3>
                <FieldDataManager token={token} />
              </div>
              
              <div className="dashboard-card">
                <h3>Carbon Credits</h3>
                <CarbonCreditsManager token={token} />
              </div>
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
                  📋 Summary
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
                  🔬 Advanced Analytics
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
                ) : activeBlockchainTab === 'status' ? (
                  <SystemStatus />
                ) : (
                  <LiveTelemetry />
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

function App() {
  return (
    <Web3Provider>
      <RealTimeProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </RealTimeProvider>
    </Web3Provider>
  );
}

export default App;
