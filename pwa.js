/* ============================================
   PWA MANAGER
   Service Worker, Install, Updates, Cache
   ============================================ */

import eventBus from './event-bus.js';
import state from './state-manager.js';
import storage from './storage.js';

/**
 * PWAManager - PWA feature management
 */
class PWAManager {
    constructor() {
        this._registration = null;
        this._supported = 'serviceWorker' in navigator;
        this._deferredPrompt = null;
        this._isInstallable = false;
        this._isInstalled = false;
        this._updateAvailable = false;
        this._waitingWorker = null;
        this._initialized = false;
        this._debug = false;
    }
    
    async init(options = {}) {
        if (this._initialized) return;
        
        const { debug = false, autoUpdate = false } = options;
        this._debug = debug;
        this._isInstalled = window.matchMedia('(display-mode: standalone)').matches;
        
        if (this._supported) {
            await this._registerServiceWorker(autoUpdate);
        }
        
        this._setupInstallListeners();
        this._setupNetworkListeners();
        
        this._initialized = true;
        eventBus.emit('pwa:initialized', this.getStatus());
    }
    
    async _registerServiceWorker(autoUpdate) {
        try {
            this._registration = await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
            
            this._registration.addEventListener('updatefound', () => {
                const newWorker = this._registration.installing;
                if (!newWorker) return;
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this._updateAvailable = true;
                        this._waitingWorker = newWorker;
                        eventBus.emit('pwa:update-available');
                        
                        if (autoUpdate) {
                            this.applyUpdate();
                        }
                    }
                });
            });
            
            if (this._registration.waiting) {
                this._updateAvailable = true;
                this._waitingWorker = this._registration.waiting;
            }
            
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'CACHE_UPDATED') {
                    eventBus.emit('pwa:cache-updated', event.data);
                }
            });
            
        } catch (error) {
            console.warn('[PWA] Service Worker registration failed:', error.message);
        }
    }
    
    _setupInstallListeners() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this._deferredPrompt = e;
            this._isInstallable = true;
            eventBus.emit('pwa:installable');
        });
        
        window.addEventListener('appinstalled', () => {
            this._isInstalled = true;
            this._isInstallable = false;
            this._deferredPrompt = null;
            eventBus.emit('pwa:installed');
        });
    }
    
    _setupNetworkListeners() {
        window.addEventListener('online', () => {
            state.set('app.online', true);
            eventBus.emit('network:online');
        });
        
        window.addEventListener('offline', () => {
            state.set('app.online', false);
            eventBus.emit('network:offline');
        });
        
        state.set('app.online', navigator.onLine);
    }
    
    async promptInstall() {
        if (!this._deferredPrompt) return { outcome: 'unavailable' };
        
        try {
            await this._deferredPrompt.prompt();
            const result = await this._deferredPrompt.userChoice;
            this._deferredPrompt = null;
            this._isInstallable = false;
            return result;
        } catch (error) {
            this._deferredPrompt = null;
            return { outcome: 'error' };
        }
    }
    
    canInstall() {
        return this._isInstallable && !this._isInstalled && !!this._deferredPrompt;
    }
    
    applyUpdate() {
        if (!this._updateAvailable || !this._waitingWorker) return;
        
        this._waitingWorker.postMessage({ type: 'SKIP_WAITING' });
        
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        }, { once: true });
        
        setTimeout(() => window.location.reload(), 3000);
    }
    
    async checkForUpdate() {
        if (!this._registration) return false;
        try {
            await this._registration.update();
            return this._updateAvailable;
        } catch (error) {
            return false;
        }
    }
    
    async getCacheStats() {
        if (!('caches' in window)) return { count: 0, names: [] };
        
        try {
            const cacheNames = await caches.keys();
            let totalSize = 0;
            
            for (const name of cacheNames) {
                const cache = await caches.open(name);
                const keys = await cache.keys();
                for (const request of keys) {
                    const response = await cache.match(request);
                    if (response) {
                        const blob = await response.clone().blob();
                        totalSize += blob.size;
                    }
                }
            }
            
            return {
                count: cacheNames.length,
                names: cacheNames,
                totalSize,
                formattedSize: this._formatBytes(totalSize)
            };
        } catch (error) {
            return { count: 0, names: [], totalSize: 0, formattedSize: '0 B' };
        }
    }
    
    async clearCaches() {
        if (!('caches' in window)) return;
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        eventBus.emit('pwa:cache-cleared');
    }
    
    async registerBackgroundSync(tag) {
        if (!this._registration || !('sync' in this._registration)) return false;
        try {
            await this._registration.sync.register(tag);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    getStatus() {
        return {
            supported: this._supported,
            initialized: this._initialized,
            installed: this._isInstalled,
            installable: this._isInstallable,
            updateAvailable: this._updateAvailable,
            online: navigator.onLine
        };
    }
    
    _formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    destroy() {
        this._registration = null;
        this._deferredPrompt = null;
        this._initialized = false;
    }
}

const pwa = new PWAManager();

export { PWAManager };
export default pwa;