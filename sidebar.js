/* ============================================
   SIDEBAR COMPONENT
   Main navigation sidebar for desktop
   ============================================ */

import state from '../js/state-manager.js';
import eventBus from '../js/event-bus.js';

/**
 * Sidebar navigation component
 * @returns {string} HTML
 */
export function Sidebar() {
    const menuItems = [
        { icon: '📊', label: 'Dashboard', href: '#/dashboard', badge: null },
        { icon: '👤', label: 'Profile', href: '#/profile', badge: null },
        { divider: true },
        { icon: '📚', label: 'Subjects', href: '#/subjects', badge: '6' },
        { icon: '📅', label: 'Timetable', href: '#/timetable', badge: null },
        { icon: '📋', label: 'Assignments', href: '#/assignments', badge: '4' },
        { icon: '📝', label: 'Homework', href: '#/homework', badge: '3' },
        { icon: '📖', label: 'Notes', href: '#/notes', badge: null },
        { divider: true },
        { icon: '✅', label: 'Attendance', href: '#/attendance', badge: null },
        { icon: '📈', label: 'Results', href: '#/results', badge: null },
        { icon: '🏆', label: 'Progress', href: '#/progress', badge: null },
        { divider: true },
        { icon: '🎯', label: 'Quiz', href: '#/quiz', badge: null },
        { icon: '📋', label: 'Mock Test', href: '#/mock-test', badge: null },
        { icon: '🤖', label: 'AI Assistant', href: '#/ai-assistant', badge: 'NEW' },
        { divider: true },
        { icon: '👨‍🏫', label: 'Teachers', href: '#/teachers', badge: null },
        { icon: '📅', label: 'Calendar', href: '#/calendar', badge: null },
        { icon: '🔔', label: 'Notifications', href: '#/notifications', badge: '2' },
        { divider: true },
        { icon: '⚙️', label: 'Settings', href: '#/settings', badge: null },
        { icon: 'ℹ️', label: 'About', href: '#/about', badge: null },
    ];
    
    return `
        <aside class="sidebar" id="app-sidebar">
            <!-- Sidebar overlay for mobile -->
            <div class="sidebar-overlay" id="sidebar-overlay"></div>
            
            <!-- Logo -->
            <div class="sidebar-logo" style="padding: var(--space-4); text-align: center;">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style="display: inline;">
                    <circle cx="20" cy="20" r="19" fill="var(--color-primary-100)" stroke="var(--color-primary-500)" stroke-width="2"/>
                    <path d="M11 24L20 18L29 24L20 27L11 24Z" fill="var(--color-primary-500)"/>
                    <path d="M20 18V24" stroke="var(--color-primary-700)" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <span class="text-sm font-bold block mt-1">Student App</span>
            </div>
            
            <!-- Nav Items -->
            <nav class="sidebar-nav">
                ${menuItems.map(item => {
                    if (item.divider) return '<div class="dropdown__divider"></div>';
                    return `
                        <a href="${item.href}" class="sidebar-nav-item" data-route="${item.href.replace('#/', '')}">
                            <span class="sidebar-nav-icon">${item.icon}</span>
                            <span class="sidebar-nav-label">${item.label}</span>
                            ${item.badge ? `<span class="badge badge--primary badge--count ml-auto">${item.badge}</span>` : ''}
                        </a>
                    `;
                }).join('')}
            </nav>
            
            <!-- User Info at Bottom -->
            <div class="sidebar-user" style="margin-top: auto; padding: var(--space-4); border-top: 1px solid var(--border-color);">
                <div class="flex items-center gap-3">
                    <div class="avatar avatar--md" style="background: var(--color-primary-100);">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-sm font-semibold truncate" id="sidebar-username">Student</div>
                        <div class="text-xs text-secondary truncate" id="sidebar-email">student@email.com</div>
                    </div>
                </div>
            </div>
        </aside>
    `;
}

/**
 * Initialize sidebar functionality
 */
export function initSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (!sidebar) return;
    
    // Toggle sidebar
    eventBus.on('ui:sidebar-toggle', (isOpen) => {
        sidebar.classList.toggle('sidebar-open', isOpen);
        if (overlay) overlay.classList.toggle('sidebar-overlay--visible', isOpen);
    });
    
    // Close on overlay click
    if (overlay) {
        overlay.addEventListener('click', () => {
            state.set('ui.sidebarOpen', false);
            eventBus.emit('ui:sidebar-toggle', false);
        });
    }
    
    // Highlight active route
    const currentRoute = window.location.hash.replace('#/', '') || 'dashboard';
    const activeItem = sidebar.querySelector(`[data-route="${currentRoute}"]`);
    if (activeItem) {
        activeItem.classList.add('sidebar-nav-item--active');
    }
    
    // Listen for route changes
    eventBus.on('nav:navigate', ({ to }) => {
        const route = to.path.replace('/', '');
        sidebar.querySelectorAll('.sidebar-nav-item').forEach(item => {
            item.classList.toggle('sidebar-nav-item--active', item.dataset.route === route);
        });
    });
    
    // Load user info
    const user = state.get('auth.user');
    if (user) {
        const usernameEl = document.getElementById('sidebar-username');
        const emailEl = document.getElementById('sidebar-email');
        if (usernameEl) usernameEl.textContent = user.name || 'Student';
        if (emailEl) emailEl.textContent = user.email || '';
    }
}

export default { Sidebar, initSidebar };