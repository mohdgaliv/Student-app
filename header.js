/* ============================================
   HEADER COMPONENT
   Top navigation bar
   ============================================ */

import { $, createElement } from '../js/utils.js';
import eventBus from '../js/event-bus.js';
import state from '../js/state-manager.js';

/**
 * Header component
 * @param {Object} options
 * @param {string} options.title - Page title
 * @param {boolean} options.showBack - Show back button
 * @param {Array} options.actions - Right side action buttons
 * @returns {string} HTML
 */
export function Header(options = {}) {
    const { title = 'Student App', showBack = false, actions = [] } = options;
    
    return `
        <header class="app-header" id="app-header">
            <div class="app-header__left">
                ${showBack ? `
                    <button class="btn btn-icon btn-ghost" onclick="window.history.back()" aria-label="Go back">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                        </svg>
                    </button>
                ` : `
                    <button class="btn btn-icon btn-ghost" id="sidebar-toggle" aria-label="Menu">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/>
                            <line x1="3" y1="18" x2="21" y2="18"/>
                        </svg>
                    </button>
                `}
            </div>
            <div class="app-header__center">
                <h1 class="text-lg font-semibold truncate">${title}</h1>
            </div>
            <div class="app-header__right">
                ${actions.map(action => `
                    <button class="btn btn-icon btn-ghost" onclick="${action.onClick}" aria-label="${action.label}" id="${action.id || ''}">
                        ${action.icon || action.label}
                    </button>
                `).join('')}
            </div>
        </header>
    `;
}

/**
 * Initialize header event listeners
 */
export function initHeader() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            const isOpen = state.get('ui.sidebarOpen');
            state.set('ui.sidebarOpen', !isOpen);
            eventBus.emit('ui:sidebar-toggle', !isOpen);
        });
    }
}

export default { Header, initHeader };