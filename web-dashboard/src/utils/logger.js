class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.listeners = [];
    this.logLevels = {
      ERROR: { priority: 0, color: '#ff4444', icon: '❌' },
      WARN: { priority: 1, color: '#ff8800', icon: '⚠️' },
      INFO: { priority: 2, color: '#4488ff', icon: 'ℹ️' },
      DEBUG: { priority: 3, color: '#888888', icon: '🔍' },
      SUCCESS: { priority: 2, color: '#44ff44', icon: '✅' }
    };
  }

  // Core logging method
  log(level, message, data = null, component = null) {
    const timestamp = new Date();
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp,
      level,
      message,
      data,
      component,
      sessionId: this.getSessionId(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      stack: new Error().stack
    };

    // Add to logs array
    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Console output with styling
    this.consoleLog(logEntry);

    // Notify listeners
    this.notifyListeners(logEntry);

    // Send to backend (async)
    this.sendToBackend(logEntry);

    // Store in localStorage for persistence
    this.persistLog(logEntry);

    return logEntry;
  }

  // Convenience methods
  error(message, data, component) {
    return this.log('ERROR', message, data, component);
  }

  warn(message, data, component) {
    return this.log('WARN', message, data, component);
  }

  info(message, data, component) {
    return this.log('INFO', message, data, component);
  }

  debug(message, data, component) {
    return this.log('DEBUG', message, data, component);
  }

  success(message, data, component) {
    return this.log('SUCCESS', message, data, component);
  }

  // API call logging
  apiCall(method, url, status, duration, error = null) {
    const message = `${method} ${url} - ${status} (${duration}ms)`;
    const data = { method, url, status, duration, error };
    
    if (status >= 400) {
      this.error(message, data, 'API');
    } else {
      this.info(message, data, 'API');
    }
  }

  // Performance logging
  performance(name, duration, data = null) {
    const message = `Performance: ${name} took ${duration}ms`;
    const logData = { name, duration, ...data };
    
    if (duration > 1000) {
      this.warn(message, logData, 'PERFORMANCE');
    } else {
      this.debug(message, logData, 'PERFORMANCE');
    }
  }

  // User action logging
  userAction(action, element, data = null) {
    const message = `User action: ${action}`;
    const logData = { action, element, ...data };
    this.info(message, logData, 'USER_ACTION');
  }

  // Enhanced console logging with styling
  consoleLog(logEntry) {
    const { level, message, data, component, timestamp } = logEntry;
    const levelConfig = this.logLevels[level];
    const timeStr = timestamp.toLocaleTimeString();
    const componentStr = component ? ` [${component}]` : '';

    if (typeof console[level.toLowerCase()] === 'function') {
      console[level.toLowerCase()](
        `%c${levelConfig.icon} ${timeStr}${componentStr} ${message}`,
        `color: ${levelConfig.color}; font-weight: bold;`,
        data || ''
      );
    } else {
      console.log(
        `%c${levelConfig.icon} ${timeStr}${componentStr} ${message}`,
        `color: ${levelConfig.color}; font-weight: bold;`,
        data || ''
      );
    }
  }

  // Send logs to backend
  async sendToBackend(logEntry) {
    try {
      // Only send important logs to reduce server load
      if (this.logLevels[logEntry.level].priority <= 1) {
        await fetch('http://localhost:5000/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logEntry)
        });
      }
    } catch (error) {
      // Silently fail to avoid infinite logging loops
      console.warn('Failed to send log to backend:', error);
    }
  }

  // Persist logs to localStorage
  persistLog(logEntry) {
    try {
      const storedLogs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      storedLogs.unshift(logEntry);
      
      // Keep only last 100 logs in localStorage
      const trimmedLogs = storedLogs.slice(0, 100);
      localStorage.setItem('app_logs', JSON.stringify(trimmedLogs));
    } catch (error) {
      console.warn('Failed to persist log to localStorage:', error);
    }
  }

  // Load persisted logs
  loadPersistedLogs() {
    try {
      const storedLogs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      this.logs = [...storedLogs, ...this.logs];
    } catch (error) {
      console.warn('Failed to load persisted logs:', error);
    }
  }

  // Get session ID
  getSessionId() {
    let sessionId = sessionStorage.getItem('logger_session_id');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('logger_session_id', sessionId);
    }
    return sessionId;
  }

  // Subscribe to log events
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Notify all listeners
  notifyListeners(logEntry) {
    this.listeners.forEach(callback => {
      try {
        callback(logEntry);
      } catch (error) {
        console.warn('Error in log listener:', error);
      }
    });
  }

  // Get logs with filtering
  getLogs(filters = {}) {
    let filteredLogs = [...this.logs];

    if (filters.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filters.level);
    }

    if (filters.component) {
      filteredLogs = filteredLogs.filter(log => log.component === filters.component);
    }

    if (filters.since) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.since);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(searchTerm) ||
        (log.component && log.component.toLowerCase().includes(searchTerm))
      );
    }

    return filteredLogs.slice(0, filters.limit || 100);
  }

  // Export logs
  exportLogs(format = 'json') {
    const logs = this.getLogs();
    
    if (format === 'csv') {
      return this.exportAsCSV(logs);
    } else if (format === 'txt') {
      return this.exportAsText(logs);
    } else {
      return JSON.stringify(logs, null, 2);
    }
  }

  exportAsCSV(logs) {
    const headers = ['Timestamp', 'Level', 'Component', 'Message', 'URL'];
    const rows = logs.map(log => [
      log.timestamp.toISOString(),
      log.level,
      log.component || '',
      log.message.replace(/"/g, '""'),
      log.url
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  exportAsText(logs) {
    return logs.map(log => 
      `[${log.timestamp.toISOString()}] ${log.level} ${log.component ? `[${log.component}] ` : ''}${log.message}`
    ).join('\n');
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    localStorage.removeItem('app_logs');
    this.info('Logs cleared', null, 'LOGGER');
  }

  // Get system info for debugging
  getSystemInfo() {
    return {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      memoryUsage: performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      } : null
    };
  }
}

// Create global logger instance
const logger = new Logger();

// Load persisted logs on initialization
logger.loadPersistedLogs();

// Global error handler
window.addEventListener('error', (event) => {
  logger.error('Global Error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack
  }, 'GLOBAL_ERROR');
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled Promise Rejection', {
    reason: event.reason,
    stack: event.reason?.stack
  }, 'PROMISE_REJECTION');
});

export { logger };
export default logger;
