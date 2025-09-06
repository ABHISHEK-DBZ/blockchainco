import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

const RealTimeContext = createContext(null);

export const useRealTime = () => {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
};

export const RealTimeProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionType, setConnectionType] = useState('none');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [subscriptions, setSubscriptions] = useState(new Set());
  const [data, setData] = useState({
    projects: [],
    carbonCredits: [],
    fieldData: [],
    statistics: {}
  });

  const wsRef = useRef(null);
  const eventSourceRef = useRef(null);
  const triedSSERef = useRef(false);
  const pollingIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const log = useCallback((message, data = null) => {
    console.log(`[RealTime] ${message}`, data ? data : '');
  }, []);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    try {
      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000/ws';
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        log('WebSocket connected');
        setIsConnected(true);
        setConnectionType('websocket');
        reconnectAttempts.current = 0;
        
        // Subscribe to all active subscriptions
        subscriptions.forEach(subscription => {
          wsRef.current.send(JSON.stringify({
            type: 'subscribe',
            topic: subscription
          }));
        });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleRealTimeUpdate(message);
        } catch (error) {
          log('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        log('WebSocket disconnected');
        setIsConnected(false);
        setConnectionType('none');
        // Try SSE fallback once when WS disconnects
        if (!triedSSERef.current) {
          triedSSERef.current = true;
          connectSSE();
        } else {
          handleReconnect();
        }
      };

      wsRef.current.onerror = (error) => {
        log('WebSocket error:', error);
        setIsConnected(false);
        setConnectionType('none');
        if (!triedSSERef.current) {
          triedSSERef.current = true;
          connectSSE();
        }
      };

    } catch (error) {
      log('Failed to create WebSocket connection:', error);
      handleReconnect();
    }
  }, [subscriptions]);

  // Server-Sent Events connection
  const connectSSE = useCallback(() => {
    try {
      const sseUrl = process.env.REACT_APP_SSE_URL || 'http://localhost:5000/sse';
      eventSourceRef.current = new EventSource(sseUrl);

  eventSourceRef.current.onopen = () => {
        log('SSE connected');
        setIsConnected(true);
        setConnectionType('sse');
        reconnectAttempts.current = 0;
      };

      eventSourceRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleRealTimeUpdate(message);
        } catch (error) {
          log('Error parsing SSE message:', error);
        }
      };

      eventSourceRef.current.onerror = () => {
        log('SSE error or disconnected');
        setIsConnected(false);
        setConnectionType('none');
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        // If SSE fails, start polling
        startPolling();
      };

    } catch (error) {
      log('Failed to create SSE connection:', error);
      handleReconnect();
    }
  }, []);

  // Polling fallback
  const startPolling = useCallback(() => {
    log('Starting polling fallback');
    setConnectionType('polling');
    setIsConnected(true);
    reconnectAttempts.current = 0;

    pollingIntervalRef.current = setInterval(async () => {
      try {
        // Poll for updates from subscribed topics
        for (const subscription of subscriptions) {
          const response = await fetch(`http://localhost:5000/api/${subscription}`);
          if (response.ok) {
            const data = await response.json();
            handleRealTimeUpdate({
              type: 'update',
              topic: subscription,
              data: data
            });
          }
        }
        setLastUpdate(new Date());
      } catch (error) {
        log('Polling error:', error);
        setIsConnected(false);
      }
    }, 5000); // Poll every 5 seconds
  }, [subscriptions]);

  // Handle real-time updates
  const handleRealTimeUpdate = useCallback((message) => {
    const { type, topic, data: updateData } = message;
    
    log(`Real-time update: ${type} for ${topic}`);
    
    setData(prevData => {
      const newData = { ...prevData };
      
      switch (topic) {
        case 'projects':
          if (type === 'update' || type === 'create') {
            newData.projects = updateData.projects || updateData;
          } else if (type === 'delete') {
            newData.projects = newData.projects.filter(p => p.id !== updateData.id);
          }
          break;
          
        case 'carbon-credits':
          if (type === 'update' || type === 'create') {
            newData.carbonCredits = updateData.carbon_credits || updateData;
          } else if (type === 'delete') {
            newData.carbonCredits = newData.carbonCredits.filter(c => c.id !== updateData.id);
          }
          break;
          
        case 'field-data':
          if (type === 'update' || type === 'create') {
            newData.fieldData = updateData.field_data || updateData;
          } else if (type === 'delete') {
            newData.fieldData = newData.fieldData.filter(f => f.id !== updateData.id);
          }
          break;
          
        case 'statistics':
          newData.statistics = updateData;
          break;
          
        default:
          log(`Unknown topic: ${topic}`);
      }
      
      return newData;
    });
    
    setLastUpdate(new Date());
  }, []);

  // Reconnection logic
  const handleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      log('Max reconnection attempts reached');
      return;
    }

    const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
    log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttempts.current++;
      connect();
    }, delay);
  }, []);

  // Main connection logic
  const connect = useCallback(() => {
    disconnect();

    // Try WebSocket first, then SSE, then polling
    if (typeof WebSocket !== 'undefined') {
      connectWebSocket();
    } else if (typeof EventSource !== 'undefined') {
      connectSSE();
    } else {
      startPolling();
    }
  }, [connectWebSocket, connectSSE, startPolling]);

  // Disconnect all connections
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionType('none');
  }, []);

  // Subscribe to real-time updates for a specific topic
  const subscribe = useCallback((topic) => {
    log(`Subscribing to: ${topic}`);
    setSubscriptions(prev => new Set([...prev, topic]));
    
    // If already connected, send subscription immediately
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        topic: topic
      }));
    }
  }, []);

  // Unsubscribe from real-time updates
  const unsubscribe = useCallback((topic) => {
    log(`Unsubscribing from: ${topic}`);
    setSubscriptions(prev => {
      const newSubs = new Set(prev);
      newSubs.delete(topic);
      return newSubs;
    });
    
    // If connected via WebSocket, send unsubscribe message
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe',
        topic: topic
      }));
    }
  }, []);

  // Send real-time message
  const send = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Initialize connection on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const value = {
    // Connection state
    isConnected,
    connectionType,
    lastUpdate,
    
    // Data
    data,
    
    // Methods
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    send,
    
    // Utilities
    subscriptions: Array.from(subscriptions)
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
};

export default RealTimeProvider;
