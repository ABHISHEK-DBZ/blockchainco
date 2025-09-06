import React, { useEffect, useState } from 'react';
import MapWrapper from './MapWrapper';

const LiveTelemetry = () => {
  const [gps, setGps] = useState([]); // {device_id, project_id, lat, lon, ts}
  const [photos, setPhotos] = useState([]); // {device_id, project_id, lat, lon, photo_ipfs, ts}

  useEffect(() => {
    const es = new EventSource('http://localhost:5000/sse');
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
    es.onerror = () => { try { es.close(); } catch {} };
    return () => { try { es.close(); } catch {} };
  }, []);

  const last = gps.find(g => g.lat && g.lon);
  const center = last ? [parseFloat(last.lat), parseFloat(last.lon)] : [20, 78];

  const gpsMarkers = gps.filter(g => g.lat && g.lon).slice(0, 50).map((g, i) => ({
    position: [parseFloat(g.lat), parseFloat(g.lon)],
    popup: `Device: ${g.device_id || 'n/a'}<br/>Project: ${g.project_id || 'n/a'}<br/>Time: ${g.ts}`
  }));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div>
        <h3>Live GPS</h3>
        <MapWrapper 
          center={center} 
          zoom={6} 
          markers={gpsMarkers}
          style={{ height: '400px', width: '100%' }}
        />
      </div>
      <div>
        <h3>Live Photos</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {photos.map((p, idx) => (
            <a key={idx} href={`https://ipfs.io/ipfs/${p.photo_ipfs}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#333' }}>
              <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
                {p.photo_ipfs ? (
                  <img alt="drone" src={`https://ipfs.io/ipfs/${p.photo_ipfs}`} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                ) : (
                  <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>No image</div>
                )}
                <div style={{ padding: 8, fontSize: 12 }}>
                  <div><strong>Device:</strong> {p.device_id || 'n/a'}</div>
                  <div><strong>Project:</strong> {p.project_id || 'n/a'}</div>
                  <div><strong>Time:</strong> {p.ts}</div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveTelemetry;
