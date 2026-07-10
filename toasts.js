/* ============================================
   TOAST COMPONENT
   Programmatic toast notification helpers
   Works with notifications.js for display
   ============================================ */

import { generateId } from '../js/utils.js';

/**
 * Toast configuration presets
 */
export const ToastPresets = {
    // Success toasts
    saved: { message: 'Changes saved successfully!', type: 'success', icon: '💾' },
    updated: { message: 'Updated successfully!', type: 'success', icon: '✅' },
    deleted: { message: 'Deleted successfully!', type: 'success', icon: '🗑️' },
    submitted: { message: 'Submitted successfully!', type: 'success', icon: '📤' },
    uploaded: { message: 'File uploaded successfully!', type: 'success', icon: '📁' },
    copied: { message: 'Copied to clipboard!', type: 'success', icon: '📋' },
    synced: { message: 'Data synced successfully!', type: 'success', icon: '🔄' },
    completed: { message: 'Task completed!', type: 'success', icon: '🎉' },
    
    // Error toasts
    error: { message: 'Something went wrong. Please try again.', type: 'error', icon: '❌' },
    networkError: { message: 'Network error. Check your connection.', type: 'error', icon: '📡' },
    validationError: { message: 'Please fix the errors and try again.', type: 'error', icon: '⚠️' },
    authError: { message: 'Authentication failed. Please login again.', type: 'error', icon: '🔒' },
    uploadError: { message: 'File upload failed.', type: 'error', icon: '📁' },
    notFound: { message: 'Item not found.', type: 'error', icon: '🔍' },
    permissionDenied: { message: 'Permission denied.', type: 'error', icon: '🚫' },
    
    // Warning toasts
    unsavedChanges: { message: 'You have unsaved changes.', type: 'warning', icon: '⚠️' },
    sessionExpiring: { message: 'Your session is about to expire.', type: 'warning', icon: '⏰' },
    lowAttendance: { message: 'Attendance is below required threshold.', type: 'warning', icon: '📊' },
    deadlineNear: { message: 'Deadline is approaching!', type: 'warning', icon: '⏳' },
    
    // Info toasts
    reminder: { message: 'Don\'t forget to complete your assignments!', type: 'info', icon: '📝' },
    tip: { message: 'Pro tip: Use Ctrl+K to search!', type: 'info', icon: '💡' },
    update: { message: 'New update available!', type: 'info', icon: '🆕' },
    welcome: { message: 'Welcome back! Ready to study?', type: 'info', icon: '👋' },
    
    // Loading toasts
    saving: { message: 'Saving...', type: 'loading', icon: '💾' },
    loading: { message: 'Loading...', type: 'loading', icon: '⏳' },
    uploading: { message: 'Uploading...', type: 'loading', icon: '📤' },
    processing: { message: 'Processing...', type: 'loading', icon: '⚙️' },
    connecting: { message: 'Connecting...', type: 'loading', icon: '🔗' }
};

/**
 * Show a toast notification using the notifications module
 * @param {string|Object} options - Preset key or custom config
 * @param {Object} overrides - Override default values
 * @returns {Promise<string>} Toast ID
 * 
 * @example
 * // Using preset
 * showToast('saved');
 * 
 * // Using preset with override
 * showToast('saved', { message: 'Profile saved!' });
 * 
 * // Custom toast
 * showToast({
 *     message: 'Custom message',
 *     type: 'success',
 *     duration: 5000,
 *     action: { label: 'Undo', callback: () => undo() }
 * });
 */
export async function showToast(options, overrides = {}) {
    let config;
    
    // If string, treat as preset key
    if (typeof options === 'string') {
        config = { ...(ToastPresets[options] || { message: options, type: 'info' }), ...overrides };
    } else {
        config = { ...options, ...overrides };
    }
    
    try {
        const { default: notifications } = await import('../js/notifications.js');
        notifications.show(config);
        return config.id;
    } catch (error) {
        console.error('[Toast] Failed to show toast:', error);
        // Fallback: show alert
        alert(config.message);
        return null;
    }
}

/**
 * Show a success toast
 * @param {string} message
 * @param {Object} options
 */
export async function success(message, options = {}) {
    return showToast({ message, type: 'success', ...options });
}

/**
 * Show an error toast
 * @param {string} message
 * @param {Object} options
 */
export async function error(message, options = {}) {
    return showToast({ message, type: 'error', duration: 6000, ...options });
}

/**
 * Show a warning toast
 * @param {string} message
 * @param {Object} options
 */
export async function warning(message, options = {}) {
    return showToast({ message, type: 'warning', ...options });
}

/**
 * Show an info toast
 * @param {string} message
 * @param {Object} options
 */
export async function info(message, options = {}) {
    return showToast({ message, type: 'info', ...options });
}

/**
 * Show a loading toast (persistent until dismissed)
 * @param {string} message
 * @returns {Promise<string>} Toast ID (use to dismiss later)
 */
export async function loading(message = 'Loading...') {
    try {
        const { default: notifications } = await import('../js/notifications.js');
        return notifications.loading(message);
    } catch (error) {
        console.error('[Toast] Failed to show loading:', error);
        return null;
    }
}

/**
 * Dismiss a specific toast by ID
 * @param {string} id - Toast ID
 */
export async function dismiss(id) {
    if (!id) return;
    
    try {
        const { default: notifications } = await import('../js/notifications.js');
        notifications.dismiss(id);
    } catch (error) {
        console.error('[Toast] Failed to dismiss:', error);
    }
}

/**
 * Dismiss all active toasts
 */
export async function dismissAll() {
    try {
        const { default: notifications } = await import('../js/notifications.js');
        notifications.dismissAll();
    } catch (error) {
        console.error('[Toast] Failed to dismiss all:', error);
    }
}

/**
 * Show a toast with an action button
 * @param {string} message
 * @param {Object} action - { label, callback }
 * @param {Object} options
 * 
 * @example
 * showActionToast('Assignment deleted', {
 *     label: 'Undo',
 *     callback: () => restoreAssignment()
 * });
 */
export async function showActionToast(message, action, options = {}) {
    return showToast({
        message,
        type: options.type || 'info',
        action,
        duration: options.duration || 5000,
        ...options
    });
}

/**
 * Show a confirmation toast (stays until action or dismissed)
 * @param {string} message
 * @param {Object} actions - { confirm: { label, callback }, cancel: { label, callback } }
 */
export async function showConfirmToast(message, actions = {}) {
    const { confirm = { label: 'Confirm', callback: () => {} }, cancel = { label: 'Cancel', callback: () => {} } } = actions;
    
    return showToast({
        message,
        type: 'warning',
        duration: 0, // Persistent
        action: confirm,
        dismissible: true
    });
}

/**
 * Show a promise-based toast (loading → success/error)
 * @param {Promise} promise - The promise to track
 * @param {Object} messages - { loading, success, error }
 * @returns {Promise} Resolves with the promise result
 * 
 * @example
 * const result = await promiseToast(
 *     fetchData(),
 *     { loading: 'Fetching data...', success: 'Data loaded!', error: 'Failed to load' }
 * );
 */
export async function promiseToast(promise, messages = {}) {
    const {
        loading: loadingMsg = 'Processing...',
        success: successMsg = 'Completed!',
        error: errorMsg = 'Failed!'
    } = messages;
    
    const toastId = await loading(loadingMsg);
    
    try {
        const result = await promise;
        await dismiss(toastId);
        await success(successMsg);
        return result;
    } catch (err) {
        await dismiss(toastId);
        await error(errorMsg);
        throw err;
    }
}

/**
 * Create a toast HTML element manually (for use outside notifications system)
 * @param {Object} config
 * @returns {HTMLElement}
 */
export function createToastElement(config) {
    const {
        id = generateId('toast'),
        message = '',
        type = 'info',
        icon = '',
        duration = 4000,
        dismissible = true,
        action = null
    } = config;
    
    const toast = document.createElement('div');
    toast.className = `toast toast--${type} animate-slide-in-right`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('data-toast-id', id);
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        loading: '⏳'
    };
    
    const displayIcon = icon || icons[type] || 'ℹ️';
    
    toast.innerHTML = `
        <span class="toast__icon">${displayIcon}</span>
        <span class="toast__message">${escapeHTML(message)}</span>
        ${action ? `
            <button class="toast__action btn btn-xs btn-ghost" data-action>
                ${action.label}
            </button>
        ` : ''}
        ${dismissible ? `
            <button class="toast__close" aria-label="Dismiss" data-dismiss>✕</button>
        ` : ''}
    `;
    
    // Add event listeners
    const dismissBtn = toast.querySelector('[data-dismiss]');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => removeToast(toast));
    }
    
    const actionBtn = toast.querySelector('[data-action]');
    if (actionBtn && action) {
        actionBtn.addEventListener('click', () => {
            action.callback();
            removeToast(toast);
        });
    }
    
    // Auto dismiss
    if (duration > 0) {
        setTimeout(() => removeToast(toast), duration);
    }
    
    return toast;
}

/**
 * Remove a toast element from DOM
 * @param {HTMLElement} toastElement
 */
export function removeToast(toastElement) {
    if (!toastElement || !toastElement.parentNode) return;
    
    toastElement.classList.remove('animate-slide-in-right');
    toastElement.classList.add('animate-slide-out-right');
    
    toastElement.addEventListener('animationend', () => {
        if (toastElement.parentNode) {
            toastElement.parentNode.removeChild(toastElement);
        }
    }, { once: true });
    
    // Fallback removal
    setTimeout(() => {
        if (toastElement.parentNode) {
            toastElement.parentNode.removeChild(toastElement);
        }
    }, 500);
}

/**
 * Insert a toast element into the DOM
 * @param {HTMLElement} toastElement
 * @returns {HTMLElement} The inserted element
 */
export function insertToast(toastElement) {
    let container = document.getElementById('toast-container');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'true');
        document.body.appendChild(container);
    }
    
    container.appendChild(toastElement);
    return toastElement;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text
 * @returns {string}
 */
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export all
export default {
    showToast,
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
    dismissAll,
    showActionToast,
    showConfirmToast,
    promiseToast,
    createToastElement,
    removeToast,
    insertToast,
    ToastPresets
};