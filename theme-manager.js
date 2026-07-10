/* ============================================
   THEME MANAGER
   Dark/Light mode with system preference detection
   ============================================ */

import storage from './storage.js';
import eventBus from './event-bus.js';

/**
 * ThemeManager - Manages app theme (light/dark/auto)
 * Features: system preference detection, persistence, smooth transitions
 */
class ThemeManager {
  constructor() {
    /** @type {string} Current theme: 'light' | 'dark' | 'auto' */
    this._currentTheme = 'light';
    
    /** @type {string} Actually applied theme */
    this._appliedTheme = 'light';
    
    /** @type {MediaQueryList} System dark mode query */
    this._darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    /** @type {boolean} Whether to enable transitions */
    this._transitionsEnabled = true;
    
    /** @type {Function} System preference change handler */
    this._systemChangeHandler = null;
  }
  
  /**
   * Initialize theme manager
   * @returns {string} Applied theme
   */
  init() {
    // Load saved preference
    const saved = storage.get('theme', 'auto');
    this.setTheme(saved);
    
    // Listen for system preference changes
    this._listenToSystemChanges();
    
    // Set up transition class after initial load
    setTimeout(() => {
      document.documentElement.classList.add('theme-ready');
    }, 100);
    
    return this._appliedTheme;
  }
  
  /**
   * Set the theme
   * @param {string} theme - 'light' | 'dark' | 'auto'
   */
  setTheme(theme) {
    if (!['light', 'dark', 'auto'].includes(theme)) {
      console.warn(`[Theme] Invalid theme: "${theme}". Using "auto".`);
      theme = 'auto';
    }
    
    this._currentTheme = theme;
    
    // Determine actual theme to apply
    if (theme === 'auto') {
      this._appliedTheme = this._darkModeQuery.matches ? 'dark' : 'light';
      this._listenToSystemChanges();
    } else {
      this._appliedTheme = theme;
      this._stopListeningToSystemChanges();
    }
    
    // Apply to DOM
    this._applyTheme(this._appliedTheme);
    
    // Save preference
    storage.set('theme', theme);
    
    // Notify
    eventBus.emit('ui:theme-change', {
      preference: this._currentTheme,
      applied: this._appliedTheme
    });
  }
  
  /**
   * Toggle between light and dark
   * @returns {string} New applied theme
   */
  toggle() {
    const newTheme = this._appliedTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    return this._appliedTheme;
  }
  
  /**
   * Get current theme info
   * @returns {Object} { preference, applied, isDark }
   */
  getTheme() {
    return {
      preference: this._currentTheme,
      applied: this._appliedTheme,
      isDark: this._appliedTheme === 'dark'
    };
  }
  
  /**
   * Check if dark mode is active
   * @returns {boolean}
   */
  isDark() {
    return this._appliedTheme === 'dark';
  }
  
  /**
   * Apply theme to DOM
   * @param {string} theme - 'light' | 'dark'
   */
  _applyTheme(theme) {
    // Set data attribute on HTML element
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.content = theme === 'dark' ? '#0F172A' : '#4A90D9';
    }
    
    // Update status bar color for mobile PWA
    const metaStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (metaStatusBar) {
      metaStatusBar.content = theme === 'dark' ? 'black' : 'default';
    }
    
    // CSS class for body
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);
  }
  
  /**
   * Listen for system color scheme changes
   */
  _listenToSystemChanges() {
    if (this._systemChangeHandler) return;
    
    this._systemChangeHandler = (e) => {
      if (this._currentTheme === 'auto') {
        this._appliedTheme = e.matches ? 'dark' : 'light';
        this._applyTheme(this._appliedTheme);
        eventBus.emit('ui:theme-change', {
          preference: 'auto',
          applied: this._appliedTheme,
          systemTriggered: true
        });
      }
    };
    
    this._darkModeQuery.addEventListener('change', this._systemChangeHandler);
  }
  
  /**
   * Stop listening for system changes
   */
  _stopListeningToSystemChanges() {
    if (this._systemChangeHandler) {
      this._darkModeQuery.removeEventListener('change', this._systemChangeHandler);
      this._systemChangeHandler = null;
    }
  }
  
  /**
   * Enable/disable transition animations
   * @param {boolean} enabled
   */
  setTransitions(enabled) {
    this._transitionsEnabled = enabled;
    if (!enabled) {
      document.documentElement.classList.add('no-theme-transition');
      setTimeout(() => {
        document.documentElement.classList.remove('no-theme-transition');
      }, 50);
    }
  }
  
  /**
   * Get CSS color value from current theme
   * @param {string} variableName - CSS variable name (without --)
   * @returns {string}
   */
  getColor(variableName) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(`--${variableName}`)
      .trim();
  }
  
  /**
   * Get all available themes
   * @returns {Array}
   */
  getAvailableThemes() {
    return [
      { id: 'light', name: 'Light', icon: '☀️' },
      { id: 'dark', name: 'Dark', icon: '🌙' },
      { id: 'auto', name: 'Auto', icon: '🔄' }
    ];
  }
}

// Create and export singleton
const themeManager = new ThemeManager();

export { ThemeManager };
export default themeManager;