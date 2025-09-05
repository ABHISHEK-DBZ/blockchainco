import React, { useState, useRef } from 'react';
import { useNotification } from './NotificationSystem';
import './DataManagement.css';

const DataManagement = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const [importStats, setImportStats] = useState(null);
  const fileInputRef = useRef(null);
  const { showSuccess, showError, showInfo } = useNotification();

  // Fetch projects from backend
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
        showSuccess(`Loaded ${data.length} projects`);
      } else {
        throw new Error('Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      showError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // Export projects in various formats
  const exportProjects = async () => {
    try {
      if (projects.length === 0) {
        await fetchProjects();
      }
      
      const timestamp = new Date().toISOString().split('T')[0];
      let data, filename, mimeType;

      switch (exportFormat) {
        case 'json':
          data = JSON.stringify(projects, null, 2);
          filename = `blue-carbon-projects-${timestamp}.json`;
          mimeType = 'application/json';
          break;
          
        case 'csv':
          data = convertToCSV(projects);
          filename = `blue-carbon-projects-${timestamp}.csv`;
          mimeType = 'text/csv';
          break;
          
        case 'excel':
          data = convertToExcel(projects);
          filename = `blue-carbon-projects-${timestamp}.xlsx`;
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
          
        default:
          throw new Error('Unsupported export format');
      }

      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      
      showSuccess(`Projects exported as ${exportFormat.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      showError('Failed to export projects');
    }
  };

  // Convert projects to CSV format
  const convertToCSV = (data) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  };

  // Convert projects to Excel format (simplified)
  const convertToExcel = (data) => {
    // This is a simplified version - in production, use a library like xlsx
    return convertToCSV(data);
  };

  // Handle file import
  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        let importedData;

        if (file.name.endsWith('.json')) {
          importedData = JSON.parse(content);
        } else if (file.name.endsWith('.csv')) {
          importedData = parseCSV(content);
        } else {
          throw new Error('Unsupported file format');
        }

        processImportedData(importedData);
      } catch (error) {
        console.error('Import error:', error);
        showError('Failed to import file. Please check the format.');
      }
    };

    reader.readAsText(file);
  };

  // Parse CSV content
  const parseCSV = (content) => {
    const lines = content.split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = values[index] ? values[index].trim() : '';
      });
      return obj;
    }).filter(obj => Object.values(obj).some(value => value !== ''));
  };

  // Process imported data
  const processImportedData = async (data) => {
    try {
      setLoading(true);
      showInfo('Processing imported data...');

      // Validate data structure
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format - expected array');
      }

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const project of data) {
        try {
          // Validate required fields
          if (!project.name || !project.description) {
            throw new Error('Missing required fields (name, description)');
          }

          // Send to backend
          const response = await fetch('http://localhost:5000/projects', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(project)
          });

          if (response.ok) {
            successCount++;
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create project');
          }
        } catch (error) {
          errorCount++;
          errors.push(`Project "${project.name || 'Unknown'}": ${error.message}`);
        }
      }

      setImportStats({
        total: data.length,
        success: successCount,
        errors: errorCount,
        errorDetails: errors
      });

      if (successCount > 0) {
        showSuccess(`Successfully imported ${successCount} projects`);
        await fetchProjects(); // Refresh the list
      }

      if (errorCount > 0) {
        showError(`Failed to import ${errorCount} projects`);
      }

    } catch (error) {
      console.error('Processing error:', error);
      showError('Failed to process imported data');
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Generate sample template
  const downloadTemplate = () => {
    const template = [
      {
        name: "Sample Mangrove Project",
        description: "Restoration of coastal mangrove ecosystem",
        location: "Florida Keys, USA",
        area: 150,
        carbonCredits: 2500,
        projectType: "Mangrove Restoration",
        status: "Active",
        startDate: "2024-01-15",
        endDate: "2026-01-15"
      },
      {
        name: "Seagrass Conservation Initiative",
        description: "Protection and restoration of seagrass beds",
        location: "Chesapeake Bay, USA",
        area: 200,
        carbonCredits: 3200,
        projectType: "Seagrass Protection",
        status: "Planning",
        startDate: "2024-03-01",
        endDate: "2027-03-01"
      }
    ];

    const data = exportFormat === 'csv' ? convertToCSV(template) : JSON.stringify(template, null, 2);
    const mimeType = exportFormat === 'csv' ? 'text/csv' : 'application/json';
    const extension = exportFormat === 'csv' ? 'csv' : 'json';

    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `project-template.${extension}`;
    link.click();
    URL.revokeObjectURL(url);

    showSuccess(`Template downloaded as ${extension.toUpperCase()}`);
  };

  return (
    <div className="data-management">
      <div className="data-header">
        <h2>📊 Data Management</h2>
        <div className="header-actions">
          <button onClick={fetchProjects} disabled={loading} className="fetch-btn">
            {loading ? '🔄' : '📥'} Load Projects
          </button>
        </div>
      </div>

      <div className="management-sections">
        {/* Export Section */}
        <div className="section-card">
          <h3>📤 Export Projects</h3>
          <p>Export your project data in various formats for backup or analysis.</p>
          
          <div className="export-controls">
            <div className="format-selector">
              <label>Export Format:</label>
              <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="excel">Excel (XLSX)</option>
              </select>
            </div>
            
            <div className="export-actions">
              <button onClick={exportProjects} className="export-btn">
                📤 Export Data
              </button>
              <button onClick={downloadTemplate} className="template-btn">
                📋 Download Template
              </button>
            </div>
          </div>

          <div className="project-summary">
            <span>Projects available: {projects.length}</span>
          </div>
        </div>

        {/* Import Section */}
        <div className="section-card">
          <h3>📥 Import Projects</h3>
          <p>Import project data from JSON or CSV files. Use the template for proper formatting.</p>
          
          <div className="import-controls">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={handleFileImport}
              className="file-input"
              id="file-import"
            />
            <label htmlFor="file-import" className="file-label">
              📁 Choose File (JSON or CSV)
            </label>
          </div>

          <div className="import-guidelines">
            <h4>Import Guidelines:</h4>
            <ul>
              <li>Supported formats: JSON, CSV</li>
              <li>Required fields: name, description</li>
              <li>Use the template for proper structure</li>
              <li>Duplicate projects will be skipped</li>
            </ul>
          </div>
        </div>

        {/* Import Statistics */}
        {importStats && (
          <div className="section-card import-stats">
            <h3>📊 Import Results</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Records:</span>
                <span className="stat-value">{importStats.total}</span>
              </div>
              <div className="stat-item success">
                <span className="stat-label">Successful:</span>
                <span className="stat-value">{importStats.success}</span>
              </div>
              <div className="stat-item error">
                <span className="stat-label">Failed:</span>
                <span className="stat-value">{importStats.errors}</span>
              </div>
            </div>

            {importStats.errorDetails && importStats.errorDetails.length > 0 && (
              <div className="error-details">
                <h4>Error Details:</h4>
                <ul>
                  {importStats.errorDetails.slice(0, 5).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {importStats.errorDetails.length > 5 && (
                    <li>... and {importStats.errorDetails.length - 5} more errors</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Backup & Sync Section */}
        <div className="section-card">
          <h3>☁️ Backup & Sync</h3>
          <p>Backup your data to cloud storage or sync with external systems.</p>
          
          <div className="backup-options">
            <button className="backup-btn" disabled>
              ☁️ Backup to Cloud
              <span className="coming-soon">Coming Soon</span>
            </button>
            <button className="sync-btn" disabled>
              🔄 Sync with IPFS
              <span className="coming-soon">Coming Soon</span>
            </button>
            <button className="restore-btn" disabled>
              📥 Restore Backup
              <span className="coming-soon">Coming Soon</span>
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Processing data...</p>
        </div>
      )}
    </div>
  );
};

export default DataManagement;
