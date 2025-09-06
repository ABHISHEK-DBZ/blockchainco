import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from './NotificationSystem';
import apiClient from '../utils/apiClient';
import './FieldDataManager.css';

const FieldDataManager = () => {
  const [fieldData, setFieldData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDataForm, setShowDataForm] = useState(false);
  const [newData, setNewData] = useState({
    project_id: '',
    data_type: 'biomass',
    value: '',
    unit: '',
    coordinates: '',
    notes: ''
  });
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const { showSuccess, showError } = useNotification();

  const dataTypes = {
    biomass: { label: 'Biomass', unit: 'tons/hectare', icon: '🌱' },
    carbon_sequestration: { label: 'Carbon Sequestration', unit: 'tons CO2/year', icon: '🌿' },
    water_quality: { label: 'Water Quality', unit: 'pH level', icon: '💧' },
    biodiversity_index: { label: 'Biodiversity Index', unit: 'species count', icon: '🐟' },
    soil_organic_carbon: { label: 'Soil Organic Carbon', unit: '% organic matter', icon: '🌍' },
    temperature: { label: 'Temperature', unit: '°C', icon: '🌡️' },
    salinity: { label: 'Salinity', unit: 'ppt', icon: '🧂' },
    turbidity: { label: 'Turbidity', unit: 'NTU', icon: '🌊' }
  };

  const fetchData = useCallback(async () => {
    try {
      const [fieldDataResult, projectsResult] = await Promise.all([
        apiClient.get('/api/field-data'),
        // Use alias to avoid path mismatches (/projects -> /api/projects)
        apiClient.get('/projects')
      ]);

      setFieldData(fieldDataResult.field_data || []);
      setProjects(projectsResult.projects || []);
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

  const handleSubmitData = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/field-data', {
        ...newData,
        project_id: parseInt(newData.project_id),
        value: parseFloat(newData.value)
      });

      showSuccess('Field data recorded successfully!');
      setShowDataForm(false);
      setNewData({
        project_id: '',
        data_type: 'biomass',
        value: '',
        unit: '',
        coordinates: '',
        notes: ''
      });
      fetchData();
    } catch (error) {
      showError('Error recording field data');
      console.error('Error recording data:', error);
    }
  };

  const handleDataTypeChange = (dataType) => {
    setNewData({
      ...newData,
      data_type: dataType,
      unit: dataTypes[dataType].unit
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatValue = (value, unit) => {
    return `${parseFloat(value).toFixed(2)} ${unit}`;
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  const getDataTypeStats = () => {
    const stats = {};
    fieldData.forEach(data => {
      if (!stats[data.data_type]) {
        stats[data.data_type] = { count: 0, total: 0, latest: null };
      }
      stats[data.data_type].count++;
      stats[data.data_type].total += data.value;
      if (!stats[data.data_type].latest || new Date(data.collected_date) > new Date(stats[data.data_type].latest)) {
        stats[data.data_type].latest = data.collected_date;
      }
    });
    return stats;
  };

  const dataStats = getDataTypeStats();

  const filteredFieldData = fieldData.filter((d) => {
    const projectOk = selectedProjectFilter
      ? parseInt(selectedProjectFilter) === d.project_id
      : true;
    const typeOk = selectedTypeFilter
      ? selectedTypeFilter === d.data_type
      : true;
    return projectOk && typeOk;
  });

  if (loading) {
    return (
      <div className="field-manager loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading field data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="field-manager">
      <div className="field-header">
        <div className="header-content">
          <h2>Field Data Collection</h2>
          <p>Monitor and record environmental data from blue carbon sites</p>
        </div>
        <button 
          className="record-data-btn"
          onClick={() => setShowDataForm(true)}
        >
          <span>📊</span>
          Record Data
        </button>
      </div>

      {/* Data Type Overview */}
      <div className="data-overview">
        <h3>Data Collection Overview</h3>
        <div className="data-types-grid">
          {Object.entries(dataTypes).map(([type, config]) => (
            <div key={type} className="data-type-card">
              <div className="card-icon">{config.icon}</div>
              <div className="card-content">
                <h4>{config.label}</h4>
                <div className="stats">
                  <span className="count">
                    {dataStats[type]?.count || 0} records
                  </span>
                  {dataStats[type] && (
                    <span className="average">
                      Avg: {(dataStats[type].total / dataStats[type].count).toFixed(2)} {config.unit}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showDataForm && (
        <div className="modal-overlay">
          <div className="data-form-modal">
            <div className="modal-header">
              <h3>Record Field Data</h3>
              <button 
                className="close-btn"
                onClick={() => setShowDataForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitData} className="data-form">
              <div className="form-group">
                <label>Project</label>
                <select
                  value={newData.project_id}
                  onChange={(e) => setNewData({...newData, project_id: e.target.value})}
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

              <div className="form-group">
                <label>Data Type</label>
                <div className="data-type-selector">
                  {Object.entries(dataTypes).map(([type, config]) => (
                    <button
                      key={type}
                      type="button"
                      className={`data-type-option ${newData.data_type === type ? 'selected' : ''}`}
                      onClick={() => handleDataTypeChange(type)}
                    >
                      <span className="type-icon">{config.icon}</span>
                      <span className="type-label">{config.label}</span>
                      <span className="type-unit">{config.unit}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Value</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newData.value}
                    onChange={(e) => setNewData({...newData, value: e.target.value})}
                    required
                    placeholder="Enter measurement value"
                  />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <input
                    type="text"
                    value={newData.unit || (dataTypes[newData.data_type]?.unit || '')}
                    onChange={(e) => setNewData({...newData, unit: e.target.value})}
                    required
                    placeholder="Measurement unit"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>GPS Coordinates (optional)</label>
                <input
                  type="text"
                  value={newData.coordinates}
                  onChange={(e) => setNewData({...newData, coordinates: e.target.value})}
                  placeholder="e.g., 40.7128, -74.0060"
                />
              </div>

              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea
                  value={newData.notes}
                  onChange={(e) => setNewData({...newData, notes: e.target.value})}
                  placeholder="Additional observations or notes..."
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowDataForm(false)}>
                  Cancel
                </button>
                <button type="submit">Record Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recent Data */}
      <div className="recent-data">
        <div className="section-header">
          <h3>Recent Field Data</h3>
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
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
            >
              <option value="">All Data Types</option>
              {Object.entries(dataTypes).map(([type, config]) => (
                <option key={type} value={type}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="data-grid">
          {filteredFieldData.map((data) => (
            <div key={data.id} className="data-card">
              <div className="card-header">
                <div className="data-type-info">
                  <span className="type-icon">
                    {dataTypes[data.data_type]?.icon || '📊'}
                  </span>
                  <div>
                    <h4>{dataTypes[data.data_type]?.label || data.data_type}</h4>
                    <p>{getProjectName(data.project_id)}</p>
                  </div>
                </div>
                <div className="data-value">
                  <span className="value">{formatValue(data.value, data.unit)}</span>
                </div>
              </div>
              
              <div className="card-details">
                <div className="detail-item">
                  <span className="label">📅 Collected:</span>
                  <span className="value">{formatDate(data.collected_date)}</span>
                </div>
                {data.coordinates && (
                  <div className="detail-item">
                    <span className="label">📍 Location:</span>
                    <span className="value">{data.coordinates}</span>
                  </div>
                )}
                {data.notes && (
                  <div className="detail-item notes">
                    <span className="label">📝 Notes:</span>
                    <span className="value">{data.notes}</span>
                  </div>
                )}
              </div>

              <div className="card-actions">
                <button className="action-btn view-btn" title="View Details">
                  👁️ View
                </button>
                <button className="action-btn edit-btn" title="Edit Data">
                  ✏️ Edit
                </button>
                <button className="action-btn export-btn" title="Export Data">
                  📤 Export
                </button>
              </div>
            </div>
          ))}
        </div>

        {fieldData.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No Field Data Recorded</h3>
            <p>Start collecting environmental data from your blue carbon projects.</p>
            <button 
              className="record-data-btn"
              onClick={() => setShowDataForm(true)}
            >
              <span>📊</span>
              Record First Data Point
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldDataManager;
