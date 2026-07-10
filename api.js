/* ============================================
   API CLIENT
   Firebase-ready HTTP wrapper with interceptors & caching
   ============================================ */

import state from './state-manager.js';
import storage from './storage.js';
import eventBus from './event-bus.js';
import { generateId, isOnline, sleep } from './utils.js';

/**
 * ApiClient - Centralized API communication layer
 * Features: interceptors, retry, caching, offline queue, auth headers
 */
class ApiClient {
    constructor() {
        /** @type {string} Base URL for API */
        this.baseURL = '';
        
        /** @type {number} Default request timeout in ms */
        this.timeout = 30000;
        
        /** @type {number} Max retry attempts */
        this.maxRetries = 3;
        
        /** @type {number} Retry delay in ms */
        this.retryDelay = 1000;
        
        /** @type {Object} Default headers */
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        /** @type {Array} Request interceptors */
        this._requestInterceptors = [];
        
        /** @type {Array} Response interceptors */
        this._responseInterceptors = [];
        
        /** @type {Map} In-memory cache */
        this._cache = new Map();
        
        /** @type {number} Cache TTL in ms (default 5 minutes) */
        this._cacheTTL = 5 * 60 * 1000;
        
        /** @type {Array} Offline request queue */
        this._offlineQueue = [];
        
        /** @type {boolean} Whether to queue requests when offline */
        this._queueOffline = true;
        
        /** @type {Object} Pending requests for deduplication */
        this._pendingRequests = new Map();
        
        /** @type {boolean} Debug mode */
        this._debug = false;
        
        // Listen for online/offline events
        this._setupNetworkListeners();
        
        // Add default interceptors
        this._addDefaultInterceptors();
    }

    /**
     * Configure the API client
     * @param {Object} config
     */
    configure(config = {}) {
        if (config.baseURL) this.baseURL = config.baseURL;
        if (config.timeout) this.timeout = config.timeout;
        if (config.maxRetries !== undefined) this.maxRetries = config.maxRetries;
        if (config.headers) Object.assign(this.defaultHeaders, config.headers);
        if (config.debug !== undefined) this._debug = config.debug;
    }

    /**
     * Add default interceptors (auth, logging)
     */
    _addDefaultInterceptors() {
        // Request interceptor - add auth token
        this.addRequestInterceptor((config) => {
            const token = state.get('auth.token');
            if (token) {
                config.headers = {
                    ...config.headers,
                    'Authorization': `Bearer ${token}`
                };
            }
            
            // Add request ID for tracing
            config.headers['X-Request-ID'] = generateId('req');
            
            return config;
        });
        
        // Response interceptor - handle common errors
        this.addResponseInterceptor(
            (response) => response,
            (error) => {
                if (error.status === 401) {
                    eventBus.emit('auth:session-expired');
                }
                if (error.status === 403) {
                    eventBus.emit('auth:forbidden');
                }
                if (error.status === 429) {
                    console.warn('[API] Rate limited, backing off...');
                }
                return Promise.reject(error);
            }
        );
    }

    /**
     * Set up network status listeners
     */
    _setupNetworkListeners() {
        window.addEventListener('online', () => {
            this._debug && console.log('[API] Back online, processing queue...');
            this._processOfflineQueue();
            eventBus.emit('network:online');
        });
        
        window.addEventListener('offline', () => {
            this._debug && console.log('[API] Offline');
            eventBus.emit('network:offline');
        });
    }

    /**
     * Add request interceptor
     * @param {Function} interceptor - (config) => config
     * @returns {Function} Remove function
     */
    addRequestInterceptor(interceptor) {
        this._requestInterceptors.push(interceptor);
        return () => {
            const index = this._requestInterceptors.indexOf(interceptor);
            if (index > -1) this._requestInterceptors.splice(index, 1);
        };
    }

    /**
     * Add response interceptor
     * @param {Function} onFulfilled - (response) => response
     * @param {Function} onRejected - (error) => error
     * @returns {Function} Remove function
     */
    addResponseInterceptor(onFulfilled, onRejected) {
        const interceptor = { onFulfilled, onRejected };
        this._responseInterceptors.push(interceptor);
        return () => {
            const index = this._responseInterceptors.indexOf(interceptor);
            if (index > -1) this._responseInterceptors.splice(index, 1);
        };
    }

    /**
     * Make a GET request
     * @param {string} endpoint
     * @param {Object} options
     * @returns {Promise}
     */
    async get(endpoint, options = {}) {
        return this._request('GET', endpoint, null, options);
    }

    /**
     * Make a POST request
     * @param {string} endpoint
     * @param {*} data
     * @param {Object} options
     * @returns {Promise}
     */
    async post(endpoint, data = {}, options = {}) {
        return this._request('POST', endpoint, data, options);
    }

    /**
     * Make a PUT request
     * @param {string} endpoint
     * @param {*} data
     * @param {Object} options
     * @returns {Promise}
     */
    async put(endpoint, data = {}, options = {}) {
        return this._request('PUT', endpoint, data, options);
    }

    /**
     * Make a PATCH request
     * @param {string} endpoint
     * @param {*} data
     * @param {Object} options
     * @returns {Promise}
     */
    async patch(endpoint, data = {}, options = {}) {
        return this._request('PATCH', endpoint, data, options);
    }

    /**
     * Make a DELETE request
     * @param {string} endpoint
     * @param {Object} options
     * @returns {Promise}
     */
    async delete(endpoint, options = {}) {
        return this._request('DELETE', endpoint, null, options);
    }

    /**
     * Upload file(s)
     * @param {string} endpoint
     * @param {FormData} formData
     * @param {Object} options
     * @param {Function} options.onProgress - (percent) => void
     * @returns {Promise}
     */
    async upload(endpoint, formData, options = {}) {
        const config = {
            ...options,
            headers: {
                // Don't set Content-Type for FormData (browser sets with boundary)
                ...(options.headers || {})
            },
            body: formData,
            isUpload: true
        };
        
        // Remove Content-Type for multipart
        delete config.headers['Content-Type'];
        
        return this._request('POST', endpoint, null, config);
    }

    /**
     * Core request method
     * @param {string} method
     * @param {string} endpoint
     * @param {*} data
     * @param {Object} options
     * @returns {Promise}
     */
    async _request(method, endpoint, data = null, options = {}) {
        const {
            headers = {},
            params = {},
            timeout = this.timeout,
            retries = this.maxRetries,
            cache = false,
            cacheTTL = this._cacheTTL,
            skipQueue = false,
            isUpload = false,
            signal = null
        } = options;
        
        // Build URL
        let url = this.baseURL + endpoint;
        
        // Add query params for GET requests
        if (method === 'GET' && Object.keys(params).length > 0) {
            const queryString = new URLSearchParams(params).toString();
            url += '?' + queryString;
        }
        
        // Check cache for GET requests
        if (method === 'GET' && cache) {
            const cached = this._getFromCache(url);
            if (cached) {
                this._debug && console.log('[API] Cache hit:', url);
                return cached;
            }
        }
        
        // Check for pending identical request (deduplication)
        const requestKey = `${method}:${url}`;
        if (method === 'GET' && this._pendingRequests.has(requestKey)) {
            this._debug && console.log('[API] Deduplicating request:', requestKey);
            return this._pendingRequests.get(requestKey);
        }
        
        // Handle offline
        if (!isOnline() && this._queueOffline && !skipQueue && method !== 'GET') {
            return this._queueOfflineRequest(method, endpoint, data, options);
        }
        
        // Build request config
        let config = {
            method,
            headers: { ...this.defaultHeaders, ...headers },
            signal
        };
        
        // Add body for non-GET requests
        if (data !== null && method !== 'GET') {
            if (isUpload) {
                config.body = data; // FormData
            } else {
                config.body = JSON.stringify(data);
            }
        }
        
        // Run request interceptors
        for (const interceptor of this._requestInterceptors) {
            config = interceptor(config) || config;
        }
        
        // Create the request promise
        const requestPromise = this._executeRequest(url, config, timeout, retries);
        
        // Store for deduplication
        if (method === 'GET') {
            this._pendingRequests.set(requestKey, requestPromise);
            // Clean up after completion
            requestPromise.finally(() => {
                this._pendingRequests.delete(requestKey);
            });
        }
        
        try {
            const response = await requestPromise;
            
            // Cache successful GET responses
            if (method === 'GET' && cache) {
                this._saveToCache(url, response, cacheTTL);
            }
            
            return response;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Execute the actual HTTP request with retry logic
     * @param {string} url
     * @param {Object} config
     * @param {number} timeout
     * @param {number} retries
     * @returns {Promise}
     */
    async _executeRequest(url, config, timeout, retries) {
        let lastError;
        
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                // Create AbortController for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                
                // Merge signals if provided
                if (config.signal) {
                    config.signal.addEventListener('abort', () => controller.abort());
                }
                
                const fetchConfig = {
                    ...config,
                    signal: controller.signal
                };
                
                const response = await fetch(url, fetchConfig);
                clearTimeout(timeoutId);
                
                // Parse response
                const responseData = await this._parseResponse(response);
                
                // Check for HTTP errors
                if (!response.ok) {
                    const error = new Error(responseData.message || `HTTP ${response.status}`);
                    error.status = response.status;
                    error.data = responseData;
                    throw error;
                }
                
                // Run response interceptors
                let finalResponse = { data: responseData, status: response.status, headers: response.headers };
                for (const interceptor of this._responseInterceptors) {
                    if (interceptor.onFulfilled) {
                        finalResponse = await interceptor.onFulfilled(finalResponse) || finalResponse;
                    }
                }
                
                this._debug && console.log(`[API] ${config.method} ${url} - ${response.status}`);
                
                return finalResponse;
                
            } catch (error) {
                lastError = error;
                
                // Don't retry if:
                // - Request was aborted
                // - It's a 4xx error (except 429)
                // - We've exhausted retries
                if (error.name === 'AbortError') {
                    throw new Error('Request timeout');
                }
                
                if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
                    throw error;
                }
                
                if (attempt < retries) {
                    const delay = this.retryDelay * Math.pow(2, attempt); // Exponential backoff
                    this._debug && console.log(`[API] Retry ${attempt + 1}/${retries} after ${delay}ms`);
                    await sleep(delay);
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Parse response based on content type
     * @param {Response} response
     * @returns {Promise<Object|string>}
     */
    async _parseResponse(response) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        }
        
        if (contentType && contentType.includes('text/')) {
            return response.text();
        }
        
        return response.blob();
    }

    /**
     * Queue a request for when we're back online
     * @param {string} method
     * @param {string} endpoint
     * @param {*} data
     * @param {Object} options
     * @returns {Promise}
     */
    _queueOfflineRequest(method, endpoint, data, options) {
        return new Promise((resolve, reject) => {
            const queuedRequest = {
                id: generateId('offline'),
                method,
                endpoint,
                data,
                options: { ...options, skipQueue: true },
                timestamp: Date.now(),
                resolve,
                reject
            };
            
            this._offlineQueue.push(queuedRequest);
            storage.set('offline_queue', this._offlineQueue.map(r => ({
                ...r,
                resolve: null,
                reject: null
            })));
            
            this._debug && console.log('[API] Queued offline:', method, endpoint);
            
            eventBus.emit('api:offline-queued', { 
                id: queuedRequest.id, 
                method, 
                endpoint 
            });
            
            // Resolve with optimistic response
            resolve({
                data: null,
                offline: true,
                queuedId: queuedRequest.id
            });
        });
    }

    /**
     * Process offline queue when back online
     */
    async _processOfflineQueue() {
        if (this._offlineQueue.length === 0) return;
        
        this._debug && console.log(`[API] Processing ${this._offlineQueue.length} offline requests`);
        
        const queue = [...this._offlineQueue];
        this._offlineQueue = [];
        storage.remove('offline_queue');
        
        let processed = 0;
        let failed = 0;
        
        for (const item of queue) {
            try {
                const response = await this._request(
                    item.method, 
                    item.endpoint, 
                    item.data, 
                    item.options
                );
                item.resolve(response);
                processed++;
            } catch (error) {
                item.reject(error);
                failed++;
                // Re-queue failed requests
                this._offlineQueue.push(item);
            }
        }
        
        // Save remaining failed items
        if (this._offlineQueue.length > 0) {
            storage.set('offline_queue', this._offlineQueue.map(r => ({
                ...r,
                resolve: null,
                reject: null
            })));
        }
        
        eventBus.emit('api:queue-processed', { processed, failed });
    }

    /**
     * Load offline queue from storage (call on app init)
     */
    loadOfflineQueue() {
        const saved = storage.get('offline_queue', []);
        if (saved.length > 0) {
            this._debug && console.log(`[API] Loaded ${saved.length} saved offline requests`);
            // We can't restore promises, so we'll create new ones
            // In production, these would be synced differently
        }
    }

    /**
     * Get from cache
     * @param {string} key
     * @returns {*|null}
     */
    _getFromCache(key) {
        const cached = this._cache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > cached.ttl) {
            this._cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    /**
     * Save to cache
     * @param {string} key
     * @param {*} data
     * @param {number} ttl
     */
    _saveToCache(key, data, ttl) {
        this._cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
        
        // Limit cache size
        if (this._cache.size > 100) {
            const firstKey = this._cache.keys().next().value;
            this._cache.delete(firstKey);
        }
    }

    /**
     * Clear cache
     * @param {string} pattern - URL pattern to match (optional)
     */
    clearCache(pattern) {
        if (pattern) {
            for (const key of this._cache.keys()) {
                if (key.includes(pattern)) {
                    this._cache.delete(key);
                }
            }
        } else {
            this._cache.clear();
        }
    }

    /**
     * Get offline queue status
     * @returns {Object}
     */
    getOfflineStatus() {
        return {
            queueLength: this._offlineQueue.length,
            isOnline: isOnline()
        };
    }
}

// Create and export singleton
const api = new ApiClient();

export { ApiClient };
export default api;