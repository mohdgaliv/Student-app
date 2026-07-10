/* ============================================
   STORAGE MANAGER
   Enhanced LocalStorage with expiry, types, and fallback
   ============================================ */

import { safeJSONParse, generateId } from './utils.js';

/**
 * StorageManager - Enhanced wrapper around localStorage
 * Features: expiry, type safety, quota management, fallback
 */
class StorageManager {
    constructor() {
        /** @type {string} Prefix for all keys */
        this.prefix = 'student_app_';
        
        /** @type {boolean} Whether storage is available */
        this.available = this._checkAvailability();
        
        /** @type {Map} In-memory fallback if localStorage unavailable */
        this._memoryFallback = new Map();
    }

    /**
     * Check if localStorage is available
     * @returns {boolean}
     */
    _checkAvailability() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            console.warn('[Storage] localStorage not available, using in-memory fallback');
            return false;
        }
    }

    /**
     * Get full key with prefix
     * @param {string} key
     * @returns {string}
     */
    _getKey(key) {
        return this.prefix + key;
    }

    /**
     * Set a value in storage
     * @param {string} key - Storage key
     * @param {*} value - Value to store (auto-serialized)
     * @param {Object} options
     * @param {number} options.expiry - Expiry in milliseconds
     * @returns {boolean} Success
     * 
     * @example
     * storage.set('user', { name: 'John' }, { expiry: 3600000 }); // Expires in 1 hour
     * storage.set('theme', 'dark');
     */
    set(key, value, options = {}) {
        const { expiry } = options;
        
        const data = {
            value,
            timestamp: Date.now(),
            expiry: expiry || null
        };

        try {
            const serialized = JSON.stringify(data);
            
            if (this.available) {
                localStorage.setItem(this._getKey(key), serialized);
            } else {
                this._memoryFallback.set(this._getKey(key), serialized);
            }
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('[Storage] Quota exceeded, attempting cleanup...');
                this._cleanup();
                // Retry once after cleanup
                try {
                    const serialized = JSON.stringify(data);
                    if (this.available) {
                        localStorage.setItem(this._getKey(key), serialized);
                    }
                    return true;
                } catch {
                    console.error('[Storage] Failed to store data even after cleanup');
                    return false;
                }
            }
            console.error('[Storage] Error setting value:', error);
            return false;
        }
    }

    /**
     * Get a value from storage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if not found
     * @returns {*} Stored value or defaultValue
     * 
     * @example
     * const user = storage.get('user', { name: 'Guest' });
     * const theme = storage.get('theme', 'light');
     */
    get(key, defaultValue = null) {
        try {
            let raw;
            
            if (this.available) {
                raw = localStorage.getItem(this._getKey(key));
            } else {
                raw = this._memoryFallback.get(this._getKey(key));
            }

            if (!raw) return defaultValue;

            const data = safeJSONParse(raw);
            
            if (!data || typeof data !== 'object') return defaultValue;

            // Check expiry
            if (data.expiry && Date.now() - data.timestamp > data.expiry) {
                this.remove(key);
                return defaultValue;
            }

            return data.value !== undefined ? data.value : defaultValue;
        } catch (error) {
            console.error('[Storage] Error getting value:', error);
            return defaultValue;
        }
    }

    /**
     * Remove a value from storage
     * @param {string} key
     * @returns {boolean}
     */
    remove(key) {
        try {
            if (this.available) {
                localStorage.removeItem(this._getKey(key));
            } else {
                this._memoryFallback.delete(this._getKey(key));
            }
            return true;
        } catch (error) {
            console.error('[Storage] Error removing value:', error);
            return false;
        }
    }

    /**
     * Check if key exists and is not expired
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {
        return this.get(key, undefined) !== undefined;
    }

    /**
     * Get all keys with the app prefix
     * @returns {string[]}
     */
    keys() {
        try {
            if (this.available) {
                const keys = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(this.prefix)) {
                        keys.push(key.replace(this.prefix, ''));
                    }
                }
                return keys;
            } else {
                return Array.from(this._memoryFallback.keys())
                    .filter(k => k.startsWith(this.prefix))
                    .map(k => k.replace(this.prefix, ''));
            }
        } catch (error) {
            console.error('[Storage] Error getting keys:', error);
            return [];
        }
    }

    /**
     * Get all values with the app prefix
     * @returns {Object}
     */
    getAll() {
        const result = {};
        this.keys().forEach(key => {
            result[key] = this.get(key);
        });
        return result;
    }

    /**
     * Clear all app-related storage
     * @returns {boolean}
     */
    clear() {
        try {
            this.keys().forEach(key => this.remove(key));
            return true;
        } catch (error) {
            console.error('[Storage] Error clearing storage:', error);
            return false;
        }
    }

    /**
     * Clear expired items
     */
    _cleanup() {
        this.keys().forEach(key => {
            this.get(key); // get() auto-removes expired items
        });
    }

    /**
     * Get storage usage information
     * @returns {Object} { used, total, percent }
     */
    getUsage() {
        try {
            let used = 0;
            if (this.available) {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(this.prefix)) {
                        used += localStorage.getItem(key).length * 2; // UTF-16
                    }
                }
            }
            const total = 5 * 1024 * 1024; // ~5MB typical limit
            return {
                used,
                total,
                percent: Math.round((used / total) * 100),
                formattedUsed: this._formatBytes(used),
                formattedTotal: this._formatBytes(total)
            };
        } catch {
            return { used: 0, total: 0, percent: 0, formattedUsed: '0 B', formattedTotal: '0 B' };
        }
    }

    /**
     * Format bytes to human readable
     * @param {number} bytes
     * @returns {string}
     */
    _formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Set multiple values at once
     * @param {Object} data - Key-value pairs
     * @param {Object} options
     * @returns {boolean}
     * 
     * @example
     * storage.setMultiple({
     *     theme: 'dark',
     *     language: 'hi',
     *     fontSize: 'large'
     * });
     */
    setMultiple(data, options = {}) {
        return Object.entries(data).every(([key, value]) => 
            this.set(key, value, options)
        );
    }

    /**
     * Get multiple values at once
     * @param {string[]} keys
     * @returns {Object}
     */
    getMultiple(keys) {
        const result = {};
        keys.forEach(key => {
            result[key] = this.get(key);
        });
        return result;
    }

    /**
     * Increment a numeric value
     * @param {string} key
     * @param {number} amount
     * @returns {number} New value
     */
    increment(key, amount = 1) {
        const current = this.get(key, 0);
        const newValue = current + amount;
        this.set(key, newValue);
        return newValue;
    }

    /**
     * Push to an array stored at key
     * @param {string} key
     * @param {*} item
     * @param {number} maxLength - Maximum array length
     * @returns {Array} Updated array
     */
    push(key, item, maxLength = Infinity) {
        const arr = this.get(key, []);
        arr.push(item);
        if (arr.length > maxLength) {
            arr.splice(0, arr.length - maxLength);
        }
        this.set(key, arr);
        return arr;
    }

    /**
     * Add to a set stored at key
     * @param {string} key
     * @param {*} item
     * @returns {Array} Updated array
     */
    addToSet(key, item) {
        const arr = this.get(key, []);
        if (!arr.includes(item)) {
            arr.push(item);
        }
        this.set(key, arr);
        return arr;
    }
}

// Create and export singleton instance
const storage = new StorageManager();

export { StorageManager };
export default storage;