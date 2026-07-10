/* ============================================
   EMPTY STATE COMPONENTS
   Pre-configured empty states for different pages
   ============================================ */

/**
 * Pre-built empty states for common scenarios
 */
export const EmptyStates = {
    noSubjects: {
        icon: '📚',
        title: 'No Subjects Yet',
        description: 'Add your first subject to start tracking your academic progress.',
        actionLabel: 'Add Subject',
        actionHref: '#/subjects/add'
    },
    
    noAssignments: {
        icon: '📋',
        title: 'No Assignments',
        description: 'You\'re all caught up! New assignments will appear here.',
        actionLabel: 'Check Later'
    },
    
    noHomework: {
        icon: '📝',
        title: 'No Homework',
        description: 'You don\'t have any pending homework. Great job!',
        actionLabel: 'Add Homework',
        actionHref: '#/homework/add'
    },
    
    noNotes: {
        icon: '📖',
        title: 'No Notes Yet',
        description: 'Start creating notes to organize your study material.',
        actionLabel: 'Create Note',
        actionHref: '#/notes/new'
    },
    
    noAttendance: {
        icon: '📊',
        title: 'No Attendance Data',
        description: 'Attendance records will appear here once classes begin.',
        actionLabel: 'View Subjects',
        actionHref: '#/subjects'
    },
    
    noResults: {
        icon: '📈',
        title: 'No Results Yet',
        description: 'Your exam results will be displayed here when available.',
        actionLabel: 'View Progress',
        actionHref: '#/progress'
    },
    
    noNotifications: {
        icon: '🔔',
        title: 'No Notifications',
        description: 'You\'re all caught up! New notifications will appear here.',
        actionLabel: null
    },
    
    noTeachers: {
        icon: '👨‍🏫',
        title: 'No Teachers Found',
        description: 'No teachers match your search criteria.',
        actionLabel: 'View All',
        actionHref: '#/teachers'
    },
    
    noQuizzes: {
        icon: '🎯',
        title: 'No Quizzes Available',
        description: 'Check back later for new quizzes.',
        actionLabel: 'Explore Subjects',
        actionHref: '#/subjects'
    },
    
    searchNoResults: {
        icon: '🔍',
        title: 'No Results Found',
        description: 'Try adjusting your search terms or filters.',
        actionLabel: 'Clear Search',
        actionOnClick: 'this.closest("input")?.value=""; this.closest("input")?.dispatchEvent(new Event("input"));'
    },
    
    offline: {
        icon: '📡',
        title: 'You\'re Offline',
        description: 'Please check your internet connection and try again.',
        actionLabel: 'Retry',
        actionOnClick: 'window.location.reload();'
    },
    
    error: {
        icon: '⚠️',
        title: 'Something Went Wrong',
        description: 'Please try again later or contact support.',
        actionLabel: 'Retry',
        actionOnClick: 'window.location.reload();'
    },
    
    underConstruction: {
        icon: '🚧',
        title: 'Coming Soon',
        description: 'This feature is under development. Stay tuned!',
        actionLabel: 'Go Back',
        actionOnClick: 'window.history.back();'
    }
};

/**
 * Generate empty state HTML
 * @param {string} type - Key from EmptyStates
 * @param {Object} overrides - Override default values
 * @returns {string} HTML
 */
export function getEmptyState(type, overrides = {}) {
    const state = { ...(EmptyStates[type] || EmptyStates.error), ...overrides };
    
    return `
        <div class="empty-state-center">
            <div class="empty-state__icon">${state.icon}</div>
            <h3 class="empty-state__title">${state.title}</h3>
            <p class="empty-state__description">${state.description}</p>
            ${state.actionLabel ? `
                <button class="btn btn-primary" 
                    ${state.actionHref ? `onclick="window.location.hash='${state.actionHref}'"` : ''}
                    ${state.actionOnClick ? `onclick="${state.actionOnClick}"` : ''}>
                    ${state.actionLabel}
                </button>
            ` : ''}
        </div>
    `;
}

export default { EmptyStates, getEmptyState };