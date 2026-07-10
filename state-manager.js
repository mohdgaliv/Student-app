/* ============================================
   STATE MANAGER
   Reactive state management with subscriptions
   ============================================ */

import eventBus from './event-bus.js';
import { deepClone, generateId } from './utils.js';

/**
 * StateManager - Centralized reactive state store
 * Features: subscriptions, computed properties, middleware, persistence
 */
class StateManager {
    constructor() {
        /** @type {Object} The central state object */
        this._state = {};
        
        /** @type {Map<string, Set<Function>>} Subscribers for each state path */
        this._subscribers = new Map();
        
        /** @type {Map<string, Function>} Computed properties */
        this._computed = new Map();
        
        /** @type {Array<Function>} Middleware functions */
        this._middleware = [];
        
        /** @type {boolean} Enable debug logging */
        this._debug = false;
        
        /** @type {Array<Object>} History of state changes (for undo) */
        this._history = [];
        
        /** @type {number} Maximum history entries */
        this._maxHistory = 50;
        
        /** @type {number} Current position in history */
        this._historyIndex = -1;
        
        /** @type {boolean} Whether we're undoing/redoing */
        this._isUndoRedo = false;
        
        // Initialize with default state
        this._initDefaultState();
    }

    /**
     * Initialize default application state
     */
    _initDefaultState() {
        this._state = {
            // App
            app: {
                initialized: false,
                version: '1.0.0',
                firstLaunch: true,
                loading: true,
                online: navigator.onLine
            },
            
            // Auth
            auth: {
                isLoggedIn: false,
                user: null,
                token: null,
                refreshToken: null,
                sessionExpiry: null
            },
            
            // User Preferences
            preferences: {
                theme: 'light',        // 'light' | 'dark' | 'auto'
                language: 'en',
                fontSize: 'medium',
                notifications: true,
                soundEnabled: true,
                vibrationEnabled: true
            },
            
            // UI State
            ui: {
                sidebarOpen: false,
                activeModal: null,
                activePage: 'splash',
                previousPage: null,
                pageParams: {},
                toasts: [],
                loadingQueue: 0
            },
            
            // Navigation
            navigation: {
                currentRoute: '/',
                previousRoute: null,
                history: [],
                params: {}
            },
            
            // Data (will be populated from API/storage)
            data: {
                profile: null,
                subjects: [],
                attendance: [],
                assignments: [],
                homework: [],
                notes: [],
                timetable: [],
                teachers: [],
                notifications: [],
                results: [],
                quizzes: []
            },
            
            // Cache
            cache: {
                lastSync: null,
                pendingChanges: 0
            }
        };
    }

    /**
     * Enable debug logging
     * @param {boolean} enabled
     */
    setDebug(enabled = true) {
        this._debug = enabled;
    }

    /**
     * Log state changes
     * @param {string} action
     * @param {string} path
     * @param {*} value
     */
    _log(action, path, value) {
        if (this._debug) {
            console.log(`[State] ${action}: "${path}"`, value);
        }
    }

    /**
     * Get the entire state or a specific path
     * @param {string} path - Dot notation path (e.g., 'auth.user.name')
     * @param {*} defaultValue - Default if path not found
     * @returns {*}
     * 
     * @example
     * state.get('auth.user');           // { name: 'John', ... }
     * state.get('auth.user.name');      // 'John'
     * state.get();                       // Entire state object
     */
    get(path, defaultValue = null) {
        if (!path) return deepClone(this._state);
        
        const keys = path.split('.');
        let current = this._state;
        
        for (const key of keys) {
            if (current === null || current === undefined) return defaultValue;
            if (typeof current !== 'object') return defaultValue;
            current = current[key];
        }
        
        return current !== undefined ? deepClone(current) : defaultValue;
    }

    /**
     * Set a value in the state
     * @param {string} path - Dot notation path
     * @param {*} value - New value
     * @param {Object} options
     * @param {boolean} options.silent - Don't notify subscribers
     * @param {boolean} options.skipHistory - Don't add to undo history
     * 
     * @example
     * state.set('auth.user.name', 'Jane');
     * state.set('preferences.theme', 'dark');
     */
    set(path, value, options = {}) {
        const { silent = false, skipHistory = false } = options;
        
        const oldValue = this.get(path);
        
        // Don't update if value hasn't changed
        if (JSON.stringify(oldValue) === JSON.stringify(value)) return;
        
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this._state;
        
        // Navigate to the nested object
        for (const key of keys) {
            if (!(key in target) || typeof target[key] !== 'object' || target[key] === null) {
                target[key] = {};
            }
            target = target[key];
        }
        
        // Run middleware
        let finalValue = value;
        for (const middleware of this._middleware) {
            finalValue = middleware(path, finalValue, oldValue) ?? finalValue;
        }
        
        // Set the value
        target[lastKey] = finalValue;
        
        // Add to history (if not undo/redo operation)
        if (!skipHistory && !this._isUndoRedo) {
            this._addToHistory(path, oldValue, finalValue);
        }
        
        this._log('SET', path, finalValue);
        
        // Notify subscribers
        if (!silent) {
            this._notifySubscribers(path, finalValue, oldValue);
            this._recomputeDependents(path);
        }
        
        // Emit global state change event
        eventBus.emit('state:changed', { path, value: finalValue, oldValue });
    }

    /**
     * Update multiple paths at once
     * @param {Object} updates - { path: value } pairs
     * @param {Object} options
     * 
     * @example
     * state.batch({
     *     'auth.user': userData,
     *     'auth.token': token,
     *     'ui.loadingQueue': 0
     * });
     */
    batch(updates, options = {}) {
        const { silent = false } = options;
        
        Object.entries(updates).forEach(([path, value]) => {
            this.set(path, value, { silent: true, skipHistory: true });
        });
        
        // Notify all changed paths at once
        Object.keys(updates).forEach(path => {
            const value = this.get(path);
            this._notifySubscribers(path, value);
            this._recomputeDependents(path);
        });
        
        // Single event for batch
        eventBus.emit('state:batch-changed', { updates });
        
        this._log('BATCH', Object.keys(updates).join(', '), updates);
    }

    /**
     * Subscribe to state changes at a specific path
     * @param {string} path - State path to watch
     * @param {Function} callback - Called when value changes (newValue, oldValue)
     * @returns {Function} Unsubscribe function
     * 
     * @example
     * const unsubscribe = state.subscribe('auth.user', (user) => {
     *     updateUI(user);
     * });
     */
    subscribe(path, callback) {
        if (!this._subscribers.has(path)) {
            this._subscribers.set(path, new Set());
        }
        
        this._subscribers.get(path).add(callback);
        this._log('SUBSCRIBE', path);
        
        // Immediately call with current value
        const currentValue = this.get(path);
        if (currentValue !== undefined) {
            callback(currentValue, null);
        }
        
        // Return unsubscribe function
        return () => this.unsubscribe(path, callback);
    }

    /**
     * Remove a subscriber
     * @param {string} path
     * @param {Function} callback
     */
    unsubscribe(path, callback) {
        if (this._subscribers.has(path)) {
            this._subscribers.get(path).delete(callback);
            if (this._subscribers.get(path).size === 0) {
                this._subscribers.delete(path);
            }
        }
    }

    /**
     * Subscribe to multiple paths
     * @param {string[]} paths
     * @param {Function} callback - Called with array of values
     * @returns {Function} Unsubscribe function
     */
    subscribeMultiple(paths, callback) {
        const unsubscribers = paths.map(path => 
            this.subscribe(path, () => {
                const values = paths.map(p => this.get(p));
                callback(values);
            })
        );
        
        return () => unsubscribers.forEach(unsub => unsub());
    }

    /**
     * Notify all subscribers of a path change
     * @param {string} path
     * @param {*} newValue
     * @param {*} oldValue
     */
    _notifySubscribers(path, newValue, oldValue) {
        // Notify exact path subscribers
        if (this._subscribers.has(path)) {
            this._subscribers.get(path).forEach(callback => {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    console.error(`[State] Error in subscriber for "${path}":`, error);
                }
            });
        }
        
        // Notify parent path subscribers (e.g., 'auth' subscribers get notified for 'auth.user')
        const pathParts = path.split('.');
        for (let i = pathParts.length - 1; i >= 0; i--) {
            const parentPath = pathParts.slice(0, i).join('.');
            if (parentPath && this._subscribers.has(parentPath)) {
                const parentValue = this.get(parentPath);
                this._subscribers.get(parentPath).forEach(callback => {
                    try {
                        callback(parentValue);
                    } catch (error) {
                        console.error(`[State] Error in subscriber for "${parentPath}":`, error);
                    }
                });
            }
        }
        
        // Notify wildcard subscribers
        if (this._subscribers.has('*')) {
            this._subscribers.get('*').forEach(callback => {
                try {
                    callback(path, newValue, oldValue);
                } catch (error) {
                    console.error('[State] Error in wildcard subscriber:', error);
                }
            });
        }
    }

    /**
     * Register a computed property
     * @param {string} name - Computed property name
     * @param {string[]} dependencies - State paths this depends on
     * @param {Function} compute - Function to compute value from dependencies
     * @returns {Function} Unsubscribe function
     * 
     * @example
     * state.computed('fullName', ['auth.user.firstName', 'auth.user.lastName'], 
     *     (firstName, lastName) => `${firstName} ${lastName}`
     * );
     * 
     * const fullName = state.getComputed('fullName');
     */
    computed(name, dependencies, compute) {
        // Store computed function
        this._computed.set(name, { dependencies, compute, value: undefined });
        
        // Initial computation
        const values = dependencies.map(dep => this.get(dep));
        const initialValue = compute(...values);
        this._computed.get(name).value = initialValue;
        
        // Subscribe to dependencies
        const unsubscribers = dependencies.map(dep => 
            this.subscribe(dep, () => {
                const newValues = dependencies.map(d => this.get(d));
                const newValue = compute(...newValues);
                this._computed.get(name).value = newValue;
                this._notifySubscribers(`computed.${name}`, newValue);
            })
        );
        
        return () => unsubscribers.forEach(unsub => unsub());
    }

    /**
     * Get computed property value
     * @param {string} name
     * @returns {*}
     */
    getComputed(name) {
        return this._computed.has(name) ? this._computed.get(name).value : undefined;
    }

    /**
     * Recompute dependents when a path changes
     * @param {string} changedPath
     */
    _recomputeDependents(changedPath) {
        this._computed.forEach((config, name) => {
            if (config.dependencies.some(dep => 
                dep === changedPath || dep.startsWith(changedPath + '.')
            )) {
                const values = config.dependencies.map(dep => this.get(dep));
                const newValue = config.compute(...values);
                config.value = newValue;
                this._notifySubscribers(`computed.${name}`, newValue);
            }
        });
    }

    /**
     * Add middleware
     * @param {Function} middleware - (path, newValue, oldValue) => modifiedValue
     * @returns {Function} Remove middleware function
     */
    use(middleware) {
        this._middleware.push(middleware);
        return () => {
            const index = this._middleware.indexOf(middleware);
            if (index > -1) this._middleware.splice(index, 1);
        };
    }

    /**
     * Add to undo history
     * @param {string} path
     * @param {*} oldValue
     * @param {*} newValue
     */
    _addToHistory(path, oldValue, newValue) {
        // Remove future history if we're not at the end
        if (this._historyIndex < this._history.length - 1) {
            this._history = this._history.slice(0, this._historyIndex + 1);
        }
        
        this._history.push({
            path,
            oldValue: deepClone(oldValue),
            newValue: deepClone(newValue),
            timestamp: Date.now()
        });
        
        // Keep history within limit
        if (this._history.length > this._maxHistory) {
            this._history.shift();
        }
        
        this._historyIndex = this._history.length - 1;
    }

    /**
     * Undo last state change
     * @returns {boolean} Success
     */
    undo() {
        if (this._historyIndex < 0) return false;
        
        this._isUndoRedo = true;
        const entry = this._history[this._historyIndex];
        this.set(entry.path, entry.oldValue, { skipHistory: true });
        this._historyIndex--;
        this._isUndoRedo = false;
        
        eventBus.emit('state:undo', entry);
        return true;
    }

    /**
     * Redo last undone change
     * @returns {boolean} Success
     */
    redo() {
        if (this._historyIndex >= this._history.length - 1) return false;
        
        this._isUndoRedo = true;
        this._historyIndex++;
        const entry = this._history[this._historyIndex];
        this.set(entry.path, entry.newValue, { skipHistory: true });
        this._isUndoRedo = false;
        
        eventBus.emit('state:redo', entry);
        return true;
    }

    /**
     * Get undo/redo status
     * @returns {Object} { canUndo, canRedo, historyLength }
     */
    getHistoryStatus() {
        return {
            canUndo: this._historyIndex >= 0,
            canRedo: this._historyIndex < this._history.length - 1,
            historyLength: this._history.length,
            currentIndex: this._historyIndex
        };
    }

    /**
     * Clear undo history
     */
    clearHistory() {
        this._history = [];
        this._historyIndex = -1;
    }

    /**
     * Reset state to defaults
     * @param {boolean} keepPreferences - Keep user preferences
     */
    reset(keepPreferences = true) {
        const preferences = keepPreferences ? this.get('preferences') : null;
        this._initDefaultState();
        if (preferences) {
            this.set('preferences', preferences);
        }
        this.clearHistory();
        eventBus.emit('state:reset');
    }

    /**
     * Persist specific state paths to localStorage
     * @param {string[]} paths - Paths to persist
     */
    persist(paths) {
        // Will be implemented with storage integration
        eventBus.emit('state:persist', { paths });
    }

    /**
     * Hydrate state from localStorage
     * @param {string[]} paths - Paths to restore
     */
    hydrate(paths) {
        // Will be implemented with storage integration
        eventBus.emit('state:hydrate', { paths });
    }
}

// Create and export singleton instance
const state = new StateManager();

export { StateManager };
export default state;