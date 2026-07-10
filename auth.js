/* ============================================
   AUTHENTICATION MANAGER
   Firebase-ready auth with session management
   ============================================ */

import state from './state-manager.js';
import storage from './storage.js';
import api from './api.js';
import eventBus from './event-bus.js';
import { generateId, sleep, isValidEmail } from './utils.js';

/**
 * AuthManager - Handles authentication, sessions, and user state
 * Firebase-ready architecture with local auth fallback
 */
class AuthManager {
    constructor() {
        /** @type {string} Auth mode: 'firebase' | 'local' */
        this._mode = 'local';
        
        /** @type {Object} Firebase auth instance (set when Firebase initializes) */
        this._firebaseAuth = null;
        
        /** @type {boolean} Whether auth is initialized */
        this._initialized = false;
        
        /** @type {number} Session timeout in ms (default 7 days) */
        this._sessionTimeout = 7 * 24 * 60 * 60 * 1000;
        
        /** @type {number} Token refresh threshold in ms (5 minutes before expiry) */
        this._refreshThreshold = 5 * 60 * 1000;
        
        /** @type {number} Interval for token refresh check */
        this._refreshInterval = null;
        
        /** @type {Object} Cached user profile */
        this._cachedProfile = null;
    }

    /**
     * Initialize auth system
     * @param {Object} options
     * @param {string} options.mode - 'firebase' | 'local'
     * @param {Object} options.firebaseAuth - Firebase auth instance
     */
    async init(options = {}) {
        if (this._initialized) return;
        
        this._mode = options.mode || 'local';
        
        if (options.firebaseAuth) {
            this._firebaseAuth = options.firebaseAuth;
        }
        
        // Try to restore session
        await this._restoreSession();
        
        // Start token refresh interval
        this._startTokenRefresh();
        
        // Listen for session expiry
        eventBus.on('auth:session-expired', () => this.logout());
        
        this._initialized = true;
    }

    /**
     * Set Firebase auth mode
     * @param {Object} firebaseAuth
     */
    setFirebaseMode(firebaseAuth) {
        this._mode = 'firebase';
        this._firebaseAuth = firebaseAuth;
        
        // Listen for Firebase auth state changes
        firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                this._handleFirebaseUser(user);
            } else {
                this._clearAuth();
            }
        });
    }

    /**
     * Handle Firebase user
     * @param {Object} firebaseUser
     */
    async _handleFirebaseUser(firebaseUser) {
        const token = await firebaseUser.getIdToken();
        const user = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            emailVerified: firebaseUser.emailVerified,
            phoneNumber: firebaseUser.phoneNumber || '',
            provider: firebaseUser.providerData[0]?.providerId || 'firebase'
        };
        
        state.batch({
            'auth.isLoggedIn': true,
            'auth.user': user,
            'auth.token': token,
            'auth.sessionExpiry': Date.now() + this._sessionTimeout
        });
        
        eventBus.emit('auth:login', user);
    }

    /**
     * Register a new user
     * @param {Object} userData
     * @param {string} userData.email
     * @param {string} userData.password
     * @param {string} userData.name
     * @param {string} userData.phone
     * @returns {Promise<Object>}
     */
    async register(userData) {
        const { email, password, name, phone } = userData;
        
        // Validate
        if (!isValidEmail(email)) {
            throw new Error('Invalid email address');
        }
        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }
        
        if (this._mode === 'firebase' && this._firebaseAuth) {
            return this._firebaseRegister(email, password, name);
        }
        
        return this._localRegister(userData);
    }

    /**
     * Firebase registration
     * @param {string} email
     * @param {string} password
     * @param {string} name
     * @returns {Promise<Object>}
     */
    async _firebaseRegister(email, password, name) {
        const { createUserWithEmailAndPassword, updateProfile } = await import(
            'https://www.gstatic.com/firebasejs/10.x/firebase-auth.js'
        );
        
        const userCredential = await createUserWithEmailAndPassword(
            this._firebaseAuth, 
            email, 
            password
        );
        
        await updateProfile(userCredential.user, { displayName: name });
        
        // Trigger Firebase auth state change which will handle the rest
        return { success: true, user: userCredential.user };
    }

    /**
     * Local registration (demo/fallback)
     * @param {Object} userData
     * @returns {Promise<Object>}
     */
    async _localRegister(userData) {
        // Simulate API call
        await sleep(1000);
        
        const { email, password, name, phone } = userData;
        
        // Check if user already exists
        const users = storage.get('registered_users', []);
        if (users.find(u => u.email === email)) {
            throw new Error('Email already registered');
        }
        
        // Create user
        const user = {
            id: generateId('user'),
            email,
            name,
            phone: phone || '',
            createdAt: new Date().toISOString(),
            emailVerified: false
        };
        
        // Store user credentials (NEVER do this in production - this is for demo)
        users.push({ ...user, password });
        storage.set('registered_users', users);
        
        // Auto-login after registration
        const token = generateId('token');
        const refreshToken = generateId('refresh');
        
        state.batch({
            'auth.isLoggedIn': true,
            'auth.user': user,
            'auth.token': token,
            'auth.refreshToken': refreshToken,
            'auth.sessionExpiry': Date.now() + this._sessionTimeout
        });
        
        // Persist session
        storage.set('auth_session', {
            user,
            token,
            refreshToken,
            expiry: Date.now() + this._sessionTimeout
        });
        
        eventBus.emit('auth:register', user);
        eventBus.emit('auth:login', user);
        
        return { success: true, user };
    }

    /**
     * Login user
     * @param {string} email
     * @param {string} password
     * @param {boolean} rememberMe
     * @returns {Promise<Object>}
     */
    async login(email, password, rememberMe = false) {
        if (!isValidEmail(email)) {
            throw new Error('Invalid email address');
        }
        
        if (this._mode === 'firebase' && this._firebaseAuth) {
            return this._firebaseLogin(email, password, rememberMe);
        }
        
        return this._localLogin(email, password, rememberMe);
    }

    /**
     * Firebase login
     */
    async _firebaseLogin(email, password, rememberMe) {
        const { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } = 
            await import('https://www.gstatic.com/firebasejs/10.x/firebase-auth.js');
        
        await setPersistence(
            this._firebaseAuth,
            rememberMe ? browserLocalPersistence : browserSessionPersistence
        );
        
        const userCredential = await signInWithEmailAndPassword(
            this._firebaseAuth,
            email,
            password
        );
        
        return { success: true, user: userCredential.user };
    }

    /**
     * Local login (demo)
     */
    async _localLogin(email, password, rememberMe) {
        await sleep(800);
        
        const users = storage.get('registered_users', []);
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            throw new Error('Invalid email or password');
        }
        
        const { password: _, ...safeUser } = user;
        const token = generateId('token');
        const refreshToken = generateId('refresh');
        
        state.batch({
            'auth.isLoggedIn': true,
            'auth.user': safeUser,
            'auth.token': token,
            'auth.refreshToken': refreshToken,
            'auth.sessionExpiry': Date.now() + this._sessionTimeout
        });
        
        // Persist session
        if (rememberMe) {
            storage.set('auth_session', {
                user: safeUser,
                token,
                refreshToken,
                expiry: Date.now() + this._sessionTimeout
            });
        }
        
        eventBus.emit('auth:login', safeUser);
        
        return { success: true, user: safeUser };
    }

    /**
     * Logout user
     */
    async logout() {
        // Clear refresh interval
        if (this._refreshInterval) {
            clearInterval(this._refreshInterval);
            this._refreshInterval = null;
        }
        
        if (this._mode === 'firebase' && this._firebaseAuth) {
            await this._firebaseAuth.signOut();
        }
        
        this._clearAuth();
        storage.remove('auth_session');
        
        eventBus.emit('auth:logout');
    }

    /**
     * Clear auth state
     */
    _clearAuth() {
        state.batch({
            'auth.isLoggedIn': false,
            'auth.user': null,
            'auth.token': null,
            'auth.refreshToken': null,
            'auth.sessionExpiry': null
        });
        this._cachedProfile = null;
    }

    /**
     * Send OTP for phone verification
     * @param {string} phone
     * @returns {Promise<Object>}
     */
    async sendOTP(phone) {
        // Simulate OTP sending
        await sleep(500);
        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP with expiry (5 minutes)
        storage.set('otp', {
            code: otp,
            phone,
            expiry: Date.now() + 5 * 60 * 1000,
            attempts: 0
        });
        
        console.log(`[Auth] OTP for ${phone}: ${otp}`); // Demo only!
        
        eventBus.emit('auth:otp-sent', { phone });
        
        return { success: true, message: 'OTP sent successfully' };
    }

    /**
     * Verify OTP
     * @param {string} otp
     * @returns {Promise<Object>}
     */
    async verifyOTP(otp) {
        await sleep(500);
        
        const storedOTP = storage.get('otp');
        
        if (!storedOTP) {
            throw new Error('OTP expired. Please request a new one.');
        }
        
        if (Date.now() > storedOTP.expiry) {
            storage.remove('otp');
            throw new Error('OTP expired. Please request a new one.');
        }
        
        if (storedOTP.attempts >= 3) {
            storage.remove('otp');
            throw new Error('Too many attempts. Please request a new OTP.');
        }
        
        storedOTP.attempts++;
        storage.set('otp', storedOTP);
        
        if (storedOTP.code !== otp) {
            throw new Error('Invalid OTP. Please try again.');
        }
        
        storage.remove('otp');
        
        eventBus.emit('auth:otp-verified', { phone: storedOTP.phone });
        
        return { success: true };
    }

    /**
     * Send password reset email
     * @param {string} email
     * @returns {Promise<Object>}
     */
    async forgotPassword(email) {
        await sleep(1000);
        
        if (!isValidEmail(email)) {
            throw new Error('Invalid email address');
        }
        
        if (this._mode === 'firebase' && this._firebaseAuth) {
            const { sendPasswordResetEmail } = await import(
                'https://www.gstatic.com/firebasejs/10.x/firebase-auth.js'
            );
            await sendPasswordResetEmail(this._firebaseAuth, email);
        }
        
        console.log(`[Auth] Password reset email sent to: ${email}`);
        
        return { success: true, message: 'Password reset link sent to your email' };
    }

    /**
     * Reset password
     * @param {string} newPassword
     * @param {string} token - Reset token
     * @returns {Promise<Object>}
     */
    async resetPassword(newPassword, token) {
        await sleep(1000);
        
        if (newPassword.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }
        
        // In production, verify token and update password on server
        console.log('[Auth] Password reset successful');
        
        return { success: true, message: 'Password reset successfully' };
    }

    /**
     * Refresh auth token
     * @returns {Promise<string>}
     */
    async refreshToken() {
        const refreshToken = state.get('auth.refreshToken');
        
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }
        
        // Simulate token refresh
        await sleep(300);
        const newToken = generateId('token');
        
        state.set('auth.token', newToken);
        state.set('auth.sessionExpiry', Date.now() + this._sessionTimeout);
        
        // Update stored session
        const session = storage.get('auth_session');
        if (session) {
            session.token = newToken;
            session.expiry = Date.now() + this._sessionTimeout;
            storage.set('auth_session', session);
        }
        
        return newToken;
    }

    /**
     * Start token refresh interval
     */
    _startTokenRefresh() {
        if (this._refreshInterval) return;
        
        // Check every minute if token needs refresh
        this._refreshInterval = setInterval(async () => {
            const isLoggedIn = state.get('auth.isLoggedIn');
            const sessionExpiry = state.get('auth.sessionExpiry');
            
            if (isLoggedIn && sessionExpiry) {
                const timeUntilExpiry = sessionExpiry - Date.now();
                
                if (timeUntilExpiry <= this._refreshThreshold) {
                    try {
                        await this.refreshToken();
                    } catch (error) {
                        console.warn('[Auth] Token refresh failed:', error);
                        eventBus.emit('auth:session-expired');
                    }
                }
            }
        }, 60000); // Every 1 minute
    }

    /**
     * Restore session from storage
     */
    async _restoreSession() {
        const session = storage.get('auth_session');
        
        if (!session) return;
        
        // Check expiry
        if (Date.now() > session.expiry) {
            storage.remove('auth_session');
            return;
        }
        
        // Restore state
        state.batch({
            'auth.isLoggedIn': true,
            'auth.user': session.user,
            'auth.token': session.token,
            'auth.refreshToken': session.refreshToken,
            'auth.sessionExpiry': session.expiry
        });
        
        // Check if token needs refresh
        const timeUntilExpiry = session.expiry - Date.now();
        if (timeUntilExpiry <= this._refreshThreshold) {
            try {
                await this.refreshToken();
            } catch (error) {
                console.warn('[Auth] Session expired, logging out');
                this.logout();
            }
        }
        
        eventBus.emit('auth:session-restored', session.user);
    }

    /**
     * Update user profile
     * @param {Object} updates
     * @returns {Promise<Object>}
     */
    async updateProfile(updates) {
        const currentUser = state.get('auth.user');
        
        if (!currentUser) {
            throw new Error('Not logged in');
        }
        
        await sleep(500);
        
        const updatedUser = { ...currentUser, ...updates };
        state.set('auth.user', updatedUser);
        
        // Update stored session
        const session = storage.get('auth_session');
        if (session) {
            session.user = updatedUser;
            storage.set('auth_session', session);
        }
        
        eventBus.emit('auth:profile-updated', updatedUser);
        
        return { success: true, user: updatedUser };
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return state.get('auth.isLoggedIn', false);
    }

    /**
     * Get current user
     * @returns {Object|null}
     */
    getCurrentUser() {
        return state.get('auth.user');
    }
}

// Create and export singleton
const auth = new AuthManager();

export { AuthManager };
export default auth;