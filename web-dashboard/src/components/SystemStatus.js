import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import './SystemStatus.css';

const SystemStatus = () => {
  const { isConnected, account, contracts } = useWeb3();
  const [systemHealth, setSystemHealth] = useState({
    backend: { status: 'checking', message: 'Checking connection...' },
    blockchain: { status: 'checking', message: 'Checking Web3 connection...' },
    database: { status: 'checking', message: 'Checking database...' },
    smartContracts: { status: 'checking', message: 'Checking contracts...' }
  });
  
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalCredits: 0,
    totalUsers: 0,
    systemUptime: '0:00:00'
  });

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    checkBlockchainHealth();
  }, [isConnected, account, contracts]);

  const checkSystemHealth = async () => {
    // Check Backend Health
    try {
      const response = await fetch('http://localhost:5000/health');
      if (response.ok) {
        setSystemHealth(prev => ({
          ...prev,
          backend: { status: 'healthy', message: 'Backend API operational' }
        }));
      } else {
        setSystemHealth(prev => ({
          ...prev,
          backend: { status: 'error', message: 'Backend API error' }
        }));
      }
    } catch (error) {
      setSystemHealth(prev => ({
        ...prev,
        backend: { status: 'error', message: 'Backend API unreachable' }
      }));
    }

    // Check Database Health
    try {
      const response = await fetch('http://localhost:5000/projects');
      if (response.ok) {
        const projects = await response.json();
        setSystemHealth(prev => ({
          ...prev,
          database: { status: 'healthy', message: 'Database operational' }
        }));
        setStats(prev => ({ ...prev, totalProjects: projects.length }));
      } else {
        setSystemHealth(prev => ({
          ...prev,
          database: { status: 'warning', message: 'Database connection issues' }
        }));
      }
    } catch (error) {
      setSystemHealth(prev => ({
        ...prev,
        database: { status: 'error', message: 'Database unreachable' }
      }));
    }

    // Update system uptime (mock)
    const startTime = Date.now() - (Math.random() * 86400000); // Random uptime up to 24 hours
    const uptime = Date.now() - startTime;
    const hours = Math.floor(uptime / 3600000);
    const minutes = Math.floor((uptime % 3600000) / 60000);
    const seconds = Math.floor((uptime % 60000) / 1000);
    setStats(prev => ({ 
      ...prev, 
      systemUptime: `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
      totalCredits: 15420,
      totalUsers: 42
    }));
  };

  const checkBlockchainHealth = () => {
    if (isConnected && account) {
      if (contracts && Object.keys(contracts).length > 0) {
        setSystemHealth(prev => ({
          ...prev,
          blockchain: { status: 'healthy', message: `Connected to ${account.slice(0, 6)}...${account.slice(-4)}` },
          smartContracts: { status: 'healthy', message: 'Smart contracts loaded' }
        }));
      } else {
        setSystemHealth(prev => ({
          ...prev,
          blockchain: { status: 'healthy', message: `Connected to ${account.slice(0, 6)}...${account.slice(-4)}` },
          smartContracts: { status: 'warning', message: 'Contracts not deployed' }
        }));
      }
    } else {
      setSystemHealth(prev => ({
        ...prev,
        blockchain: { status: 'warning', message: 'Wallet not connected' },
        smartContracts: { status: 'warning', message: 'Wallet not connected' }
      }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'checking': return '🔄';
      default: return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return '#48bb78';
      case 'warning': return '#ed8936';
      case 'error': return '#e53e3e';
      case 'checking': return '#667eea';
      default: return '#718096';
    }
  };

  const restartService = (service) => {
    alert(`Restart ${service} service requested. This would typically trigger a service restart.`);
  };

  const deployContracts = () => {
    alert('Contract deployment initiated. This would redirect to the deployment tab.');
  };

  return (
    <div className="system-status">
      <h2>⚙️ System Status Dashboard</h2>
      
      {/* System Overview Stats */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">🏗️</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalProjects}</div>
            <div className="stat-label">Total Projects</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🌱</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalCredits.toLocaleString()}</div>
            <div className="stat-label">Carbon Credits</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalUsers}</div>
            <div className="stat-label">Active Users</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-number">{stats.systemUptime}</div>
            <div className="stat-label">System Uptime</div>
          </div>
        </div>
      </div>

      {/* Service Health Status */}
      <div className="health-grid">
        <div className="health-section">
          <h3>🖥️ Backend Services</h3>
          
          <div className="service-item">
            <div className="service-info">
              <div className="service-icon">{getStatusIcon(systemHealth.backend.status)}</div>
              <div className="service-details">
                <div className="service-name">Flask API Server</div>
                <div className="service-description">RESTful API for project management</div>
              </div>
            </div>
            <div className="service-status" style={{ color: getStatusColor(systemHealth.backend.status) }}>
              {systemHealth.backend.message}
            </div>
            <div className="service-actions">
              <button onClick={() => restartService('Backend API')}>🔄 Restart</button>
            </div>
          </div>

          <div className="service-item">
            <div className="service-info">
              <div className="service-icon">{getStatusIcon(systemHealth.database.status)}</div>
              <div className="service-details">
                <div className="service-name">SQLite Database</div>
                <div className="service-description">Project and user data storage</div>
              </div>
            </div>
            <div className="service-status" style={{ color: getStatusColor(systemHealth.database.status) }}>
              {systemHealth.database.message}
            </div>
            <div className="service-actions">
              <button onClick={() => restartService('Database')}>🔄 Restart</button>
            </div>
          </div>
        </div>

        <div className="health-section">
          <h3>⛓️ Blockchain Services</h3>
          
          <div className="service-item">
            <div className="service-info">
              <div className="service-icon">{getStatusIcon(systemHealth.blockchain.status)}</div>
              <div className="service-details">
                <div className="service-name">Web3 Connection</div>
                <div className="service-description">MetaMask wallet integration</div>
              </div>
            </div>
            <div className="service-status" style={{ color: getStatusColor(systemHealth.blockchain.status) }}>
              {systemHealth.blockchain.message}
            </div>
            <div className="service-actions">
              {!isConnected && <button onClick={() => window.location.reload()}>🔗 Connect</button>}
            </div>
          </div>

          <div className="service-item">
            <div className="service-info">
              <div className="service-icon">{getStatusIcon(systemHealth.smartContracts.status)}</div>
              <div className="service-details">
                <div className="service-name">Smart Contracts</div>
                <div className="service-description">Blockchain contract deployment</div>
              </div>
            </div>
            <div className="service-status" style={{ color: getStatusColor(systemHealth.smartContracts.status) }}>
              {systemHealth.smartContracts.message}
            </div>
            <div className="service-actions">
              {systemHealth.smartContracts.status === 'warning' && (
                <button onClick={deployContracts}>🚀 Deploy</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Network Information */}
      <div className="network-info">
        <h3>🌐 Network Information</h3>
        <div className="network-grid">
          <div className="network-item">
            <span className="network-label">Frontend URL:</span>
            <span className="network-value">http://localhost:3000</span>
          </div>
          <div className="network-item">
            <span className="network-label">Backend URL:</span>
            <span className="network-value">http://localhost:5000</span>
          </div>
          <div className="network-item">
            <span className="network-label">Blockchain Network:</span>
            <span className="network-value">Mumbai Testnet (Chain ID: 80001)</span>
          </div>
          <div className="network-item">
            <span className="network-label">Environment:</span>
            <span className="network-value">Development</span>
          </div>
        </div>
      </div>

      {/* System Logs Preview */}
      <div className="logs-preview">
        <h3>📋 Recent System Logs</h3>
        <div className="logs-container">
          <div className="log-entry info">
            <span className="log-time">{new Date().toLocaleTimeString()}</span>
            <span className="log-level">INFO</span>
            <span className="log-message">System health check completed</span>
          </div>
          <div className="log-entry success">
            <span className="log-time">{new Date(Date.now() - 60000).toLocaleTimeString()}</span>
            <span className="log-level">SUCCESS</span>
            <span className="log-message">Backend API connection established</span>
          </div>
          <div className="log-entry info">
            <span className="log-time">{new Date(Date.now() - 120000).toLocaleTimeString()}</span>
            <span className="log-level">INFO</span>
            <span className="log-message">Web3 context initialized</span>
          </div>
          <div className="log-entry warning">
            <span className="log-time">{new Date(Date.now() - 180000).toLocaleTimeString()}</span>
            <span className="log-level">WARN</span>
            <span className="log-message">Smart contracts not deployed to testnet</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
