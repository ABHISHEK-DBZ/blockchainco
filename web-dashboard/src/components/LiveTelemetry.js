import React, { useEffect, useState } from 'react';
import MapWrapper from './MapWrapper';
import './LiveTelemetry.css';

const LiveTelemetry = () => {
  const [gps, setGps] = useState([]); // {device_id, project_id, lat, lon, ts}
  const [photos, setPhotos] = useState([]); // {device_id, project_id, lat, lon, photo_ipfs, ts}
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const es = new EventSource('http://localhost:5000/sse');
    
    es.onopen = () => {
      setConnected(true);
    };
    
    es.onmessage = (e) => {
      try {
        const evt = JSON.parse(e.data);
        if (evt.type === 'iot_gps') {
          setGps(prev => [evt.payload, ...prev].slice(0, 100));
        } else if (evt.type === 'iot_photo') {
          setPhotos(prev => [evt.payload, ...prev].slice(0, 50));
        }
      } catch {}
    };
    
    es.onerror = () => { 
      setConnected(false);
      try { es.close(); } catch {} 
    };
    
    return () => { 
      setConnected(false);
      try { es.close(); } catch {} 
    };
  }, []);

  const last = gps.find(g => g.lat && g.lon);
  const center = last ? [parseFloat(last.lat), parseFloat(last.lon)] : [20, 78];

  const gpsMarkers = gps.filter(g => g.lat && g.lon).slice(0, 50).map((g, i) => ({
    position: [parseFloat(g.lat), parseFloat(g.lon)],
    popup: `Device: ${g.device_id || 'n/a'}<br/>Project: ${g.project_id || 'n/a'}<br/>Time: ${g.ts}`
  }));

  return (
    <div className="live-telemetry">
      <h2>📡 Live Telemetry Dashboard</h2>
      
      {/* Connection Status */}
      <div className="telemetry-status">
        <div className="status-indicator"></div>
        <span>{connected ? 'Connected to Live Stream' : 'Connecting to Live Stream...'}</span>
      </div>

      {/* Statistics */}
      <div className="gps-stats">
        <div className="stat-card">
          <div className="stat-number">{gps.length}</div>
          <div className="stat-label">GPS Points</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{photos.length}</div>
          <div className="stat-label">Photos</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{new Set(gps.map(g => g.device_id)).size}</div>
          <div className="stat-label">Active Devices</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{new Set(gps.map(g => g.project_id)).size}</div>
          <div className="stat-label">Projects</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="telemetry-grid">
        <div className="telemetry-section gps-section">
          <h3>🗺️ Live GPS Tracking</h3>
          <div className="map-container">
            <MapWrapper 
              center={center} 
              zoom={6} 
              markers={gpsMarkers}
              style={{ height: '400px', width: '100%' }}
            />
          </div>
        </div>
        
        <div className="telemetry-section photos-section">
          <h3>📸 Live Photo Stream</h3>
          {photos.length === 0 ? (
            <div className="no-data">No photos received yet...</div>
          ) : (
            <div className="photos-grid">
              {photos.map((p, idx) => (
                <a 
                  key={idx} 
                  href={`https://ipfs.io/ipfs/${p.photo_ipfs}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="photo-card"
                >
                  {p.photo_ipfs ? (
                    <img 
                      alt="drone capture" 
                      src={`https://ipfs.io/ipfs/${p.photo_ipfs}`} 
                      className="photo-image"
                    />
                  ) : (
                    <div className="photo-placeholder">📷 No image</div>
                  )}
                  <div className="photo-info">
                    <div><strong>Device:</strong> {p.device_id || 'n/a'}</div>
                    <div><strong>Project:</strong> {p.project_id || 'n/a'}</div>
                    <div><strong>Time:</strong> {p.ts}</div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveTelemetry;
