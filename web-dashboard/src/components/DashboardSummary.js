import React, { useState, useEffect, useCallback } from 'react';
import './DashboardSummary.css';

const DashboardSummary = ({ projects, chartData }) => {
  const [summary, setSummary] = useState({
    totalProjects: 0,
    totalCredits: 0,
    totalValue: 0,
    activeContracts: 0,
    nftsCertified: 0,
    carbonSequestered: 0,
    ecosystemsRestored: 0,
    stakeholdersInvolved: 0,
    recentActivity: [],
    systemHealth: 'Excellent',
    blockchainConnected: false,
    backendConnected: false
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardSummary = useCallback(async () => {
    try {
      // Check backend connectivity
      const healthResponse = await fetch('http://localhost:5000/health');
      const backendConnected = healthResponse.ok;

      // Simulate fetching comprehensive data
      const mockSummary = {
        totalProjects: 127,
        totalCredits: 1250000,
        totalValue: 62500000, // $62.5M
        activeContracts: 15,
        nftsCertified: 89,
        carbonSequestered: 875000, // tons CO2
        ecosystemsRestored: 12500, // hectares
        stakeholdersInvolved: 450,
        recentActivity: [
          {
            id: 1,
            type: 'project_created',
            title: 'New Mangrove Project Registered',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            details: 'Florida Keys Restoration - 150 hectares'
          },
          {
            id: 2,
            type: 'nft_minted',
            title: 'Carbon Credit NFT Minted',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            details: '2,500 carbon credits tokenized'
          },
          {
            id: 3,
            type: 'contract_deployed',
            title: 'Smart Contract Deployed',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            details: 'CarbonCreditToken v2.1 on Polygon'
          },
          {
            id: 4,
            type: 'verification',
            title: 'Project Verification Complete',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            details: 'Seagrass Conservation Project verified'
          },
          {
            id: 5,
            type: 'milestone',
            title: 'Milestone Achieved',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            details: '1 Million tons CO2 sequestered!'
          }
        ],
        systemHealth: 'Excellent',
        blockchainConnected: typeof window.ethereum !== 'undefined',
        backendConnected
      };

      setSummary(mockSummary);
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      setSummary(prev => ({ ...prev, backendConnected: false }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardSummary();
    const interval = setInterval(fetchDashboardSummary, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [fetchDashboardSummary]);

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'project_created': return '🏗️';
      case 'nft_minted': return '🏆';
      case 'contract_deployed': return '🚀';
      case 'verification': return '✅';
      case 'milestone': return '🎯';
      default: return '📊';
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  if (loading) {
    return (
      <div className="dashboard-summary loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard summary...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-summary">
      <div className="summary-header">
        <h2>🌊 Blue Carbon Registry - Executive Summary</h2>
        <div className="system-status">
          <div className={`status-indicator ${summary.systemHealth.toLowerCase()}`}>
            <span className="status-dot"></span>
            System Status: {summary.systemHealth}
          </div>
          <div className="connectivity-status">
            <span className={`connection-dot ${summary.backendConnected ? 'connected' : 'disconnected'}`}></span>
            Backend: {summary.backendConnected ? 'Connected' : 'Disconnected'}
            <span className={`connection-dot ${summary.blockchainConnected ? 'connected' : 'disconnected'}`}></span>
            Blockchain: {summary.blockchainConnected ? 'Ready' : 'Not Connected'}
          </div>
        </div>
      </div>

      <div className="metrics-overview">
        <div className="metric-card primary">
          <div className="metric-icon">🏗️</div>
          <div className="metric-content">
            <h3>{formatNumber(summary.totalProjects)}</h3>
            <p>Active Projects</p>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <h3>{formatNumber(summary.totalCredits)}</h3>
            <p>Carbon Credits</p>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon">💵</div>
          <div className="metric-content">
            <h3>{formatCurrency(summary.totalValue)}</h3>
            <p>Total Value</p>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">🔗</div>
          <div className="metric-content">
            <h3>{summary.activeContracts}</h3>
            <p>Smart Contracts</p>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon">🏆</div>
          <div className="metric-content">
            <h3>{summary.nftsCertified}</h3>
            <p>NFT Certificates</p>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">🌱</div>
          <div className="metric-content">
            <h3>{formatNumber(summary.carbonSequestered)}</h3>
            <p>CO₂ Sequestered (tons)</p>
          </div>
        </div>

        <div className="metric-card primary">
          <div className="metric-icon">🌊</div>
          <div className="metric-content">
            <h3>{formatNumber(summary.ecosystemsRestored)}</h3>
            <p>Hectares Restored</p>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <h3>{summary.stakeholdersInvolved}</h3>
            <p>Stakeholders</p>
          </div>
        </div>
      </div>

      <div className="summary-sections">
        <div className="recent-activity">
          <h3>📈 Recent Activity</h3>
          <div className="activity-list">
            {summary.recentActivity.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">{getActivityIcon(activity.type)}</div>
                <div className="activity-content">
                  <h4>{activity.title}</h4>
                  <p>{activity.details}</p>
                  <span className="activity-time">{getTimeAgo(activity.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="quick-actions">
          <h3>⚡ Quick Actions</h3>
          <div className="action-grid">
            <button className="action-btn primary">
              <span>➕</span>
              Create Project
            </button>
            <button className="action-btn success">
              <span>🏆</span>
              Mint NFT
            </button>
            <button className="action-btn info">
              <span>📊</span>
              View Analytics
            </button>
            <button className="action-btn warning">
              <span>🚀</span>
              Deploy Contract
            </button>
            <button className="action-btn primary">
              <span>📥</span>
              Export Data
            </button>
            <button className="action-btn success">
              <span>🔄</span>
              Sync Blockchain
            </button>
          </div>
        </div>
      </div>

      <div className="impact-summary">
        <h3>🌍 Environmental Impact</h3>
        <div className="impact-stats">
          <div className="impact-item">
            <div className="impact-value">{formatNumber(summary.carbonSequestered)}</div>
            <div className="impact-label">Tons CO₂ Removed</div>
            <div className="impact-equivalent">≈ {formatNumber(summary.carbonSequestered * 2.2)} cars off road for 1 year</div>
          </div>
          <div className="impact-item">
            <div className="impact-value">{formatNumber(summary.ecosystemsRestored)}</div>
            <div className="impact-label">Hectares Restored</div>
            <div className="impact-equivalent">≈ {formatNumber(summary.ecosystemsRestored * 2.47)} acres of coastal habitat</div>
          </div>
          <div className="impact-item">
            <div className="impact-value">{summary.totalProjects}</div>
            <div className="impact-label">Active Projects</div>
            <div className="impact-equivalent">Across 15+ countries worldwide</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSummary;
