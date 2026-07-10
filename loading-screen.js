/* ============================================
   LOADING SCREEN COMPONENT
   Full page and inline loading indicators
   ============================================ */

/**
 * Show loading overlay
 * @param {string} message
 */
export function showLoading(message = 'Loading...') {
    const existing = document.getElementById('loading-screen');
    if (existing) {
        existing.classList.remove('hidden');
        const textEl = existing.querySelector('p');
        if (textEl) textEl.textContent = message;
        return;
    }
    
    const overlay = document.createElement('div');
    overlay.id = 'loading-screen';
    overlay.className = 'loading-overlay';
    overlay.setAttribute('aria-live', 'polite');
    overlay.setAttribute('aria-label', 'Loading');
    overlay.innerHTML = `
        <div class="spinner"></div>
        <p>${message}</p>
    `;
    document.body.appendChild(overlay);
}

/**
 * Hide loading overlay
 */
export function hideLoading() {
    const overlay = document.getElementById('loading-screen');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

/**
 * Create inline skeleton loader
 * @param {string} type - 'text' | 'title' | 'avatar' | 'card' | 'button'
 * @param {number} count - Number of skeletons
 * @returns {string} HTML
 */
export function skeletonLoader(type = 'text', count = 1) {
    const types = {
        text: '<div class="skeleton skeleton--text"></div>',
        title: '<div class="skeleton skeleton--title"></div>',
        avatar: '<div class="skeleton skeleton--avatar"></div>',
        card: '<div class="skeleton skeleton--card"></div>',
        button: '<div class="skeleton skeleton--button"></div>',
    };
    
    return Array(count).fill(types[type] || types.text).join('');
}

/**
 * Create page skeleton
 * @returns {string}
 */
export function pageSkeleton() {
    return `
        <div class="page-content">
            ${skeletonLoader('title', 1)}
            <div class="grid grid-cols-2 grid-gap-3 mb-4">
                ${skeletonLoader('card', 4)}
            </div>
            ${skeletonLoader('text', 3)}
            ${skeletonLoader('card', 2)}
        </div>
    `;
}

export default { showLoading, hideLoading, skeletonLoader, pageSkeleton };