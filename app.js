/* ============================================
   APP INITIALIZATION
   Boot sequence, module initialization, lifecycle
   ============================================ */

import eventBus from './event-bus.js';
import state from './state-manager.js';
import storage from './storage.js';
import themeManager from './theme-manager.js';
import router from './router.js';
import auth from './auth.js';
import api from './api.js';
import notifications from './notifications.js';
import pwa from './pwa.js';
import { isOnline, isMobile, isStandalone } from './utils.js';

class App {
    constructor() {
        this._initialized = false;
        this.version = '1.0.0';
        this.config = {
            apiBaseURL: '',
            firebaseConfig: null,
            defaultTheme: 'auto',
            debug: false,
            enablePWA: true,
            enableAnalytics: false
        };
    }
    
    async init(options = {}) {
        if (this._initialized) {
            console.warn('[App] Already initialized');
            return;
        }
        
        Object.assign(this.config, options);
        
        if (this.config.debug) {
            eventBus.setDebug(true);
            state.setDebug(true);
            console.log('[App] Starting initialization...');
        }
        
        try {
            console.log('[App] State manager ready');
            
            await this._initTheme();
            
            notifications.init();
            
            if (this.config.enablePWA) {
                await pwa.init();
            }
            
            if (this.config.apiBaseURL) {
                api.configure({
                    baseURL: this.config.apiBaseURL,
                    debug: this.config.debug
                });
            }
            
            await auth.init({ mode: 'local' });
            
            this._setupGlobalListeners();
            
            // ========== REGISTER ALL ROUTES ==========
            router.addRoutes([
                ['/splash', { component: 'pages/splash.html', title: 'Student App', requiresAuth: false }],
                ['/onboarding', { component: 'pages/onboarding.html', title: 'Welcome', requiresAuth: false }],
                ['/login', { component: 'pages/login.html', title: 'Login', requiresAuth: false }],
                ['/register', { component: 'pages/register.html', title: 'Register', requiresAuth: false }],
                ['/forgot-password', { component: 'pages/forgot-password.html', title: 'Forgot Password', requiresAuth: false }],
                ['/otp', { component: 'pages/otp.html', title: 'Verify OTP', requiresAuth: false }],
                ['/dashboard', { component: 'pages/dashboard.html', title: 'Dashboard', requiresAuth: true }],
                ['/profile', { component: 'pages/profile.html', title: 'Profile', requiresAuth: true }],
                ['/attendance', { component: 'pages/attendance.html', title: 'Attendance', requiresAuth: true }],
                ['/homework', { component: 'pages/homework.html', title: 'Homework', requiresAuth: true }],
                ['/assignments', { component: 'pages/assignments.html', title: 'Assignments', requiresAuth: true }],
                ['/notes', { component: 'pages/notes.html', title: 'Notes', requiresAuth: true }],
                ['/timetable', { component: 'pages/timetable.html', title: 'Timetable', requiresAuth: true }],
                ['/calendar', { component: 'pages/calendar.html', title: 'Calendar', requiresAuth: true }],
                ['/subjects', { component: 'pages/subjects.html', title: 'Subjects', requiresAuth: true }],
                ['/teachers', { component: 'pages/teachers.html', title: 'Teachers', requiresAuth: true }],
                ['/quiz', { component: 'pages/quiz.html', title: 'Quiz', requiresAuth: true }],
                ['/mock-test', { component: 'pages/mock-test.html', title: 'Mock Test', requiresAuth: true }],
                ['/results', { component: 'pages/results.html', title: 'Results', requiresAuth: true }],
                ['/progress', { component: 'pages/progress.html', title: 'Progress', requiresAuth: true }],
                ['/ai-assistant', { component: 'pages/ai-assistant.html', title: 'AI Assistant', requiresAuth: true }],
                ['/notifications', { component: 'pages/notifications.html', title: 'Notifications', requiresAuth: false }],
                ['/settings', { component: 'pages/settings.html', title: 'Settings', requiresAuth: false }],
                ['/about', { component: 'pages/about.html', title: 'About', requiresAuth: false }],
                ['/contact', { component: 'pages/contact.html', title: 'Contact', requiresAuth: false }],
                ['/feedback', { component: 'pages/feedback.html', title: 'Feedback', requiresAuth: false }]
            ]);
            // ========== END ROUTE REGISTRATION ==========
            
            // Initialize router (AFTER registering routes)
            router.init({
                container: '#main-content',
                defaultRoute: '/splash',
                loginRoute: '/login',
                homeRoute: '/dashboard'
            });
            
            state.set('app.initialized', true);
            state.set('app.loading', false);
            state.set('app.firstLaunch', !storage.get('has_launched'));
            
            this._hideLoadingScreen();
            
            // Navigate to correct first page
            if (state.get('app.firstLaunch')) {
                storage.set('has_launched', true);
                setTimeout(() => router.navigate('/splash', { replace: true }), 200);
            } else {
                const isLoggedIn = auth.isAuthenticated();
                setTimeout(() => {
                    router.navigate(isLoggedIn ? '/dashboard' : '/login', { replace: true });
                }, 200);
            }
            
            this._logAppInfo();
            this._initialized = true;
            
            console.log('[App] Initialization complete ✅');
            eventBus.emit('app:ready');
            
        } catch (error) {
            console.error('[App] Initialization failed:', error);
            this._showErrorScreen(error);
        }
    }
    
    async _initTheme() {
        const savedTheme = storage.get('theme', this.config.defaultTheme);
        themeManager.init();
        state.set('preferences.theme', savedTheme);
        document.body.classList.add(`theme-${themeManager.isDark() ? 'dark' : 'light'}`);
    }
    
    _setupGlobalListeners() {
        eventBus.on('ui:loading-show', () => {
            const queue = state.get('ui.loadingQueue', 0);
            state.set('ui.loadingQueue', queue + 1);
            if (queue === 0) {
                document.getElementById('loading-screen')?.classList.remove('hidden');
            }
        });
        
        eventBus.on('ui:loading-hide', () => {
            const queue = Math.max(0, state.get('ui.loadingQueue', 0) - 1);
            state.set('ui.loadingQueue', queue);
            if (queue === 0) {
                document.getElementById('loading-screen')?.classList.add('hidden');
            }
        });
        
        window.addEventListener('online', () => {
            state.set('app.online', true);
            notifications.success('Back online!');
        });
        
        window.addEventListener('offline', () => {
            state.set('app.online', false);
            notifications.warning('You are offline', { duration: 3000 });
        });
        
        window.addEventListener('error', (event) => {
            console.error('[App] Global error:', event.error);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('[App] Unhandled rejection:', event.reason);
        });
        
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                eventBus.emit('ui:search-open');
            }
        });
        
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                eventBus.emit('app:resume');
                pwa.checkForUpdate();
            } else {
                eventBus.emit('app:pause');
            }
        });
    }
    
    _hideLoadingScreen() {
        const loader = document.getElementById('loading-screen');
        if (loader) {
            loader.style.opacity = '0';
            loader.style.transition = 'opacity 300ms ease';
            setTimeout(() => loader.remove(), 300);
        }
    }
    
    _showErrorScreen(error) {
        const main = document.getElementById('main-content');
        if (main) {
            main.innerHTML = `
                <div class="empty-state-center">
                    <div class="empty-state__icon">🚨</div>
                    <h3 class="empty-state__title">App Initialization Failed</h3>
                    <p class="empty-state__description">${error.message || 'Something went wrong'}</p>
                    <button class="btn btn-primary" onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    }
    
    _logAppInfo() {
        console.log('[App] Environment Info:', {
            version: this.version,
            platform: navigator.platform,
            language: navigator.language,
            online: isOnline(),
            mobile: isMobile(),
            standalone: isStandalone(),
            screenSize: `${window.innerWidth}x${window.innerHeight}`
        });
    }
    
    getStatus() {
        return {
            initialized: this._initialized,
            version: this.version,
            online: state.get('app.online'),
            authenticated: auth.isAuthenticated(),
            theme: themeManager.getTheme()
        };
    }
}

const app = new App();

export { App };
export default app;

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app.init({ debug: true, defaultTheme: 'auto', enablePWA: true });
    });
} else {
    app.init({ debug: true, defaultTheme: 'auto', enablePWA: true });
}