import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useNotification } from './NotificationSystem';
import './AdvancedAnalytics.css';

const AdvancedAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    carbonCredits: [],
    projectTypes: [],
    monthlyData: [],
    tokenMetrics: [],
    performanceData: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { showSuccess, showError } = useNotification();

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Generate sample data for demonstration
      const carbonCredits = [
        { month: 'Jan', issued: 1200, retired: 800, traded: 400 },
        { month: 'Feb', issued: 1800, retired: 1200, traded: 600 },
        { month: 'Mar', issued: 2200, retired: 1500, traded: 700 },
        { month: 'Apr', issued: 2800, retired: 1800, traded: 1000 },
        { month: 'May', issued: 3200, retired: 2000, traded: 1200 },
        { month: 'Jun', issued: 3800, retired: 2400, traded: 1400 }
      ];

      const projectTypes = [
        { name: 'Mangrove Restoration', value: 35, color: '#0088FE' },
        { name: 'Seagrass Protection', value: 25, color: '#00C49F' },
        { name: 'Salt Marsh Conservation', value: 20, color: '#FFBB28' },
        { name: 'Kelp Forest Cultivation', value: 15, color: '#FF8042' },
        { name: 'Coastal Wetlands', value: 5, color: '#8884d8' }
      ];

      const monthlyData = [
        { month: 'Jan', projects: 12, credits: 15000, value: 750000 },
        { month: 'Feb', projects: 18, credits: 22000, value: 1100000 },
        { month: 'Mar', projects: 25, credits: 30000, value: 1500000 },
        { month: 'Apr', projects: 32, credits: 38000, value: 1900000 },
        { month: 'May', projects: 40, credits: 45000, value: 2250000 },
        { month: 'Jun', projects: 48, credits: 52000, value: 2600000 }
      ];

      const tokenMetrics = [
        { metric: 'Total Supply', value: '1,000,000 BCR', change: '+12.5%' },
        { metric: 'Circulating Supply', value: '750,000 BCR', change: '+8.3%' },
        { metric: 'Market Cap', value: '$37.5M', change: '+15.2%' },
        { metric: 'Trading Volume (24h)', value: '$2.1M', change: '+25.8%' }
      ];

      const performanceData = [
        { time: '00:00', price: 50, volume: 1200 },
        { time: '04:00', price: 52, volume: 1800 },
        { time: '08:00', price: 48, volume: 2200 },
        { time: '12:00', price: 55, volume: 1900 },
        { time: '16:00', price: 58, volume: 2400 },
        { time: '20:00', price: 53, volume: 2000 }
      ];

      setAnalyticsData({
        carbonCredits,
        projectTypes,
        monthlyData,
        tokenMetrics,
        performanceData
      });

      showSuccess('Analytics data loaded successfully');
    } catch (error) {
      console.error('Error fetching analytics:', error);
      showError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const exportData = () => {
    try {
      const dataStr = JSON.stringify(analyticsData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `blue-carbon-analytics-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showSuccess('Analytics data exported successfully');
    } catch (error) {
      showError('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="analytics-overview">
      <div className="metrics-grid">
        {analyticsData.tokenMetrics.map((metric, index) => (
          <div key={index} className="metric-card">
            <h3>{metric.metric}</h3>
            <div className="metric-value">{metric.value}</div>
            <div className={`metric-change ${metric.change.includes('+') ? 'positive' : 'negative'}`}>
              {metric.change}
            </div>
          </div>
        ))}
      </div>
      
      <div className="charts-row">
        <div className="chart-container">
          <h3>Carbon Credits Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.carbonCredits}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="issued" stackId="1" stroke="#8884d8" fill="#8884d8" />
              <Area type="monotone" dataKey="retired" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
              <Area type="monotone" dataKey="traded" stackId="1" stroke="#ffc658" fill="#ffc658" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-container">
          <h3>Project Types Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.projectTypes}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analyticsData.projectTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="analytics-performance">
      <div className="chart-container full-width">
        <h3>Token Price Performance (24h)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={analyticsData.performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="price" stroke="#8884d8" strokeWidth={2} />
            <Bar yAxisId="right" dataKey="volume" fill="#82ca9d" opacity={0.6} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="chart-container full-width">
        <h3>Monthly Growth Metrics</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analyticsData.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="projects" fill="#8884d8" />
            <Bar dataKey="credits" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="analytics-reports">
      <div className="reports-header">
        <h3>Generate Reports</h3>
        <button className="export-btn" onClick={exportData}>
          📊 Export Data
        </button>
      </div>
      
      <div className="report-options">
        <div className="report-card">
          <h4>Monthly Summary</h4>
          <p>Comprehensive monthly performance report</p>
          <button className="generate-btn">Generate</button>
        </div>
        
        <div className="report-card">
          <h4>Project Analysis</h4>
          <p>Detailed project-wise analytics report</p>
          <button className="generate-btn">Generate</button>
        </div>
        
        <div className="report-card">
          <h4>Token Metrics</h4>
          <p>Token performance and market analysis</p>
          <button className="generate-btn">Generate</button>
        </div>
        
        <div className="report-card">
          <h4>Environmental Impact</h4>
          <p>Carbon sequestration and environmental metrics</p>
          <button className="generate-btn">Generate</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="advanced-analytics">
      <div className="analytics-header">
        <h2>🔍 Advanced Analytics</h2>
        <div className="analytics-tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            Performance
          </button>
          <button 
            className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </button>
        </div>
      </div>
      
      <div className="analytics-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'performance' && renderPerformance()}
        {activeTab === 'reports' && renderReports()}
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
