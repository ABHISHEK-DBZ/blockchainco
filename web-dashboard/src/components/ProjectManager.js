import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from './NotificationSystem';
import apiClient from '../utils/apiClient';
import './ProjectManager.css';

const ProjectManager = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    location: '',
    latitude: '',
    longitude: '',
    area_hectares: '',
    ecosystem_type: 'mangrove',
    status: 'planning'
  });
  const [editProject, setEditProject] = useState(null);
  const [issueForm, setIssueForm] = useState({ amount: '', price_per_credit: '50.0', verified: false });
  const { showSuccess, showError } = useNotification();

  const fetchProjects = useCallback(async () => {
    try {
  // Use alias /projects for GET to match backend alias and avoid path mismatches
  const data = await apiClient.get('/projects');
      setProjects(data.projects || []);
    } catch (error) {
      showError('Failed to fetch projects');
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/projects', {
        ...newProject,
        area_hectares: parseFloat(newProject.area_hectares),
        latitude: newProject.latitude ? parseFloat(newProject.latitude) : null,
        longitude: newProject.longitude ? parseFloat(newProject.longitude) : null,
      });

      showSuccess('Project created successfully!');
      setShowCreateForm(false);
      setNewProject({
        name: '',
        description: '',
        location: '',
        latitude: '',
        longitude: '',
        area_hectares: '',
        ecosystem_type: 'mangrove',
        status: 'planning'
      });
      fetchProjects();
    } catch (error) {
      showError('Error creating project');
      console.error('Error creating project:', error);
    }
  };

  const openView = (project) => {
    setSelectedProject(project);
    setShowViewModal(true);
  };

  const openEdit = (project) => {
    setEditProject({ ...project });
    setShowEditModal(true);
  };

  const openIssue = (project) => {
    setSelectedProject(project);
    setIssueForm({ amount: '', price_per_credit: '50.0', verified: false });
    setShowIssueModal(true);
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: editProject.name,
        description: editProject.description,
        location: editProject.location,
        latitude: editProject.latitude !== null && editProject.latitude !== '' ? parseFloat(editProject.latitude) : null,
        longitude: editProject.longitude !== null && editProject.longitude !== '' ? parseFloat(editProject.longitude) : null,
        area_hectares: parseFloat(editProject.area_hectares),
        ecosystem_type: editProject.ecosystem_type,
        status: editProject.status,
        carbon_sequestration: editProject.carbon_sequestration !== undefined && editProject.carbon_sequestration !== '' ? parseFloat(editProject.carbon_sequestration) : undefined
      };
      // Remove undefined values so we don't overwrite unintentionally
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

      await apiClient.put(`/api/projects/${editProject.id}`, payload);
      showSuccess('Project updated');
      setShowEditModal(false);
      setEditProject(null);
      fetchProjects();
    } catch (error) {
      showError('Error updating project');
      console.error('Error updating project:', error);
    }
  };

  const handleIssueCredits = async (e) => {
    e.preventDefault();
    try {
      const body = {
        project_id: selectedProject.id,
        amount: parseFloat(issueForm.amount),
        price_per_credit: parseFloat(issueForm.price_per_credit),
        verified: !!issueForm.verified
      };
      await apiClient.post('/api/carbon-credits', body);
      showSuccess('Credits issued');
      setShowIssueModal(false);
    } catch (error) {
      showError('Error issuing credits');
      console.error('Error issuing credits:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'planning': return '#FFA500';
      case 'implementation': return '#4CAF50';
      case 'monitoring': return '#2196F3';
      case 'completed': return '#9C27B0';
      default: return '#757575';
    }
  };

  const getEcosystemIcon = (type) => {
    switch (type) {
      case 'mangrove': return '🌿';
      case 'seagrass': return '🌱';
      case 'salt_marsh': return '🌾';
      case 'kelp_forest': return '🌊';
      default: return '🌊';
    }
  };

  if (loading) {
    return (
      <div className="project-manager loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="project-manager">
      <div className="project-header">
        <div className="header-content">
          <h2>Project Management</h2>
          <p>Manage blue carbon restoration projects</p>
        </div>
        <button 
          className="create-project-btn"
          onClick={() => setShowCreateForm(true)}
        >
          <span>+</span>
          Create Project
        </button>
      </div>

      {showCreateForm && (
        <div className="modal-overlay">
          <div className="create-project-modal">
            <div className="modal-header">
              <h3>Create New Project</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="project-form">
              <div className="form-group">
                <label>Project Name</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={newProject.location}
                    onChange={(e) => setNewProject({...newProject, location: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Area (hectares)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newProject.area_hectares}
                    onChange={(e) => setNewProject({...newProject, area_hectares: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={newProject.latitude}
                    onChange={(e) => setNewProject({...newProject, latitude: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={newProject.longitude}
                    onChange={(e) => setNewProject({...newProject, longitude: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ecosystem Type</label>
                  <select
                    value={newProject.ecosystem_type}
                    onChange={(e) => setNewProject({...newProject, ecosystem_type: e.target.value})}
                  >
                    <option value="mangrove">Mangrove</option>
                    <option value="seagrass">Seagrass</option>
                    <option value="salt_marsh">Salt Marsh</option>
                    <option value="kelp_forest">Kelp Forest</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={newProject.status}
                    onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                  >
                    <option value="planning">Planning</option>
                    <option value="implementation">Implementation</option>
                    <option value="monitoring">Monitoring</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="projects-grid">
        {projects.map((project) => (
          <div key={project.id} className="project-card">
            <div className="project-header">
              <div className="project-icon">
                {getEcosystemIcon(project.ecosystem_type)}
              </div>
              <div className="project-info">
                <h3>{project.name || 'Untitled Project'}</h3>
                <p className="project-location">{project.location}</p>
              </div>
              <div 
                className="project-status"
                style={{ backgroundColor: getStatusColor(project.status) }}
              >
                {project.status}
              </div>
            </div>
            
            <div className="project-description">
              <p>{project.description || 'No description provided.'}</p>
            </div>
            
            <div className="project-metrics">
              <div className="metric">
                <span className="metric-label">Area</span>
                <span className="metric-value">{project.area_hectares} ha</span>
              </div>
              <div className="metric">
                <span className="metric-label">Carbon Sequestration</span>
                <span className="metric-value">{project.carbon_sequestration || 0} tons</span>
              </div>
              <div className="metric">
                <span className="metric-label">Ecosystem</span>
                <span className="metric-value">{project.ecosystem_type.replace('_', ' ')}</span>
              </div>
            </div>
            
            <div className="project-actions">
              <button className="action-btn view-btn" onClick={() => openView(project)}>
                <span>👁️</span>
                View Details
              </button>
              <button className="action-btn edit-btn" onClick={() => openEdit(project)}>
                <span>✏️</span>
                Edit
              </button>
              <button className="action-btn credit-btn" onClick={() => openIssue(project)}>
                <span>💳</span>
                Issue Credits
              </button>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🌊</div>
          <h3>No Projects Yet</h3>
          <p>Create your first blue carbon restoration project to get started.</p>
          <button 
            className="create-project-btn"
            onClick={() => setShowCreateForm(true)}
          >
            <span>+</span>
            Create First Project
          </button>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="create-project-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Project Details</h3>
              <button className="close-btn" onClick={() => setShowViewModal(false)}>×</button>
            </div>
            <div className="project-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <div className="metric-value">{selectedProject.name}</div>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <div className="metric-value">{selectedProject.status}</div>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <div className="project-description"><p>{selectedProject.description || 'No description provided.'}</p></div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <div className="metric-value">{selectedProject.location}</div>
                </div>
                <div className="form-group">
                  <label>Area (ha)</label>
                  <div className="metric-value">{selectedProject.area_hectares}</div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Latitude</label>
                  <div className="metric-value">{selectedProject.latitude ?? '-'}</div>
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <div className="metric-value">{selectedProject.longitude ?? '-'}</div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ecosystem</label>
                  <div className="metric-value">{selectedProject.ecosystem_type}</div>
                </div>
                <div className="form-group">
                  <label>Sequestration (t)</label>
                  <div className="metric-value">{selectedProject.carbon_sequestration ?? 0}</div>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowViewModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editProject && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="create-project-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Project</h3>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpdateProject} className="project-form">
              <div className="form-group">
                <label>Project Name</label>
                <input type="text" value={editProject.name}
                  onChange={(e) => setEditProject({ ...editProject, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} value={editProject.description || ''}
                  onChange={(e) => setEditProject({ ...editProject, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input type="text" value={editProject.location}
                    onChange={(e) => setEditProject({ ...editProject, location: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Area (hectares)</label>
                  <input type="number" step="0.1" value={editProject.area_hectares}
                    onChange={(e) => setEditProject({ ...editProject, area_hectares: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Latitude</label>
                  <input type="number" step="any" value={editProject.latitude ?? ''}
                    onChange={(e) => setEditProject({ ...editProject, latitude: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input type="number" step="any" value={editProject.longitude ?? ''}
                    onChange={(e) => setEditProject({ ...editProject, longitude: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ecosystem Type</label>
                  <select value={editProject.ecosystem_type}
                    onChange={(e) => setEditProject({ ...editProject, ecosystem_type: e.target.value })}>
                    <option value="mangrove">Mangrove</option>
                    <option value="seagrass">Seagrass</option>
                    <option value="salt_marsh">Salt Marsh</option>
                    <option value="kelp_forest">Kelp Forest</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={editProject.status}
                    onChange={(e) => setEditProject({ ...editProject, status: e.target.value })}>
                    <option value="planning">Planning</option>
                    <option value="implementation">Implementation</option>
                    <option value="monitoring">Monitoring</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Credits Modal */}
      {showIssueModal && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowIssueModal(false)}>
          <div className="create-project-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Issue Credits for {selectedProject.name}</h3>
              <button className="close-btn" onClick={() => setShowIssueModal(false)}>×</button>
            </div>
            <form onSubmit={handleIssueCredits} className="project-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Amount of Credits</label>
                  <input type="number" min="1" value={issueForm.amount}
                    onChange={(e) => setIssueForm({ ...issueForm, amount: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Price per Credit ($)</label>
                  <input type="number" step="0.01" min="0" value={issueForm.price_per_credit}
                    onChange={(e) => setIssueForm({ ...issueForm, price_per_credit: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={issueForm.verified}
                    onChange={(e) => setIssueForm({ ...issueForm, verified: e.target.checked })} />
                  <span className="checkmark"></span>
                  Issue as verified (store blockchain ref)
                </label>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowIssueModal(false)}>Cancel</button>
                <button type="submit">Issue</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
