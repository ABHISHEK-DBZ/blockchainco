import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import './CarbonCreditAnalytics.css';

const CarbonCreditAnalytics = () => {
  const { isConnected, contracts, account } = useWeb3();
  const [analytics, setAnalytics] = useState({
    totalCredits: 0,
    totalProjects: 0,
    totalValue: 0,
    recentTransactions: [],
    monthlyData: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && contracts && account) {
      fetchAnalytics();
    }
  }, [isConnected, contracts, account]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Simulate fetching analytics data
      // In a real implementation, you would call smart contract methods
      const mockData = {
        totalCredits: 15420,
        totalProjects: 8,
        totalValue: 308400, // USD value
        recentTransactions: [
          {
            id: '0x123...abc',
            type: 'Mint',
            amount: 500,
            project: 'Mangrove Restoration #3',
            timestamp: new Date().toISOString(),
            txHash: '0x1234567890abcdef'
          },
          {
            id: '0x456...def',
            type: 'Transfer',
            amount: 250,
            project: 'Seagrass Conservation #1',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            txHash: '0xabcdef1234567890'
          },
          {
            id: '0x789...ghi',
            type: 'Mint',
            amount: 1000,
            project: 'Coastal Wetlands #2',
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            txHash: '0x567890abcdef1234'
          }
        ],
        monthlyData: [
          { month: 'Jan', credits: 2500, projects: 2 },
          { month: 'Feb', credits: 3200, projects: 3 },
          { month: 'Mar', credits: 2800, projects: 2 },
          { month: 'Apr', credits: 4100, projects: 4 },
          { month: 'May', credits: 3600, projects: 3 },
          { month: 'Jun', credits: 5200, projects: 5 }
        ]
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalytics(mockData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <div className="analytics-container">
        <div className="not-connected">
          <h3>🔗 Connect Your Wallet</h3>
          <p>Please connect your wallet to view carbon credit analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <h2>📊 Carbon Credit Analytics</h2>
      
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">🌱</div>
              <div className="metric-content">
                <h3>{analytics.totalCredits.toLocaleString()}</h3>
                <p>Total Carbon Credits</p>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">🏗️</div>
              <div className="metric-content">
                <h3>{analytics.totalProjects}</h3>
                <p>Active Projects</p>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">💰</div>
              <div className="metric-content">
                <h3>${analytics.totalValue.toLocaleString()}</h3>
                <p>Total Value (USD)</p>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">📈</div>
              <div className="metric-content">
                <h3>+23.5%</h3>
                <p>Monthly Growth</p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-section">
            <div className="chart-container">
              <h3>Monthly Carbon Credits Issued</h3>
              <div className="bar-chart">
                {analytics.monthlyData.map((data, index) => (
                  <div key={index} className="bar-item">
                    <div 
                      className="bar" 
                      style={{ height: `${(data.credits / 5200) * 100}%` }}
                    ></div>
                    <span className="bar-label">{data.month}</span>
                    <span className="bar-value">{data.credits}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="chart-container">
              <h3>Project Distribution</h3>
              <div className="pie-chart-placeholder">
                <div className="pie-segment mangrove" style={{ '--percentage': '40%' }}>
                  <span>Mangroves 40%</span>
                </div>
                <div className="pie-segment seagrass" style={{ '--percentage': '30%' }}>
                  <span>Seagrass 30%</span>
                </div>
                <div className="pie-segment wetlands" style={{ '--percentage': '30%' }}>
                  <span>Wetlands 30%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="transactions-section">
            <h3>🔄 Recent Transactions</h3>
            <div className="transactions-list">
              {analytics.recentTransactions.map((tx, index) => (
                <div key={index} className="transaction-item">
                  <div className="tx-icon">
                    {tx.type === 'Mint' ? '🌱' : '↔️'}
                  </div>
                  <div className="tx-details">
                    <div className="tx-main">
                      <span className="tx-type">{tx.type}</span>
                      <span className="tx-amount">{tx.amount} Credits</span>
                    </div>
                    <div className="tx-meta">
                      <span className="tx-project">{tx.project}</span>
                      <span className="tx-time">{formatDate(tx.timestamp)}</span>
                    </div>
                  </div>
                  <div className="tx-hash">
                    <a 
                      href={`https://mumbai.polygonscan.com/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {formatAddress(tx.txHash)}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Environmental Impact */}
          <div className="impact-section">
            <h3>🌍 Environmental Impact</h3>
            <div className="impact-grid">
              <div className="impact-item">
                <div className="impact-number">2,340</div>
                <div className="impact-label">Tons CO₂ Sequestered</div>
              </div>
              <div className="impact-item">
                <div className="impact-number">156</div>
                <div className="impact-label">Hectares Protected</div>
              </div>
              <div className="impact-item">
                <div className="impact-number">28</div>
                <div className="impact-label">Marine Species Benefited</div>
              </div>
              <div className="impact-item">
                <div className="impact-number">850</div>
                <div className="impact-label">Local Jobs Created</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CarbonCreditAnalytics;
