/* ============================================
   NOTIFICATION MANAGER
   Toast notifications and in-app alerts
   ============================================ */

import eventBus from './event-bus.js';
import state from './state-manager.js';
import { generateId } from './utils.js';

/**
 * NotificationManager - Toast notifications & alerts
 * Features: queue, stacking, auto-dismiss, actions, sounds
 */
class NotificationManager {
    constructor() {
        /** @type {Element} Toast container */
        this._container = null;
        
        /** @type {Array} Active toasts */
        this._activeToasts = [];
        
        /** @type {Array} Queued toasts */
        this._queue = [];
        
        /** @type {number} Max visible toasts */
        this._maxVisible = 5;
        
        /** @type {number} Default duration */
        this._defaultDuration = 4000;
        
        /** @type {Object} Sound effects */
        this._sounds = {
            success: null,
            error: null,
            warning: null,
            info: null
        };
        
        /** @type {boolean} Sound enabled */
        this._soundEnabled = true;
        
        /** @type {boolean} Initialized */
        this._initialized = false;
        
        /** @type {Object} Icon mappings */
        this._icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            loading: '⏳'
        };
    }

    /**
     * Initialize notification system
     */
    init() {
        if (this._initialized) return;
        
        // Find or create container
        this._container = document.getElementById('toast-container');
        
        if (!this._container) {
            this._container = document.createElement('div');
            this._container.id = 'toast-container';
            this._container.className = 'toast-container';
            this._container.setAttribute('aria-live', 'polite');
            this._container.setAttribute('aria-atomic', 'true');
            document.body.appendChild(this._container);
        }
        
        // Listen for toast events
        eventBus.on('ui:toast-show', (options) => this.show(options));
        eventBus.on('ui:toast-dismiss-all', () => this.dismissAll());
        
        // Listen for sound preference changes
        state.subscribe('preferences.soundEnabled', (enabled) => {
            this._soundEnabled = enabled;
        });
        
        this._initialized = true;
    }

    /**
     * Show a toast notification
     * @param {string|Object} options - Message string or config object
     * 
     * @example
     * // Simple
     * notifications.show('Hello!');
     * 
     * // Advanced
     * notifications.show({
     *     message: 'Profile saved!',
     *     type: 'success',
     *     duration: 5000,
     *     icon: '🎉',
     *     action: { label: 'Undo', callback: () => {} }
     * });
     */
    show(options) {
        // Normalize options
        if (typeof options === 'string') {
            options = { message: options };
        }
        
        const config = {
            id: generateId('toast'),
            message: options.message || '',
            type: options.type || 'info',
            duration: options.duration || this._defaultDuration,
            icon: options.icon || this._icons[options.type] || 'ℹ️',
            action: options.action || null,
            dismissible: options.dismissible !== false,
            createdAt: Date.now()
        };
        
        // If max visible reached, queue it
        if (this._activeToasts.length >= this._maxVisible) {
            this._queue.push(config);
            return;
        }
        
        this._renderToast(config);
        
        // Play sound
        if (this._soundEnabled) {
            this._playSound(config.type);
        }
    }

    /**
     * Show success toast
     * @param {string} message
     * @param {Object} options
     */
    success(message, options = {}) {
        this.show({ ...options, message, type: 'success' });
    }

    /**
     * Show error toast
     * @param {string} message
     * @param {Object} options
     */
    error(message, options = {}) {
        this.show({ ...options, message, type: 'error', duration: 6000 });
    }

    /**
     * Show warning toast
     * @param {string} message
     * @param {Object} options
     */
    warning(message, options = {}) {
        this.show({ ...options, message, type: 'warning' });
    }

    /**
     * Show info toast
     * @param {string} message
     * @param {Object} options
     */
    info(message, options = {}) {
        this.show({ ...options, message, type: 'info' });
    }

    /**
     * Show loading toast (persistent)
     * @param {string} message
     * @returns {string} Toast ID for dismissal
     */
    loading(message = 'Loading...') {
        const id = generateId('toast');
        this.show({
            id,
            message,
            type: 'loading',
            duration: 0, // Persistent
            dismissible: false,
            icon: '⏳'
        });
        return id;
    }

    /**
     * Render a toast element
     * @param {Object} config
     */
    _renderToast(config) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast--${config.type} animate-slide-in-right`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('data-toast-id', config.id);
        
        // Toast content
        toast.innerHTML = `
            <span class="toast__icon">${config.icon}</span>
            <span class="toast__message">${this._escapeHTML(config.message)}</span>
            ${config.action ? `
                <button class="toast__action btn btn-xs btn-ghost" data-action>
                    ${config.action.label}
                </button>
            ` : ''}
            ${config.dismissible ? `
                <button class="toast__close" aria-label="Dismiss" data-dismiss>
                    ✕
                </button>
            ` : ''}
        `;
        
        // Event listeners
        const dismissBtn = toast.querySelector('[data-dismiss]');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => this.dismiss(config.id));
        }
        
        const actionBtn = toast.querySelector('[data-action]');
        if (actionBtn && config.action) {
            actionBtn.addEventListener('click', () => {
                config.action.callback();
                this.dismiss(config.id);
            });
        }
        
        // Add to container
        this._container.appendChild(toast);
        this._activeToasts.push({ id: config.id, element: toast, config });
        
        // Auto dismiss
        if (config.duration > 0) {
            setTimeout(() => {
                this.dismiss(config.id);
            }, config.duration);
        }
        
        // Add to state
        const toasts = state.get('ui.toasts', []);
        toasts.push({ id: config.id, message: config.message, type: config.type });
        state.set('ui.toasts', toasts);
    }

    /**
     * Dismiss a specific toast
     * @param {string} id - Toast ID
     */
    dismiss(id) {
        const index = this._activeToasts.findIndex(t => t.id === id);
        if (index === -1) return;
        
        const { element } = this._activeToasts[index];
        
        // Animate out
        element.classList.remove('animate-slide-in-right');
        element.classList.add('animate-slide-out-right');
        
        // Remove after animation
        element.addEventListener('animationend', () => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, { once: true });
        
        // Fallback removal
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 500);
        
        this._activeToasts.splice(index, 1);
        
        // Update state
        const toasts = state.get('ui.toasts', []);
        state.set('ui.toasts', toasts.filter(t => t.id !== id));
        
        // Process queue
        this._processQueue();
    }

    /**
     * Dismiss all toasts
     */
    dismissAll() {
        [...this._activeToasts].forEach(t => this.dismiss(t.id));
        this._queue = [];
    }

    /**
     * Process the toast queue
     */
    _processQueue() {
        while (this._queue.length > 0 && this._activeToasts.length < this._maxVisible) {
            const next = this._queue.shift();
            this._renderToast(next);
        }
    }

    /**
     * Play notification sound
     * @param {string} type
     */
    _playSound(type) {
        // Use Web Audio API for simple sounds
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            // Configure sound based on type
            switch (type) {
                case 'success':
                    oscillator.frequency.value = 800;
                    gainNode.gain.value = 0.1;
                    oscillator.type = 'sine';
                    break;
                case 'error':
                    oscillator.frequency.value = 300;
                    gainNode.gain.value = 0.1;
                    oscillator.type = 'sawtooth';
                    break;
                case 'warning':
                    oscillator.frequency.value = 500;
                    gainNode.gain.value = 0.1;
                    oscillator.type = 'triangle';
                    break;
                default:
                    oscillator.frequency.value = 600;
                    gainNode.gain.value = 0.05;
                    oscillator.type = 'sine';
            }
            
            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
            oscillator.stop(audioCtx.currentTime + 0.3);
        } catch (e) {
            // Audio not supported, silently fail
        }
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text
     * @returns {string}
     */
    _escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get active toast count
     * @returns {number}
     */
    getActiveCount() {
        return this._activeToasts.length + this._queue.length;
    }

    /**
     * Configure max visible toasts
     * @param {number} max
     */
    setMaxVisible(max) {
        this._maxVisible = max;
    }
}

// Create and export singleton
const notifications = new NotificationManager();

export { NotificationManager };
export default notifications;