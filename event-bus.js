/* ============================================
   EVENT BUS (Pub/Sub Pattern)
   Decoupled communication between components
   ============================================ */

/**
 * EventBus - Central event management system
 * Allows components to communicate without direct dependencies
 */
class EventBus {
    constructor() {
        /** @type {Map<string, Set<Function>>} */
        this._events = new Map();
        
        /** @type {Map<string, Set<Function>>} */
        this._onceEvents = new Map();
        
        /** @type {boolean} */
        this._debugMode = false;
    }

    /**
     * Enable debug logging
     * @param {boolean} enabled
     */
    setDebug(enabled = true) {
        this._debugMode = enabled;
    }

    /**
     * Log event if debug mode is on
     * @param {string} action 
     * @param {string} event 
     * @param {*} data 
     */
    _log(action, event, data) {
        if (this._debugMode) {
            console.log(`[EventBus] ${action}: "${event}"`, data || '');
        }
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Handler function
     * @returns {Function} Unsubscribe function
     * 
     * @example
     * const unsubscribe = eventBus.on('user:login', (user) => {
     *     console.log('User logged in:', user);
     * });
     * 
     * // Later: unsubscribe();
     */
    on(event, callback) {
        if (typeof callback !== 'function') {
            throw new Error('EventBus: callback must be a function');
        }

        if (!this._events.has(event)) {
            this._events.set(event, new Set());
        }

        this._events.get(event).add(callback);
        this._log('SUBSCRIBE', event);

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Subscribe to an event for one-time execution
     * @param {string} event - Event name
     * @param {Function} callback - Handler function
     * @returns {Function} Unsubscribe function
     */
    once(event, callback) {
        if (typeof callback !== 'function') {
            throw new Error('EventBus: callback must be a function');
        }

        if (!this._onceEvents.has(event)) {
            this._onceEvents.set(event, new Set());
        }

        const wrappedCallback = (...args) => {
            this._removeFromOnceEvents(event, wrappedCallback);
            callback(...args);
        };

        this._onceEvents.get(event).add(wrappedCallback);
        this._log('SUBSCRIBE_ONCE', event);

        return () => this._removeFromOnceEvents(event, wrappedCallback);
    }

    /**
     * Remove a specific callback from an event
     * @param {string} event - Event name
     * @param {Function} callback - Handler to remove
     */
    off(event, callback) {
        if (this._events.has(event)) {
            this._events.get(event).delete(callback);
            if (this._events.get(event).size === 0) {
                this._events.delete(event);
            }
        }

        if (this._onceEvents.has(event)) {
            this._onceEvents.get(event).delete(callback);
            if (this._onceEvents.get(event).size === 0) {
                this._onceEvents.delete(event);
            }
        }

        this._log('UNSUBSCRIBE', event);
    }

    /**
     * Remove a one-time callback
     * @param {string} event 
     * @param {Function} callback 
     */
    _removeFromOnceEvents(event, callback) {
        if (this._onceEvents.has(event)) {
            this._onceEvents.get(event).delete(callback);
            if (this._onceEvents.get(event).size === 0) {
                this._onceEvents.delete(event);
            }
        }
    }

    /**
     * Emit/Publish an event
     * @param {string} event - Event name
     * @param {...*} args - Data to pass to handlers
     * 
     * @example
     * eventBus.emit('user:login', { id: 1, name: 'John' });
     * eventBus.emit('notification:show', 'Success!', 'success');
     */
    emit(event, ...args) {
        this._log('EMIT', event, args);

        // Notify regular subscribers
        if (this._events.has(event)) {
            const callbacks = new Set(this._events.get(event));
            callbacks.forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`[EventBus] Error in handler for "${event}":`, error);
                }
            });
        }

        // Notify once subscribers
        if (this._onceEvents.has(event)) {
            const callbacks = new Set(this._onceEvents.get(event));
            callbacks.forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`[EventBus] Error in once handler for "${event}":`, error);
                }
            });
            // Once events are auto-removed after execution
            this._onceEvents.delete(event);
        }

        // Wildcard event (*) - notify listeners of all events
        if (event !== '*' && this._events.has('*')) {
            const callbacks = new Set(this._events.get('*'));
            callbacks.forEach(callback => {
                try {
                    callback(event, ...args);
                } catch (error) {
                    console.error(`[EventBus] Error in wildcard handler:`, error);
                }
            });
        }
    }

    /**
     * Remove all listeners for a specific event
     * @param {string} event - Event name (omit to clear all)
     */
    clear(event) {
        if (event) {
            this._events.delete(event);
            this._onceEvents.delete(event);
            this._log('CLEAR', event);
        } else {
            this._events.clear();
            this._onceEvents.clear();
            this._log('CLEAR_ALL', '');
        }
    }

    /**
     * Get all registered event names
     * @returns {string[]}
     */
    getEventNames() {
        const regularEvents = Array.from(this._events.keys());
        const onceEvents = Array.from(this._onceEvents.keys());
        return [...new Set([...regularEvents, ...onceEvents])];
    }

    /**
     * Get count of listeners for an event
     * @param {string} event
     * @returns {number}
     */
    listenerCount(event) {
        let count = 0;
        if (this._events.has(event)) {
            count += this._events.get(event).size;
        }
        if (this._onceEvents.has(event)) {
            count += this._onceEvents.get(event).size;
        }
        return count;
    }

    /**
     * Check if event has listeners
     * @param {string} event
     * @returns {boolean}
     */
    hasListeners(event) {
        return this.listenerCount(event) > 0;
    }
}

// Create and export singleton instance
const eventBus = new EventBus();

// Export both the class and singleton instance
export { EventBus };
export default eventBus;

// ========== STANDARD EVENT NAMES (Convention) ==========
/**
 * Common event naming conventions used in the app:
 * 
 * AUTH:
 *   'auth:login'         - User logged in
 *   'auth:logout'        - User logged out
 *   'auth:register'      - New user registered
 *   'auth:session-expired' - Session expired
 * 
 * NAVIGATION:
 *   'nav:navigate'       - Page navigation { page, params }
 *   'nav:back'           - Navigate back
 * 
 * UI:
 *   'ui:theme-change'    - Theme changed { theme }
 *   'ui:sidebar-toggle'  - Sidebar toggled
 *   'ui:modal-open'      - Modal opened { id, data }
 *   'ui:modal-close'     - Modal closed { id }
 *   'ui:toast-show'      - Show toast { message, type, duration }
 *   'ui:loading-show'    - Show loading
 *   'ui:loading-hide'    - Hide loading
 * 
 * DATA:
 *   'data:updated'       - Data updated { entity, id }
 *   'data:deleted'       - Data deleted { entity, id }
 *   'data:created'       - New data created { entity, data }
 * 
 * NETWORK:
 *   'network:online'     - App came online
 *   'network:offline'    - App went offline
 * 
 * NOTIFICATIONS:
 *   'notification:received' - New notification received
 *   'notification:read'     - Notification marked as read
 */