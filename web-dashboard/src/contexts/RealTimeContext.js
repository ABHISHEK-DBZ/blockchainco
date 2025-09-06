import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const RealTimeContext = createContext();

export const useRealTime = () => {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
};

export const RealTimeProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [realtimeData, setRealtimeData] = useState({
    projects: [],
    carbonCredits: [],
    fieldData: [],
    systemStatus: {},
    notifications: []
  });
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // WebSocket connection for real-time updates
  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket('ws://localhost:5000/ws');
      
      ws.onopen = () => {
        console.log('🟢 WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        setLastUpdate(new Date());
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeUpdate(data);
          setLastUpdate(new Date());
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('🔴 WebSocket disconnected; falling back to SSE');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        connectSSE();
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionStatus('error');
        try { ws.close(); } catch {}
        connectSSE();
      };

      return ws;
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
      return null;
    }
  }, []);

  // Handle real-time data updates
  const handleRealtimeUpdate = useCallback((data) => {
    setRealtimeData(prev => {
      const updated = { ...prev };
      
      switch (data.type) {
        case 'project_created':
        case 'project_updated':
          updated.projects = updateArray(prev.projects, data.payload, 'id');
          break;
        case 'carbon_credit_issued':
          updated.carbonCredits = updateArray(prev.carbonCredits, data.payload, 'id');
          break;
        case 'field_data_added':
          updated.fieldData = updateArray(prev.fieldData, data.payload, 'id');
          break;
        case 'system_status_update':
          updated.systemStatus = { ...prev.systemStatus, ...data.payload };
          break;
        case 'notification':
          updated.notifications = [data.payload, ...prev.notifications.slice(0, 49)]; // Keep last 50
          break;
        case 'bulk_update':
          return { ...prev, ...data.payload };
        default:
          console.warn('Unknown real-time update type:', data.type);
      }
      
      return updated;
    });
  }, []);

  // Update array with new/updated item
  const updateArray = (array, newItem, idField) => {
    const existingIndex = array.findIndex(item => item[idField] === newItem[idField]);
    if (existingIndex >= 0) {
      // Update existing item
      const updated = [...array];
      updated[existingIndex] = { ...updated[existingIndex], ...newItem };
      return updated;
    } else {
      // Add new item
      return [newItem, ...array];
    }
  };

  // Server-Sent Events fallback
  const connectSSE = useCallback(() => {
    try {
      const eventSource = new EventSource('http://localhost:5000/sse');
      
      eventSource.onopen = () => {
        console.log('🟢 SSE connected');
        setIsConnected(true);
        setConnectionStatus('connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeUpdate(data);
          setLastUpdate(new Date());
        } catch (error) {
          console.error('❌ Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = () => {
        console.log('🔴 SSE disconnected');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        eventSource.close();
        // Retry after 5 seconds
        setTimeout(connectSSE, 5000);
      };

      return eventSource;
    } catch (error) {
      console.error('❌ Failed to create SSE connection:', error);
      setConnectionStatus('error');
      return null;
    }
  }, [handleRealtimeUpdate]);

  // Polling fallback
  const startPolling = useCallback(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('http://localhost:5000/health');
        if (response.ok) {
          const data = await response.json();
          setRealtimeData(prev => ({ ...prev, systemStatus: data }));
          setLastUpdate(new Date());
          setConnectionStatus('polling');
        }
      } catch (error) {
        console.error('❌ Polling error:', error);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, []);

  // Initialize connection
  useEffect(() => {
    let cleanup;
    
    // Try WebSocket first, fallback to SSE, then polling
    const ws = connectWebSocket();
    if (!ws) {
      const sse = connectSSE();
      if (!sse) {
        cleanup = startPolling();
      }
    }

    return () => {
      if (ws) ws.close();
      if (cleanup) cleanup();
    };
  }, [connectWebSocket, connectSSE, startPolling]);

  // Subscribe to specific data types
  const subscribe = useCallback((dataType, callback) => {
    // This would be implemented with a proper event system
    console.log(`Subscribed to ${dataType}`);
    // Return unsubscribe function
    return () => console.log(`Unsubscribed from ${dataType}`);
  }, []);

  // Emit real-time events (for testing)
  const emit = useCallback((type, data) => {
    handleRealtimeUpdate({ type, payload: data });
  }, [handleRealtimeUpdate]);

  const value = {
    isConnected,
    connectionStatus,
    lastUpdate,
    realtimeData,
    subscribe,
    emit,
    // Helper methods
    getProjects: () => realtimeData.projects,
    getCarbonCredits: () => realtimeData.carbonCredits,
    getFieldData: () => realtimeData.fieldData,
    getSystemStatus: () => realtimeData.systemStatus,
    getNotifications: () => realtimeData.notifications
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
};

export default RealTimeProvider;
