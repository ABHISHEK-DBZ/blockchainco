import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from './NotificationSystem';
import apiClient from '../utils/apiClient';
import './CarbonCreditsManager.css';

const CarbonCreditsManager = () => {
  const [credits, setCredits] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [newCredit, setNewCredit] = useState({
    project_id: '',
    amount: '',
    price_per_credit: '50.0',
    verified: false
  });
  const { showSuccess, showError } = useNotification();

  const fetchData = useCallback(async () => {
    try {
      const [creditsData, projectsData] = await Promise.all([
        apiClient.get('/api/carbon-credits'),
        // Use alias to avoid path mismatches (/projects -> /api/projects)
        apiClient.get('/projects')
      ]);

      setCredits(creditsData.carbon_credits || []);
      setProjects(projectsData.projects || []);
    } catch (error) {
      showError('Failed to fetch data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleIssueCredits = async (e) => {
    e.preventDefault();
    try {
      const result = await apiClient.post('/api/carbon-credits', {
        ...newCredit,
        amount: parseFloat(newCredit.amount),
        price_per_credit: parseFloat(newCredit.price_per_credit),
        project_id: parseInt(newCredit.project_id)
      });

      showSuccess(`Carbon credits issued successfully! ${result.blockchain_hash ? 'Blockchain hash: ' + result.blockchain_hash : ''}`);
      setShowIssueForm(false);
      setNewCredit({
        project_id: '',
        amount: '',
        price_per_credit: '50.0',
        verified: false
      });
      fetchData();
    } catch (error) {
      showError('Error issuing carbon credits');
      console.error('Error issuing credits:', error);
    }
  };

  const getTotalValue = () => {
    return credits.reduce((total, credit) => total + (credit.amount * credit.price_per_credit), 0);
  };

  const getTotalCredits = () => {
    return credits.reduce((total, credit) => total + credit.amount, 0);
  };

  const getVerifiedCredits = () => {
    return credits.filter(credit => credit.verified).reduce((total, credit) => total + credit.amount, 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const openBlockchainTx = async (hash) => {
    try {
      // Try to open a generic explorer (user can change network accordingly)
      const url = `https://mumbai.polygonscan.com/tx/${hash}`;
      window.open(url, '_blank', 'noopener');
    } catch (e) {
      try {
        await navigator.clipboard.writeText(hash);
        showSuccess('Transaction hash copied to clipboard');
      } catch (_) {
        // ignore
      }
    }
  };

  const handleTransfer = (credit) => {
    showError('Transfer UI not implemented yet');
    console.log('Transfer requested for credit:', credit);
  };

  const filteredCredits = credits.filter((credit) => {
    const projectOk = selectedProjectFilter
      ? parseInt(selectedProjectFilter) === credit.project_id
      : true;
    const statusOk = selectedStatusFilter
      ? (selectedStatusFilter === 'verified' ? credit.verified : !credit.verified)
      : true;
    return projectOk && statusOk;
  });

  if (loading) {
    return (
      <div className="credits-manager loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading carbon credits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="credits-manager">
      <div className="credits-header">
        <div className="header-content">
          <h2>Carbon Credits Management</h2>
          <p>Issue and track carbon credits for blue carbon projects</p>
        </div>
        <button 
          className="issue-credits-btn"
          onClick={() => setShowIssueForm(true)}
        >
          <span>💳</span>
          Issue Credits
        </button>
      </div>

      {/* Summary Cards */}
      <div className="credits-summary">
        <div className="summary-card">
          <div className="card-icon">💳</div>
          <div className="card-content">
            <h3>{formatNumber(getTotalCredits())}</h3>
            <p>Total Credits Issued</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <h3>{formatNumber(getVerifiedCredits())}</h3>
            <p>Verified Credits</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>{formatCurrency(getTotalValue())}</h3>
            <p>Total Market Value</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">🌱</div>
          <div className="card-content">
            <h3>{projects.length}</h3>
            <p>Active Projects</p>
          </div>
        </div>
      </div>

      {showIssueForm && (
        <div className="modal-overlay">
          <div className="issue-credits-modal">
            <div className="modal-header">
              <h3>Issue Carbon Credits</h3>
              <button 
                className="close-btn"
                onClick={() => setShowIssueForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleIssueCredits} className="credits-form">
              <div className="form-group">
                <label>Project</label>
                <select
                  value={newCredit.project_id}
                  onChange={(e) => setNewCredit({...newCredit, project_id: e.target.value})}
                  required
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} - {project.location}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Amount of Credits</label>
                  <input
                    type="number"
                    min="1"
                    value={newCredit.amount}
                    onChange={(e) => setNewCredit({...newCredit, amount: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Price per Credit ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newCredit.price_per_credit}
                    onChange={(e) => setNewCredit({...newCredit, price_per_credit: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newCredit.verified}
                    onChange={(e) => setNewCredit({...newCredit, verified: e.target.checked})}
                  />
                  <span className="checkmark"></span>
                  Issue as verified credits (with blockchain certification)
                </label>
              </div>
              {newCredit.amount && newCredit.price_per_credit && (
                <div className="total-value">
                  <strong>Total Value: {formatCurrency(newCredit.amount * newCredit.price_per_credit)}</strong>
                </div>
              )}
              <div className="form-actions">
                <button type="button" onClick={() => setShowIssueForm(false)}>
                  Cancel
                </button>
                <button type="submit">Issue Credits</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credits List */}
      <div className="credits-list">
        <div className="list-header">
          <h3>Issued Carbon Credits</h3>
          <div className="filters">
            <select
              className="filter-select"
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <select
              className="filter-select"
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="credits-table">
          <div className="table-header">
            <div className="header-cell">Project</div>
            <div className="header-cell">Credits</div>
            <div className="header-cell">Price/Credit</div>
            <div className="header-cell">Total Value</div>
            <div className="header-cell">Status</div>
            <div className="header-cell">Issue Date</div>
            <div className="header-cell">Actions</div>
          </div>

          {filteredCredits.map((credit) => (
            <div key={credit.id} className="table-row">
              <div className="cell project-cell">
                <div className="project-name">{credit.project_name}</div>
                <div className="project-id">ID: {credit.project_id}</div>
              </div>
              <div className="cell credits-cell">
                <span className="credits-amount">{formatNumber(credit.amount)}</span>
                <span className="credits-unit">credits</span>
              </div>
              <div className="cell price-cell">
                {formatCurrency(credit.price_per_credit)}
              </div>
              <div className="cell value-cell">
                {formatCurrency(credit.amount * credit.price_per_credit)}
              </div>
              <div className="cell status-cell">
                <span className={`status-badge ${credit.verified ? 'verified' : 'pending'}`}>
                  {credit.verified ? '✅ Verified' : '⏳ Pending'}
                </span>
              </div>
              <div className="cell date-cell">
                {formatDate(credit.issued_date)}
              </div>
              <div className="cell actions-cell">
                <button
                  className="action-btn view-btn"
                  title="View Details"
                  onClick={() => setSelectedCredit(credit)}
                >
                  👁️
                </button>
                {credit.blockchain_hash && (
                  <button className="action-btn blockchain-btn" title="View on Blockchain" onClick={() => openBlockchainTx(credit.blockchain_hash)}>
                    🔗
                  </button>
                )}
                <button className="action-btn transfer-btn" title="Transfer Credits" onClick={() => handleTransfer(credit)}>
                  📤
                </button>
              </div>
            </div>
          ))}
        </div>

        {credits.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">💳</div>
            <h3>No Carbon Credits Issued</h3>
            <p>Start by issuing carbon credits for your blue carbon projects.</p>
            <button 
              className="issue-credits-btn"
              onClick={() => setShowIssueForm(true)}
            >
              <span>💳</span>
              Issue First Credits
            </button>
          </div>
        )}
      </div>

      {selectedCredit && (
        <div className="modal-overlay" onClick={() => setSelectedCredit(null)}>
          <div className="issue-credits-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Credit Details</h3>
              <button className="close-btn" onClick={() => setSelectedCredit(null)}>×</button>
            </div>
            <div className="credits-form">
              <div className="form-group">
                <label>Project</label>
                <div className="total-value" style={{textAlign:'left'}}>
                  <strong>{selectedCredit.project_name}</strong> <span style={{opacity:0.8}}> (ID: {selectedCredit.project_id})</span>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Amount</label>
                  <div className="total-value">{formatNumber(selectedCredit.amount)} credits</div>
                </div>
                <div className="form-group">
                  <label>Price per Credit</label>
                  <div className="total-value">{formatCurrency(selectedCredit.price_per_credit)}</div>
                </div>
              </div>
              <div className="form-group">
                <label>Total Value</label>
                <div className="total-value">{formatCurrency(selectedCredit.amount * selectedCredit.price_per_credit)}</div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <div className="total-value">{selectedCredit.verified ? '✅ Verified' : '⏳ Pending'}</div>
                </div>
                <div className="form-group">
                  <label>Issued Date</label>
                  <div className="total-value">{formatDate(selectedCredit.issued_date)}</div>
                </div>
              </div>
              {selectedCredit.blockchain_hash && (
                <div className="form-group">
                  <label>Blockchain Hash</label>
                  <div className="total-value" style={{wordBreak:'break-all'}}>{selectedCredit.blockchain_hash}</div>
                </div>
              )}
              <div className="form-actions">
                <button type="button" onClick={() => setSelectedCredit(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarbonCreditsManager;
