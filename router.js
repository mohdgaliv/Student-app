/* ============================================
   SPA ROUTER
   Hash-based routing with guards, params, and transitions
   ============================================ */

import eventBus from './event-bus.js';
import state from './state-manager.js';

/**
 * Router - Hash-based Single Page Application router
 * Features: lazy loading, guards, params, transitions, history
 */
class Router {
    constructor() {
        /** @type {Map<string, Object>} Registered routes */
        this._routes = new Map();
        
        /** @type {string} Current route path */
        this._currentRoute = '/';
        
        /** @type {string} Previous route path */
        this._previousRoute = null;
        
        /** @type {Object} Global route guards */
        this._guards = {
            beforeEach: null,
            afterEach: null
        };
        
        /** @type {string} Default route */
        this._defaultRoute = '/';
        
        /** @type {string} Route for unauthenticated users */
        this._loginRoute = '/login';
        
        /** @type {string} Route after login */
        this._homeRoute = '/dashboard';
        
        /** @type {Element} Container where pages render */
        this._container = null;
        
        /** @type {Object} Current page component */
        this._currentPage = null;
        
        /** @type {boolean} Whether router is initialized */
        this._initialized = false;
        
        /** @type {Function} Hash change handler */
        this._hashChangeHandler = null;
    }

    /**
     * Initialize the router
     * @param {Object} options
     * @param {string} options.container - CSS selector for page container
     * @param {string} options.defaultRoute - Default route
     * @param {string} options.loginRoute - Login page route
     * @param {string} options.homeRoute - Post-login home route
     */
    init(options = {}) {
        if (this._initialized) return;
        
        this._container = document.querySelector(options.container || '#main-content');
        this._defaultRoute = options.defaultRoute || '/';
        this._loginRoute = options.loginRoute || '/login';
        this._homeRoute = options.homeRoute || '/dashboard';
        
        // Listen for hash changes
        this._hashChangeHandler = () => this._handleRouteChange();
        window.addEventListener('hashchange', this._hashChangeHandler);
        
        // Handle initial route
        if (!window.location.hash) {
            window.location.hash = '#/';
        }
        this._handleRouteChange();
        
        this._initialized = true;
    }

    /**
     * Register a route
     * @param {string} path - Route path (e.g., '/dashboard', '/user/:id')
     * @param {Object} config - Route configuration
     * @param {Function|string} config.component - Page component or HTML file path
     * @param {string} config.title - Page title
     * @param {boolean} config.requiresAuth - Whether auth is required
     * @param {Array} config.guards - Route-specific guards
     * @param {Object} config.meta - Additional metadata
     * 
     * @example
     * router.addRoute('/dashboard', {
     *     component: () => import('./pages/dashboard.js'),
     *     title: 'Dashboard',
     *     requiresAuth: true
     * });
     */
    addRoute(path, config) {
        // Convert path to regex for param matching
        const paramNames = [];
        const regexPath = path.replace(/:([^/]+)/g, (_, paramName) => {
            paramNames.push(paramName);
            return '([^/]+)';
        });
        
        this._routes.set(path, {
            ...config,
            regex: new RegExp(`^${regexPath}$`),
            paramNames,
            path
        });
        
        return this;
    }

    /**
     * Register multiple routes at once
     * @param {Array} routes - Array of [path, config] pairs
     * 
     * @example
     * router.addRoutes([
     *     ['/login', { component: LoginPage, title: 'Login' }],
     *     ['/register', { component: RegisterPage, title: 'Register' }]
     * ]);
     */
    addRoutes(routes) {
        routes.forEach(([path, config]) => this.addRoute(path, config));
        return this;
    }

    /**
     * Set global route guards
     * @param {string} type - 'beforeEach' | 'afterEach'
     * @param {Function} guard - (to, from, next) => void
     */
    setGuard(type, guard) {
        if (type in this._guards) {
            this._guards[type] = guard;
        }
        return this;
    }

    /**
     * Navigate to a route
     * @param {string} path - Route path
     * @param {Object} options
     * @param {Object} options.params - Route params
     * @param {Object} options.query - Query parameters
     * @param {boolean} options.replace - Replace history entry
     * 
     * @example
     * router.navigate('/user/123');
     * router.navigate('/dashboard', { replace: true });
     */
    navigate(path, options = {}) {
        const { params = {}, query = {}, replace = false } = options;
        
        // Build hash URL
        let hash = '#' + path;
        
        // Add query params
        const queryString = new URLSearchParams(query).toString();
        if (queryString) {
            hash += '?' + queryString;
        }
        
        if (replace) {
            window.location.replace(hash);
        } else {
            window.location.hash = hash;
        }
    }

    /**
     * Navigate back
     */
    back() {
        window.history.back();
    }

    /**
     * Navigate forward
     */
    forward() {
        window.history.forward();
    }

    /**
     * Get current route info
     * @returns {Object}
     */
    getCurrentRoute() {
        return {
            path: this._currentRoute,
            params: this._currentParams || {},
            query: this._currentQuery || {}
        };
    }

    /**
     * Handle hash change
     */
    async _handleRouteChange() {
        const hash = window.location.hash.slice(1) || '/';
        
        // Parse path and query
        const [path, queryString] = hash.split('?');
        const query = {};
        if (queryString) {
            new URLSearchParams(queryString).forEach((value, key) => {
                query[key] = value;
            });
        }
        
        // Find matching route
        let matchedRoute = null;
        let params = {};
        
        for (const [routePath, config] of this._routes) {
            const match = path.match(config.regex);
            if (match) {
                matchedRoute = config;
                // Extract params
                config.paramNames.forEach((name, index) => {
                    params[name] = match[index + 1];
                });
                break;
            }
        }
        
        // If no route matched, redirect to default
        if (!matchedRoute) {
            if (this._routes.has(this._defaultRoute)) {
                return this.navigate(this._defaultRoute, { replace: true });
            }
            console.warn(`[Router] No route found for: ${path}`);
            return;
        }
        
        // Store current and previous
        this._previousRoute = this._currentRoute;
        this._currentRoute = path;
        this._currentParams = params;
        this._currentQuery = query;
        
        // Build route context
        const to = { path, params, query, meta: matchedRoute.meta || {} };
        const from = { 
            path: this._previousRoute, 
            params: this._previousParams || {},
            query: this._previousQuery || {}
        };
        
        // Run before guard
        const canProceed = await this._runGuards(to, from);
        if (!canProceed) return;
        
        // Check authentication
        if (matchedRoute.requiresAuth) {
            const isLoggedIn = state.get('auth.isLoggedIn');
            if (!isLoggedIn) {
                eventBus.emit('nav:redirect-to-login', { from: to });
                return this.navigate(this._loginRoute, { 
                    query: { redirect: path } 
                });
            }
        }
        
        // Render the page
        await this._renderPage(matchedRoute, to);
        
        // Update page title
        document.title = matchedRoute.title 
            ? `${matchedRoute.title} - Student App` 
            : 'Student App';
        
        // Update state
        state.batch({
            'ui.activePage': path,
            'ui.previousPage': this._previousRoute,
            'ui.pageParams': params,
            'navigation.currentRoute': path,
            'navigation.previousRoute': this._previousRoute,
            'navigation.params': params
        });
        
        // Add to history
        const history = state.get('navigation.history', []);
        history.push({ path, params, query, timestamp: Date.now() });
        if (history.length > 50) history.shift();
        state.set('navigation.history', history);
        
        // Run after guard
        if (this._guards.afterEach) {
            this._guards.afterEach(to, from);
        }
        
        // Emit event
        eventBus.emit('nav:navigate', { to, from });
    }

    /**
     * Run route guards
     * @param {Object} to
     * @param {Object} from
     * @returns {Promise<boolean>} Whether to proceed
     */
    async _runGuards(to, from) {
        if (this._guards.beforeEach) {
            try {
                const result = await this._guards.beforeEach(to, from);
                if (result === false) return false;
                if (typeof result === 'string') {
                    this.navigate(result);
                    return false;
                }
            } catch (error) {
                console.error('[Router] Guard error:', error);
                return false;
            }
        }
        return true;
    }

    /**
     * Render the page component
     * @param {Object} routeConfig
     * @param {Object} context
     */
    async _renderPage(routeConfig, context) {
        if (!this._container) {
            console.error('[Router] No container found');
            return;
        }
        
        try {
            // Show loading
            eventBus.emit('ui:loading-show', 'page');
            
            let component;
            
            // Handle different component types
            if (typeof routeConfig.component === 'function') {
                // Lazy loaded component
                const module = await routeConfig.component();
                component = module.default || module;
            } else if (typeof routeConfig.component === 'string') {
                // HTML template path - fetch and render
                const response = await fetch(routeConfig.component);
                const html = await response.text();
                this._container.innerHTML = html;
                eventBus.emit('ui:loading-hide', 'page');
                return;
            } else if (typeof routeConfig.component === 'object') {
                // Pre-loaded component
                component = routeConfig.component;
            }
            
            // If component has a render method
            if (component && typeof component.render === 'function') {
                // Clean up previous page
                if (this._currentPage && typeof this._currentPage.destroy === 'function') {
                    this._currentPage.destroy();
                }
                
                // Render new page
                const html = await component.render(context);
                this._container.innerHTML = html;
                
                // Call mounted lifecycle
                if (typeof component.mounted === 'function') {
                    component.mounted(context);
                }
                
                this._currentPage = component;
            } else if (component && typeof component === 'function') {
                // Simple function component
                const html = await component(context);
                this._container.innerHTML = html;
            }
            
            // Scroll to top on navigation
            window.scrollTo({ top: 0, behavior: 'instant' });
            
            // Hide loading
            eventBus.emit('ui:loading-hide', 'page');
            
        } catch (error) {
            console.error('[Router] Error rendering page:', error);
            this._container.innerHTML = `
                <div class="empty-state-center">
                    <div class="empty-state__icon">⚠️</div>
                    <h3 class="empty-state__title">Page Error</h3>
                    <p class="empty-state__description">
                        Failed to load this page. Please try again.
                    </p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        Reload
                    </button>
                </div>
            `;
            eventBus.emit('ui:loading-hide', 'page');
        }
    }

    /**
     * Get route params
     * @param {string} paramName
     * @returns {string|null}
     */
    getParam(paramName) {
        return this._currentParams?.[paramName] || null;
    }

    /**
     * Get query params
     * @param {string} key
     * @returns {string|null}
     */
    getQuery(key) {
        return this._currentQuery?.[key] || null;
    }

    /**
     * Destroy the router
     */
    destroy() {
        if (this._hashChangeHandler) {
            window.removeEventListener('hashchange', this._hashChangeHandler);
        }
        this._routes.clear();
        this._initialized = false;
    }
}

// Create and export singleton
const router = new Router();

export { Router };
export default router;