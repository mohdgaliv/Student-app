/* ============================================
   BOTTOM NAVIGATION COMPONENT
   Mobile bottom tab bar
   ============================================ */

import eventBus from '../js/event-bus.js';

/**
 * Bottom navigation component
 * @returns {string} HTML
 */
export function BottomNav() {
    const navItems = [
        { icon: 'home', label: 'Home', href: '#/dashboard' },
        { icon: 'book', label: 'Subjects', href: '#/subjects' },
        { icon: 'quiz', label: 'Quiz', href: '#/quiz' },
        { icon: 'notes', label: 'Notes', href: '#/notes' },
        { icon: 'profile', label: 'Profile', href: '#/profile' },
    ];
    
    const getIcon = (icon) => {
        const icons = {
            home: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>`,
            book: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
            </svg>`,
            quiz: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>`,
            notes: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>`,
            profile: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>`,
        };
        return icons[icon] || '';
    };
    
    return `
        <nav class="bottom-nav" id="bottom-nav">
            ${navItems.map((item, index) => `
                <a href="${item.href}" class="bottom-nav__item" data-route="${item.href.replace('#/', '')}">
                    <span class="bottom-nav__icon">${getIcon(item.icon)}</span>
                    <span class="bottom-nav__label">${item.label}</span>
                </a>
            `).join('')}
        </nav>
    `;
}

/**
 * Initialize bottom navigation
 */
export function initBottomNav() {
    const nav = document.getElementById('bottom-nav');
    if (!nav) return;
    
    // Highlight active item
    const currentRoute = window.location.hash.replace('#/', '') || 'dashboard';
    highlightActive(nav, currentRoute);
    
    // Listen for route changes
    eventBus.on('nav:navigate', ({ to }) => {
        const route = to.path.replace('/', '');
        highlightActive(nav, route);
    });
    
    // Click handler
    nav.querySelectorAll('.bottom-nav__item').forEach(item => {
        item.addEventListener('click', (e) => {
            nav.querySelectorAll('.bottom-nav__item').forEach(i => 
                i.classList.remove('bottom-nav__item--active')
            );
            item.classList.add('bottom-nav__item--active');
        });
    });
}

function highlightActive(nav, route) {
    nav.querySelectorAll('.bottom-nav__item').forEach(item => {
        item.classList.toggle('bottom-nav__item--active', item.dataset.route === route);
    });
}

export default { BottomNav, initBottomNav };