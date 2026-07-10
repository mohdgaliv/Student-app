/* ============================================
   CARD COMPONENTS
   Reusable card templates for common patterns
   ============================================ */

import { formatDate, timeAgo, truncateText } from '../js/utils.js';

/**
 * Subject Card - For displaying subject info
 * @param {Object} config
 * @param {string} config.name - Subject name
 * @param {string} config.code - Subject code
 * @param {string} config.icon - Emoji icon
 * @param {string} config.teacher - Teacher name
 * @param {string} config.color - Accent color
 * @param {number} config.attendance - Attendance percentage
 * @param {number} config.progress - Syllabus progress
 * @param {string} config.href - Link when clicked
 * @returns {string} HTML
 */
export function SubjectCard(config) {
    const { 
        name = 'Subject', 
        code = '', 
        icon = '📚', 
        teacher = '', 
        color = 'var(--color-primary-500)',
        attendance = 0,
        progress = 0,
        href = '#'
    } = config;
    
    const attendanceColor = attendance >= 75 ? 'text-success' : attendance >= 60 ? 'text-warning' : 'text-error';
    
    return `
        <div class="card card--interactive" onclick="window.location.hash='${href}'" style="border-left: 4px solid ${color};">
            <div class="card__body">
                <div class="flex items-center gap-3 mb-3">
                    <div class="avatar avatar--lg" style="background: ${color}20; color: ${color}; font-size: 24px;">
                        ${icon}
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-semibold truncate">${name}</h4>
                        <p class="text-xs text-secondary">${code}</p>
                    </div>
                </div>
                <div class="grid grid-cols-2 grid-gap-2 mb-2">
                    <div class="text-center" style="background: var(--bg-secondary); padding: var(--space-2); border-radius: var(--border-radius-md);">
                        <div class="text-sm font-bold ${attendanceColor}">${attendance}%</div>
                        <div class="text-xs text-tertiary">Attendance</div>
                    </div>
                    <div class="text-center" style="background: var(--bg-secondary); padding: var(--space-2); border-radius: var(--border-radius-md);">
                        <div class="text-sm font-bold text-primary">${progress}%</div>
                        <div class="text-xs text-tertiary">Syllabus</div>
                    </div>
                </div>
                <div class="flex items-center gap-2 text-xs text-secondary">
                    <span>👨‍🏫 ${teacher}</span>
                </div>
                <div class="progress mt-2">
                    <div class="progress__bar" style="width: ${progress}%; background: ${color};"></div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Assignment Card - For displaying assignment info
 * @param {Object} config
 * @returns {string} HTML
 */
export function AssignmentCard(config) {
    const {
        title = 'Assignment',
        subject = '',
        subjectColor = 'var(--color-primary-500)',
        dueDate = null,
        status = 'pending', // 'pending' | 'submitted' | 'graded' | 'overdue'
        marks = null,
        totalMarks = null,
        description = '',
        questions = 0,
        href = '#'
    } = config;
    
    const statusConfig = {
        pending: { label: 'Pending', class: 'badge--warning', borderColor: 'var(--color-warning-500)' },
        submitted: { label: 'Submitted', class: 'badge--primary', borderColor: 'var(--color-primary-500)' },
        graded: { label: 'Graded', class: 'badge--success', borderColor: 'var(--color-success-500)' },
        overdue: { label: 'Overdue', class: 'badge--error', borderColor: 'var(--color-error-500)' },
    };
    
    const sc = statusConfig[status] || statusConfig.pending;
    const isDue = status === 'pending' && dueDate;
    const dueDateDisplay = dueDate ? formatDate(dueDate) : '';
    const isOverdue = isDue && new Date(dueDate) < new Date();
    
    return `
        <div class="card card--interactive" 
             onclick="window.location.hash='${href}'" 
             style="border-left: 4px solid ${isOverdue ? 'var(--color-error-500)' : sc.borderColor};"
             data-status="${status}">
            <div class="card__body">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2">
                        <span class="badge ${sc.class}">${sc.label}</span>
                        <span class="text-xs text-secondary">${subject}</span>
                    </div>
                    ${isOverdue ? '<span class="text-xs text-error font-medium">⚠ Overdue</span>' : ''}
                    ${isDue && !isOverdue ? `<span class="text-xs text-warning font-medium">Due ${dueDateDisplay}</span>` : ''}
                </div>
                <h4 class="font-semibold mb-1">${title}</h4>
                <p class="text-sm text-secondary mb-2 line-clamp-2">${truncateText(description, 100)}</p>
                <div class="flex justify-between items-center text-xs text-tertiary">
                    <span>📅 ${dueDate ? 'Due: ' + dueDateDisplay : 'No deadline'}</span>
                    ${questions > 0 ? `<span>📝 ${questions} Questions</span>` : ''}
                    ${marks !== null && totalMarks ? `<span>⭐ ${marks}/${totalMarks}</span>` : ''}
                </div>
            </div>
        </div>
    `;
}

/**
 * Note Card - For displaying notes
 * @param {Object} config
 * @returns {string} HTML
 */
export function NoteCard(config) {
    const {
        title = 'Untitled Note',
        subject = '',
        subjectColor = 'var(--color-primary-500)',
        icon = '📝',
        content = '',
        date = new Date(),
        isPinned = false,
        href = '#'
    } = config;
    
    return `
        <div class="card card--interactive ${isPinned ? 'card--bordered-primary' : ''}" 
             onclick="window.location.hash='${href}'"
             data-subject="${subject.toLowerCase()}">
            <div class="card__body">
                <div class="flex justify-between items-start mb-3">
                    <span style="font-size: 28px;">${icon}</span>
                    <div class="flex items-center gap-1">
                        ${isPinned ? '<span class="text-xs text-primary">📌 Pinned</span>' : ''}
                        <button class="btn btn-icon btn-sm btn-ghost" onclick="event.stopPropagation();" aria-label="More options">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <h4 class="font-semibold mb-1">${title}</h4>
                <p class="text-xs text-secondary mb-3 line-clamp-2">${truncateText(content, 80)}</p>
                <div class="flex justify-between items-center">
                    <span class="badge" style="background: ${subjectColor}15; color: ${subjectColor};">${subject}</span>
                    <span class="text-xs text-tertiary">${timeAgo(date)}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Teacher Card - For displaying teacher info
 * @param {Object} config
 * @returns {string} HTML
 */
export function TeacherCard(config) {
    const {
        name = 'Teacher',
        department = '',
        icon = '👨‍🏫',
        email = '',
        phone = '',
        subjects = [],
        schedule = '',
        room = '',
        color = 'var(--color-primary-500)',
        href = '#'
    } = config;
    
    return `
        <div class="card card--interactive" onclick="window.location.hash='${href}'" data-dept="${department.toLowerCase()}">
            <div class="card__body">
                <div class="flex items-center gap-4">
                    <div class="avatar avatar--xl" style="background: ${color}20; color: ${color}; font-size: 28px;">
                        ${icon}
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-semibold">${name}</h4>
                        <p class="text-sm text-secondary">${department} Department</p>
                        <div class="flex flex-wrap gap-1 mt-1">
                            ${subjects.map(s => `<span class="badge" style="background: ${color}15; color: ${color};">${s}</span>`).join('')}
                        </div>
                        <div class="flex items-center gap-3 mt-2 text-xs text-tertiary">
                            <span>📧 ${email}</span>
                            ${phone ? `<span>📞 ${phone}</span>` : ''}
                        </div>
                    </div>
                    <div class="flex flex-col gap-2">
                        <button class="btn btn-icon btn-sm btn-outline-primary" title="Email" onclick="event.stopPropagation(); location.href='mailto:${email}'">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                <polyline points="22,6 12,13 2,6"/>
                            </svg>
                        </button>
                        ${phone ? `
                        <button class="btn btn-icon btn-sm btn-outline-primary" title="Call" onclick="event.stopPropagation(); location.href='tel:${phone}'">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07"/>
                            </svg>
                        </button>` : ''}
                    </div>
                </div>
                <div class="flex gap-2 mt-3">
                    <span class="text-xs text-tertiary">🕐 ${schedule}</span>
                    <span class="text-xs text-tertiary">📍 ${room}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Event/Timetable Card
 * @param {Object} config
 * @returns {string} HTML
 */
export function TimetableCard(config) {
    const {
        title = 'Class',
        time = '09:00 - 10:00',
        teacher = '',
        room = '',
        type = 'class', // 'class' | 'lab' | 'break' | 'exam'
        color = 'var(--color-primary-500)',
        topic = ''
    } = config;
    
    const typeConfig = {
        class: { icon: '📝', borderColor: color },
        lab: { icon: '🔬', borderColor: 'var(--color-secondary-500)' },
        break: { icon: '☕', borderColor: 'var(--color-success-500)', bgColor: 'var(--color-success-50)' },
        exam: { icon: '📋', borderColor: 'var(--color-error-500)' },
    };
    
    const tc = typeConfig[type] || typeConfig.class;
    
    return `
        <div class="timetable-period">
            <div class="period-time">
                <span class="text-sm font-bold">${time.split(' - ')[0]}</span>
                <span class="text-xs text-secondary">${time.split(' - ')[1] || ''}</span>
            </div>
            <div class="period-line" style="background: ${tc.borderColor};"></div>
            <div class="card period-card" style="border-left: 4px solid ${tc.borderColor}; flex: 1; ${tc.bgColor ? 'background: ' + tc.bgColor + ';' : ''}">
                <div class="card__body" style="padding: var(--space-3);">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="font-semibold text-sm">${tc.icon} ${title}</h4>
                            ${teacher ? `<p class="text-xs text-secondary">${teacher}</p>` : ''}
                        </div>
                        ${room ? `<span class="badge" style="background: ${tc.borderColor}15; color: ${tc.borderColor};">${room}</span>` : ''}
                    </div>
                    ${topic ? `<p class="text-xs text-tertiary mt-1">📝 ${topic}</p>` : ''}
                </div>
            </div>
        </div>
    `;
}

/**
 * Notification Card
 * @param {Object} config
 * @returns {string} HTML
 */
export function NotificationCard(config) {
    const {
        title = 'Notification',
        message = '',
        icon = '🔔',
        iconBg = 'var(--bg-tertiary)',
        time = 'Just now',
        isRead = false,
        type = 'info', // 'info' | 'assignment' | 'exam' | 'achievement'
        actions = [], // [{ label, onClick, type }]
        href = '#'
    } = config;
    
    const typeColors = {
        assignment: 'var(--color-primary-500)',
        exam: 'var(--color-warning-500)',
        achievement: 'var(--color-success-500)',
        info: 'var(--color-primary-500)',
    };
    
    const borderColor = typeColors[type] || typeColors.info;
    
    return `
        <div class="card notification-card ${!isRead ? 'notification-card--unread' : ''}" 
             data-type="${type}"
             style="${!isRead ? 'border-left: 3px solid ' + borderColor + ';' : ''}">
            <div class="card__body" style="padding: var(--space-3); ${isRead ? 'opacity: 0.7;' : ''}">
                <div class="flex gap-3">
                    <div class="notification-icon" style="background: ${iconBg}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <span style="font-size: 18px;">${icon}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-start">
                            <h4 class="font-semibold text-sm">${title}</h4>
                            <span class="text-xs text-tertiary whitespace-nowrap ml-2">${time}</span>
                        </div>
                        <p class="text-xs text-secondary mt-1">${message}</p>
                        ${actions.length > 0 ? `
                            <div class="flex gap-2 mt-2">
                                ${actions.map(action => `
                                    <button class="btn btn-xs btn-${action.type || 'ghost'}" 
                                            onclick="event.stopPropagation(); ${action.onClick}">
                                        ${action.label}
                                    </button>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                    ${!isRead ? '<div class="unread-dot" style="width:8px;height:8px;background:' + borderColor + ';border-radius:50%;flex-shrink:0;margin-top:6px;"></div>' : ''}
                </div>
            </div>
        </div>
    `;
}

/**
 * Quiz/Test Card
 * @param {Object} config
 * @returns {string} HTML
 */
export function QuizCard(config) {
    const {
        title = 'Quiz',
        subject = '',
        icon = '🎯',
        questions = 10,
        duration = '10 min',
        rating = 4.5,
        attempts = 0,
        score = null,
        totalScore = null,
        status = 'not_started', // 'not_started' | 'in_progress' | 'completed'
        progress = 0,
        href = '#'
    } = config;
    
    const statusConfig = {
        not_started: { badge: 'Start', badgeClass: 'badge--primary', progressColor: 'var(--color-primary-500)' },
        in_progress: { badge: `${progress}% Done`, badgeClass: 'badge--warning', progressColor: 'var(--color-warning-500)' },
        completed: { badge: 'Completed', badgeClass: 'badge--success', progressColor: 'var(--color-success-500)' },
    };
    
    const sc = statusConfig[status] || statusConfig.not_started;
    
    return `
        <div class="card card--interactive" 
             onclick="window.location.hash='${href}'"
             style="${status === 'in_progress' ? 'border-left: 4px solid var(--color-warning-500);' : ''}">
            <div class="card__body">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2">
                        <span style="font-size: 24px;">${icon}</span>
                        <div>
                            <h4 class="font-semibold">${title}</h4>
                            <p class="text-xs text-secondary">${subject} • ${questions} Questions</p>
                        </div>
                    </div>
                    <span class="badge ${sc.badgeClass}">${duration}</span>
                </div>
                <div class="flex items-center gap-3 text-xs text-tertiary mb-2">
                    <span>⭐ ${rating} Rating</span>
                    <span>•</span>
                    <span>👥 ${attempts} Attempts</span>
                </div>
                ${score !== null && totalScore ? `
                    <div class="text-sm font-semibold text-success mb-2">Score: ${score}/${totalScore}</div>
                ` : ''}
                <div class="progress">
                    <div class="progress__bar" style="width: ${progress}%; background: ${sc.progressColor};"></div>
                </div>
                <p class="text-xs text-secondary mt-1">
                    ${status === 'completed' ? `✅ Completed • Scored ${score}/${totalScore}` : 
                      status === 'in_progress' ? `⏳ ${progress}% completed • Tap to resume` : 
                      '📝 Not attempted yet'}
                </p>
                ${status !== 'completed' ? `
                    <button class="btn btn-sm btn-primary mt-2" onclick="event.stopPropagation(); window.location.hash='${href}'">
                        ${status === 'in_progress' ? 'Resume' : 'Start Quiz'}
                    </button>
                ` : `
                    <button class="btn btn-sm btn-outline-primary mt-2" onclick="event.stopPropagation(); window.location.hash='${href}'">
                        Retake
                    </button>
                `}
            </div>
        </div>
    `;
}

/**
 * Empty State Card
 * @param {Object} config
 * @returns {string} HTML
 */
export function EmptyStateCard(config) {
    const {
        icon = '📭',
        title = 'Nothing here',
        description = 'No data available yet.',
        actionLabel = '',
        actionHref = '#',
        actionOnClick = null
    } = config;
    
    return `
        <div class="empty-state-center">
            <div class="empty-state__icon">${icon}</div>
            <h3 class="empty-state__title">${title}</h3>
            <p class="empty-state__description">${description}</p>
            ${actionLabel ? `
                <button class="btn btn-primary" 
                        ${actionHref ? `onclick="window.location.hash='${actionHref}'"` : ''}
                        ${actionOnClick ? `onclick="${actionOnClick}"` : ''}>
                    ${actionLabel}
                </button>
            ` : ''}
        </div>
    `;
}

/**
 * Stat Summary Card
 * @param {Object} config
 * @returns {string} HTML
 */
export function StatSummaryCard(config) {
    const {
        title = 'Summary',
        stats = [], // [{ label, value, color, icon }]
        href = null
    } = config;
    
    const cardContent = `
        <div class="card__header">
            <h3 class="section-title">${title}</h3>
            ${href ? `<a href="${href}" class="text-sm text-link">View All</a>` : ''}
        </div>
        <div class="card__body">
            <div class="grid grid-cols-${Math.min(stats.length, 4)} grid-gap-3">
                ${stats.map(stat => `
                    <div class="text-center" style="background: var(--bg-s