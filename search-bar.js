/* ============================================
   SEARCH BAR COMPONENT
   Global search with suggestions
   ============================================ */

import { debounce, generateId } from '../js/utils.js';
import eventBus from '../js/event-bus.js';

/**
 * Create a search bar
 * @param {Object} options
 * @param {string} options.placeholder
 * @param {Function} options.onSearch - (query) => void
 * @param {Array} options.suggestions - Recent/popular searches
 * @returns {string} HTML
 */
export function SearchBar(options = {}) {
    const {
        placeholder = 'Search...',
        onSearch = null,
        suggestions = []
    } = options;
    
    const id = generateId('search');
    
    // Store callback globally
    if (onSearch) {
        window[`__search_${id}`] = debounce(onSearch, 300);
    }
    
    return `
        <div class="search-bar search-bar--has-value" id="${id}-wrapper">
            <svg class="search-bar__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
                type="search" 
                class="search-bar__input" 
                placeholder="${placeholder}" 
                id="${id}"
                oninput="window.__search_${id} && window.__search_${id}(this.value)"
            >
            <button class="search-bar__clear" onclick="document.getElementById('${id}').value=''; document.getElementById('${id}').focus();" aria-label="Clear search">
                ✕
            </button>
            ${suggestions.length > 0 ? `
                <div class="search-suggestions" id="${id}-suggestions" style="display:none;">
                    ${suggestions.map(s => `
                        <div class="search-suggestion-item" onclick="document.getElementById('${id}').value='${s}'; window.__search_${id} && window.__search_${id}('${s}');">
                            <span>🔍</span> ${s}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Initialize global search
 */
export function initGlobalSearch() {
    // Listen for keyboard shortcut
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            eventBus.emit('ui:search-open');
        }
    });
}

export default { SearchBar, initGlobalSearch };