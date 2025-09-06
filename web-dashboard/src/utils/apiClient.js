import logger from './logger';

class ApiClient {
  constructor(baseURL = 'http://localhost:5000') {
    this.baseURL = baseURL;
    this.cache = new Map();
    this.requestQueue = [];
    this.isOnline = navigator.onLine;
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2
    };

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
      logger.info('Network connection restored', null, 'API_CLIENT');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      logger.warn('Network connection lost', null, 'API_CLIENT');
    });
  }

  // Main request method
  async request(endpoint, options = {}) {
    const startTime = performance.now();
    const url = `${this.baseURL}${endpoint}`;
    const requestId = this.generateRequestId();

    logger.debug(`API Request: ${options.method || 'GET'} ${endpoint}`, {
      requestId,
      options
    }, 'API_CLIENT');

    // Check cache first for GET requests
    if ((!options.method || options.method === 'GET') && options.cache !== false) {
      const cached = this.getFromCache(endpoint);
      if (cached) {
        logger.debug(`Cache hit for ${endpoint}`, { requestId }, 'API_CLIENT');
        return cached;
      }
    }

    // If offline, queue the request
    if (!this.isOnline && options.queueWhenOffline !== false) {
      return this.queueRequest(endpoint, options, requestId);
    }

    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        ...options.headers
      },
      ...options
    };

    try {
      const response = await this.fetchWithRetry(url, config);
      const duration = performance.now() - startTime;

      logger.apiCall(config.method, endpoint, response.status, duration);

      if (!response.ok) {
        throw new ApiError(response.status, response.statusText, endpoint);
      }

      const data = await response.json();

      // Cache successful GET requests
      if (config.method === 'GET' && options.cache !== false) {
        this.setCache(endpoint, data, options.cacheTTL);
      }

      return data;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      if (error instanceof ApiError) {
        logger.apiCall(config.method, endpoint, error.status, duration, error.message);
        throw error;
      } else {
        logger.error(`API Error: ${config.method} ${endpoint}`, {
          error: error.message,
          duration,
          requestId
        }, 'API_CLIENT');
        throw new ApiError(0, error.message, endpoint);
      }
    }
  }

  // Fetch with retry logic
  async fetchWithRetry(url, config, attempt = 1) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (attempt < this.retryConfig.maxRetries && this.shouldRetry(error)) {
        const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
        
        logger.warn(`API request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})`, {
          url,
          error: error.message,
          attempt
        }, 'API_CLIENT');

        await this.sleep(delay);
        return this.fetchWithRetry(url, config, attempt + 1);
      }
      throw error;
    }
  }

  // Determine if error is retryable
  shouldRetry(error) {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.name === 'TypeError' || // Network error
      error.name === 'AbortError' || // Timeout
      (error.status >= 500 && error.status < 600) // Server error
    );
  }

  // Queue request for offline processing
  queueRequest(endpoint, options, requestId) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        endpoint,
        options,
        requestId,
        resolve,
        reject,
        timestamp: Date.now()
      });

      logger.info(`Request queued for offline processing: ${options.method || 'GET'} ${endpoint}`, {
        requestId,
        queueLength: this.requestQueue.length
      }, 'API_CLIENT');
    });
  }

  // Process queued requests when online
  async processQueue() {
    if (this.requestQueue.length === 0) return;

    logger.info(`Processing ${this.requestQueue.length} queued requests`, null, 'API_CLIENT');

    const queue = [...this.requestQueue];
    this.requestQueue = [];

    for (const queuedRequest of queue) {
      try {
        const result = await this.request(queuedRequest.endpoint, {
          ...queuedRequest.options,
          queueWhenOffline: false
        });
        queuedRequest.resolve(result);
      } catch (error) {
        queuedRequest.reject(error);
      }
    }
  }

  // Cache management
  setCache(key, data, ttl = 300000) { // Default 5 minutes
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    });
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  clearCache() {
    this.cache.clear();
    logger.info('API cache cleared', null, 'API_CLIENT');
  }

  // Convenience methods
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // Upload file with progress
  async upload(endpoint, file, onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (error) {
            resolve(xhr.responseText);
          }
        } else {
          reject(new ApiError(xhr.status, xhr.statusText, endpoint));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new ApiError(0, 'Upload failed', endpoint));
      });

      xhr.open('POST', `${this.baseURL}${endpoint}`);
      xhr.send(formData);
    });
  }

  // Utility methods
  generateRequestId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.get('/health', { cache: false, timeout: 5000 });
      logger.success('API health check passed', response, 'API_CLIENT');
      return true;
    } catch (error) {
      logger.error('API health check failed', { error: error.message }, 'API_CLIENT');
      return false;
    }
  }

  // Get API statistics
  getStats() {
    return {
      cacheSize: this.cache.size,
      queueLength: this.requestQueue.length,
      isOnline: this.isOnline,
      baseURL: this.baseURL
    };
  }
}

// Custom API Error class
class ApiError extends Error {
  constructor(status, message, endpoint) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.endpoint = endpoint;
  }
}

// Create and export default instance
const apiClient = new ApiClient();

export { apiClient, ApiError };
export default apiClient;
