/* ============================================
   FIREBASE CONFIGURATION
   Firebase SDK setup and initialization
   Replace with your own Firebase config
   ============================================ */

/**
 * IMPORTANT: Replace these values with your own Firebase project config.
 * Get them from: Firebase Console → Project Settings → General → Your apps
 * 
 * For demo purposes, this uses a placeholder configuration.
 * The app works in LOCAL MODE without Firebase by default.
 */

const FIREBASE_CONFIG = {
    // ========== REPLACE WITH YOUR CONFIG ==========
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
    // =============================================
};

/**
 * Firebase services (lazy initialized)
 */
let firebaseApp = null;
let firebaseAuth = null;
let firebaseFirestore = null;
let firebaseStorage = null;

/**
 * Check if Firebase is configured
 * @returns {boolean}
 */
function isFirebaseConfigured() {
    return FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY";
}

/**
 * Initialize Firebase (call once at app startup)
 * @returns {Promise<Object|null>} Firebase services or null if not configured
 */
async function initFirebase() {
    if (!isFirebaseConfigured()) {
        console.log('[Firebase] Not configured. Using local mode.');
        return null;
    }

    try {
        // Dynamic imports for Firebase SDK (loaded from CDN)
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const { getStorage } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js');

        firebaseApp = initializeApp(FIREBASE_CONFIG);
        firebaseAuth = getAuth(firebaseApp);
        firebaseFirestore = getFirestore(firebaseApp);
        firebaseStorage = getStorage(firebaseApp);

        console.log('[Firebase] Initialized successfully ✅');
        
        return {
            app: firebaseApp,
            auth: firebaseAuth,
            firestore: firebaseFirestore,
            storage: firebaseStorage
        };
    } catch (error) {
        console.error('[Firebase] Initialization failed:', error);
        return null;
    }
}

/**
 * Get Firebase Auth instance
 * @returns {Object|null}
 */
function getFirebaseAuth() {
    return firebaseAuth;
}

/**
 * Get Firestore instance
 * @returns {Object|null}
 */
function getFirebaseFirestore() {
    return firebaseFirestore;
}

/**
 * Get Storage instance
 * @returns {Object|null}
 */
function getFirebaseStorage() {
    return firebaseStorage;
}

// Export configuration and functions
export {
    FIREBASE_CONFIG,
    isFirebaseConfigured,
    initFirebase,
    getFirebaseAuth,
    getFirebaseFirestore,
    getFirebaseStorage
};

export default {
    FIREBASE_CONFIG,
    isFirebaseConfigured,
    initFirebase,
    getFirebaseAuth,
    getFirebaseFirestore,
    getFirebaseStorage
};