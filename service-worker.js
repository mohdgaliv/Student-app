/* ============================================
   SERVICE WORKER
   Offline support, caching, background sync
   ============================================ */

// Cache name with version
const CACHE_NAME = 'student-app-v1.0.0';
const DYNAMIC_CACHE = 'student-app-dynamic-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    
    // CSS
    '/css/variables.css',
    '/css/reset.css',
    '/css/layout.css',
    '/css/typography.css',
    '/css/components.css',
    '/css/utilities.css',
    '/css/animations.css',
    '/css/dark-mode.css',
    '/css/responsive.css',
    
    // JS
    '/js/utils.js',
    '/js/event-bus.js',
    '/js/storage.js',
    '/js/state-manager.js',
    '/js/validator.js',
    '/js/formatter.js',
    '/js/theme-manager.js',
    '/js/notifications.js',
    '/js/api.js',
    '/js/auth.js',
    '/js/router.js',
    '/js/pwa.js',
    '/js/app.js',
    
    // Images
    '/images/logo.svg',
    '/images/empty-states/no-data.svg',
    '/images/empty-states/no-connection.svg',
    '/images/empty-states/error.svg',
    '/images/avatars/default-avatar.svg',
    
    // Icons
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png',
    
    // Offline fallback page
    '/offline.html'
];

// ========== INSTALL EVENT ==========
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Install complete');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Install failed:', error);
            })
    );
});

// ========== ACTIVATE EVENT ==========
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => {
                            return name !== CACHE_NAME && name !== DYNAMIC_CACHE;
                        })
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Activation complete');
                return self.clients.claim();
            })
    );
});

// ========== FETCH EVENT ==========
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    
    // Skip chrome-extension requests
    if (event.request.url.startsWith('chrome-extension://')) return;
    
    event.respondWith(
        // Try network first, fall back to cache
        fetch(event.request)
            .then((response) => {
                // Cache successful responses
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(DYNAMIC_CACHE)
                        .then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                }
                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(event.request)
                    .then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        
                        // If HTML request, return offline page
                        if (event.request.headers.get('accept')?.includes('text/html')) {
                            return caches.match('/offline.html');
                        }
                        
                        // Return empty response for other resources
                        return new Response('', {
                            status: 408,
                            statusText: 'Offline - Resource not available'
                        });
                    });
            })
    );
});

// ========== BACKGROUND SYNC ==========
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);
    
    if (event.tag === 'sync-pending-changes') {
        event.waitUntil(syncPendingChanges());
    }
    
    if (event.tag === 'sync-messages') {
        event.waitUntil(syncMessages());
    }
});

/**
 * Sync pending changes with server
 */
async function syncPendingChanges() {
    try {
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_REQUIRED',
                tag: 'sync-pending-changes'
            });
        });
    } catch (error) {
        console.error('[SW] Sync failed:', error);
    }
}

/**
 * Sync messages
 */
async function syncMessages() {
    // Will be implemented
}

// ========== PUSH NOTIFICATIONS ==========
self.addEventListener('push', (event) => {
    console.log('[SW] Push received');
    
    let data = { title: 'Student App', body: 'New notification', icon: '/icons/icon-192x192.png' };
    
    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch {
            data.body = event.data.text();
        }
    }
    
    const options = {
        body: data.body,
        icon: data.icon,
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: { url: data.url || '/' },
        actions: data.actions || [],
        tag: data.tag || 'default'
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// ========== NOTIFICATION CLICK ==========
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    const url = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then((clientList) => {
                // If a window is already open, focus it
                for (const client of clientList) {
                    if (client.url.includes(url) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise open new window
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});

// ========== MESSAGE FROM CLIENTS ==========
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then(names => 
                Promise.all(names.map(name => caches.delete(name)))
            )
        );
    }
});