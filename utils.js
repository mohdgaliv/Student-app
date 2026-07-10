/* ============================================
   UTILITY FUNCTIONS
   Reusable helper functions for the entire app
   ============================================ */

// ========== DOM UTILITIES ==========

/**
 * Select a single DOM element
 * @param {string} selector - CSS selector
 * @param {Element} parent - Parent element (default: document)
 * @returns {Element|null}
 */
export const $ = (selector, parent = document) => parent.querySelector(selector);

/**
 * Select all matching DOM elements
 * @param {string} selector - CSS selector
 * @param {Element} parent - Parent element (default: document)
 * @returns {NodeList}
 */
export const $$ = (selector, parent = document) => parent.querySelectorAll(selector);

/**
 * Create an HTML element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} attributes - Element attributes
 * @param {...(string|Element)} children - Child elements or text
 * @returns {Element}
 */
export function createElement(tag, attributes = {}, ...children) {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else if (key.startsWith('on')) {
            const event = key.substring(2).toLowerCase();
            element.addEventListener(event, value);
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else {
            element.setAttribute(key, value);
        }
    });
    
    // Append children
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Element) {
            element.appendChild(child);
        }
    });
    
    return element;
}

/**
 * Remove all children from an element
 * @param {Element} element
 */
export function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Insert HTML string into element
 * @param {Element} element
 * @param {string} html
 */
export function setHTML(element, html) {
    element.innerHTML = html;
}

/**
 * Get element by data attribute
 * @param {string} key - data attribute key
 * @param {string} value - data attribute value
 * @returns {Element|null}
 */
export function getByData(key, value) {
    return document.querySelector(`[data-${key}="${value}"]`);
}

// ========== CLASS TOGGLING ==========

/**
 * Toggle CSS class on element
 * @param {Element} element
 * @param {string} className
 * @param {boolean} force
 */
export function toggleClass(element, className, force) {
    element.classList.toggle(className, force);
}

/**
 * Add multiple classes
 * @param {Element} element
 * @param {...string} classNames
 */
export function addClasses(element, ...classNames) {
    element.classList.add(...classNames);
}

/**
 * Remove multiple classes
 * @param {Element} element
 * @param {...string} classNames
 */
export function removeClasses(element, ...classNames) {
    element.classList.remove(...classNames);
}

// ========== EVENT HANDLING ==========

/**
 * Add event listener with optional delegation
 * @param {Element} element
 * @param {string} event
 * @param {Function} handler
 * @param {Object} options
 */
export function on(element, event, handler, options = {}) {
    element.addEventListener(event, handler, options);
}

/**
 * Remove event listener
 * @param {Element} element
 * @param {string} event
 * @param {Function} handler
 */
export function off(element, event, handler) {
    element.removeEventListener(event, handler);
}

/**
 * Trigger a custom event
 * @param {Element} element
 * @param {string} eventName
 * @param {*} detail
 */
export function trigger(element, eventName, detail = {}) {
    const event = new CustomEvent(eventName, { detail, bubbles: true });
    element.dispatchEvent(event);
}

/**
 * Delegate event to parent
 * @param {Element} parent
 * @param {string} event
 * @param {string} selector
 * @param {Function} handler
 */
export function delegate(parent, event, selector, handler) {
    parent.addEventListener(event, (e) => {
        const target = e.target.closest(selector);
        if (target && parent.contains(target)) {
            handler.call(target, e);
        }
    });
}

// ========== DEBOUNCE & THROTTLE ==========

/**
 * Debounce function - delays execution until after wait ms
 * @param {Function} func
 * @param {number} wait - milliseconds
 * @returns {Function}
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function - ensures execution at most once per limit ms
 * @param {Function} func
 * @param {number} limit - milliseconds
 * @returns {Function}
 */
export function throttle(func, limit = 300) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}

// ========== UNIQUE ID GENERATOR ==========

/**
 * Generate a unique ID
 * @param {string} prefix
 * @returns {string}
 */
export function generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a short unique ID
 * @returns {string}
 */
export function shortId() {
    return Math.random().toString(36).substr(2, 8);
}

// ========== FORMATTING ==========

/**
 * Format a date
 * @param {Date|string} date
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string}
 */
export function formatDate(date, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options
    };
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(new Date(date));
}

/**
 * Format time
 * @param {Date|string} date
 * @returns {string}
 */
export function formatTime(date) {
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).format(new Date(date));
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {Date|string} date
 * @returns {string}
 */
export function timeAgo(date) {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);
    
    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    if (diffWeek < 4) return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`;
    if (diffMonth < 12) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
    return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
}

/**
 * Format number with commas
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format file size
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Truncate text
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

/**
 * Capitalize first letter
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert string to slug
 * @param {string} str
 * @returns {string}
 */
export function slugify(str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// ========== VALIDATION HELPERS ==========

/**
 * Check if value is empty
 * @param {*} value
 * @returns {boolean}
 */
export function isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number (basic)
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
    const phoneRegex = /^\+?[\d\s-()]{10,15}$/;
    return phoneRegex.test(phone);
}

/**
 * Validate URL
 * @param {string} url
 * @returns {boolean}
 */
export function isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate password strength
 * @param {string} password
 * @returns {Object} { isValid, score, feedback }
 */
export function validatePasswordStrength(password) {
    let score = 0;
    const feedback = [];
    
    if (password.length >= 8) score++;
    else feedback.push('At least 8 characters');
    
    if (/[A-Z]/.test(password)) score++;
    else feedback.push('One uppercase letter');
    
    if (/[a-z]/.test(password)) score++;
    else feedback.push('One lowercase letter');
    
    if (/[0-9]/.test(password)) score++;
    else feedback.push('One number');
    
    if (/[^A-Za-z0-9]/.test(password)) score++;
    else feedback.push('One special character');
    
    return {
        isValid: score >= 4,
        score,
        strength: score <= 2 ? 'Weak' : score <= 4 ? 'Medium' : 'Strong',
        feedback
    };
}

// ========== STORAGE HELPERS ==========

/**
 * Safe JSON parse
 * @param {string} str
 * @param {*} fallback
 * @returns {*}
 */
export function safeJSONParse(str, fallback = null) {
    try {
        return JSON.parse(str);
    } catch {
        return fallback;
    }
}

/**
 * Deep clone an object
 * @param {Object} obj
 * @returns {Object}
 */
export function deepClone(obj) {
    if (structuredClone) {
        return structuredClone(obj);
    }
    return JSON.parse(JSON.stringify(obj));
}

// ========== ARRAY/OBJECT HELPERS ==========

/**
 * Group array by key
 * @param {Array} array
 * @param {string} key
 * @returns {Object}
 */
export function groupBy(array, key) {
    return array.reduce((result, item) => {
        const groupKey = item[key];
        if (!result[groupKey]) result[groupKey] = [];
        result[groupKey].push(item);
        return result;
    }, {});
}

/**
 * Sort array by key
 * @param {Array} array
 * @param {string} key
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array}
 */
export function sortBy(array, key, order = 'asc') {
    return [...array].sort((a, b) => {
        const valA = a[key];
        const valB = b[key];
        const comparison = valA < valB ? -1 : valA > valB ? 1 : 0;
        return order === 'desc' ? -comparison : comparison;
    });
}

/**
 * Remove duplicates from array
 * @param {Array} array
 * @returns {Array}
 */
export function unique(array) {
    return [...new Set(array)];
}

/**
 * Pick specific keys from object
 * @param {Object} obj
 * @param {Array} keys
 * @returns {Object}
 */
export function pick(obj, keys) {
    return keys.reduce((result, key) => {
        if (obj.hasOwnProperty(key)) {
            result[key] = obj[key];
        }
        return result;
    }, {});
}

/**
 * Omit specific keys from object
 * @param {Object} obj
 * @param {Array} keys
 * @returns {Object}
 */
export function omit(obj, keys) {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
}

// ========== ASYNC HELPERS ==========

/**
 * Delay/sleep function
 * @param {number} ms - milliseconds
 * @returns {Promise}
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry async function
 * @param {Function} fn
 * @param {number} retries
 * @param {number} delay
 * @returns {Promise}
 */
export async function retry(fn, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1) throw error;
            await sleep(delay);
        }
    }
}

/**
 * Timeout for async function
 * @param {Promise} promise
 * @param {number} ms
 * @returns {Promise}
 */
export function withTimeout(promise, ms) {
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), ms)
    );
    return Promise.race([promise, timeout]);
}

// ========== DOM MEASUREMENT ==========

/**
 * Check if element is in viewport
 * @param {Element} element
 * @returns {boolean}
 */
export function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Get scroll position
 * @returns {Object} { x, y }
 */
export function getScrollPosition() {
    return {
        x: window.pageXOffset || document.documentElement.scrollLeft,
        y: window.pageYOffset || document.documentElement.scrollTop
    };
}

/**
 * Smooth scroll to element
 * @param {Element|string} target
 * @param {number} offset
 */
export function scrollTo(target, offset = 0) {
    const element = typeof target === 'string' ? $(target) : target;
    if (!element) return;
    
    const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: 'smooth' });
}

// ========== CLIPBOARD ==========

/**
 * Copy text to clipboard
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            return true;
        } catch {
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
}

// ========== DEVICE/PLATFORM DETECTION ==========

/**
 * Check if device is mobile
 * @returns {boolean}
 */
export function isMobile() {
    return /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) ||
           window.innerWidth < 768;
}

/**
 * Check if app is in standalone mode (PWA)
 * @returns {boolean}
 */
export function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           navigator.standalone ||
           document.referrer.includes('android-app://');
}

/**
 * Check online status
 * @returns {boolean}
 */
export function isOnline() {
    return navigator.onLine;
}

// ========== COLOR UTILITIES ==========

/**
 * Convert hex color to RGB
 * @param {string} hex
 * @returns {Object|null} { r, g, b }
 */
export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Generate random color
 * @returns {string}
 */
export function randomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

/**
 * Lighten a hex color
 * @param {string} hex
 * @param {number} percent
 * @returns {string}
 */
export function lightenColor(hex, percent) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const lighten = (color) => Math.min(255, Math.floor(color + (255 - color) * (percent / 100)));
    return `rgb(${lighten(rgb.r)}, ${lighten(rgb.g)}, ${lighten(rgb.b)})`;
}

// ========== MISC ==========

/**
 * Get query parameter from URL
 * @param {string} param
 * @returns {string|null}
 */
export function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * Set query parameter in URL
 * @param {string} param
 * @param {string} value
 */
export function setQueryParam(param, value) {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.replaceState({}, '', url);
}

/**
 * Encode HTML entities
 * @param {string} str
 * @returns {string}
 */
export function encodeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

/**
 * Decode HTML entities
 * @param {string} html
 * @returns {string}
 */
export function decodeHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}

// Default export for convenience
export default {
    $, $$, createElement, clearElement, setHTML, getByData,
    toggleClass, addClasses, removeClasses,
    on, off, trigger, delegate,
    debounce, throttle,
    generateId, shortId,
    formatDate, formatTime, timeAgo, formatNumber, formatFileSize,
    truncateText, capitalize, slugify,
    isEmpty, isValidEmail, isValidPhone, isValidURL, validatePasswordStrength,
    safeJSONParse, deepClone,
    groupBy, sortBy, unique, pick, omit,
    sleep, retry, withTimeout,
    isInViewport, getScrollPosition, scrollTo,
    copyToClipboard,
    isMobile, isStandalone, isOnline,
    hexToRgb, randomColor, lightenColor,
    getQueryParam, setQueryParam,
    encodeHTML, decodeHTML
};