/* ============================================
   DATA FORMATTER
   Formatting utilities for display
   ============================================ */

/**
 * Format a date to a readable string
 * @param {Date|string|number} date - Input date
 * @param {string} format - 'full' | 'short' | 'time' | 'relative' | 'input'
 * @returns {string}
 */
export function formatDate(date, format = 'short') {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid date';
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    switch (format) {
        case 'full':
            return `${fullMonthNames[d.getMonth()]} ${day}, ${year}`;
        case 'short':
            return `${monthNames[d.getMonth()]} ${day}, ${year}`;
        case 'numeric':
            return `${day}/${month}/${year}`;
        case 'time':
            return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        case 'datetime':
            return `${monthNames[d.getMonth()]} ${day}, ${year} at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
        case 'relative':
            return timeAgo(d);
        case 'input':
            return `${year}-${month}-${day}`;
        default:
            return d.toLocaleDateString();
    }
}

/**
 * Format relative time
 * @param {Date|string} date
 * @returns {string}
 */
export function timeAgo(date) {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);
    
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    if (diffWeek < 4) return `${diffWeek}w ago`;
    if (diffMonth < 12) return `${diffMonth}mo ago`;
    return `${diffYear}y ago`;
}

/**
 * Format a number with commas
 * @param {number} num
 * @param {number} decimals
 * @returns {string}
 */
export function formatNumber(num, decimals = 0) {
    if (isNaN(num)) return '0';
    return Number(num).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Format as currency
 * @param {number} amount
 * @param {string} currency
 * @returns {string}
 */
export function formatCurrency(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Format percentage
 * @param {number} value
 * @param {number} total
 * @param {number} decimals
 * @returns {string}
 */
export function formatPercentage(value, total, decimals = 0) {
    if (total === 0) return '0%';
    return ((value / total) * 100).toFixed(decimals) + '%';
}

/**
 * Format file size
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration in minutes to readable string
 * @param {number} minutes
 * @returns {string}
 */
export function formatDuration(minutes) {
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

/**
 * Format phone number
 * @param {string} phone
 * @returns {string}
 */
export function formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
}

/**
 * Truncate text with ellipsis
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength).trim() + '...';
}

/**
 * Capitalize first letter of each word
 * @param {string} str
 * @returns {string}
 */
export function titleCase(str) {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

/**
 * Convert string to slug
 * @param {string} str
 * @returns {string}
 */
export function slugify(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Format grade from marks
 * @param {number} marks
 * @param {number} total
 * @returns {Object} { grade, percentage, color }
 */
export function formatGrade(marks, total) {
    const percentage = (marks / total) * 100;
    
    if (percentage >= 90) return { grade: 'A+', percentage: Math.round(percentage), color: 'var(--color-success-500)' };
    if (percentage >= 80) return { grade: 'A', percentage: Math.round(percentage), color: 'var(--color-success-500)' };
    if (percentage >= 70) return { grade: 'B+', percentage: Math.round(percentage), color: 'var(--color-primary-500)' };
    if (percentage >= 60) return { grade: 'B', percentage: Math.round(percentage), color: 'var(--color-primary-500)' };
    if (percentage >= 50) return { grade: 'C', percentage: Math.round(percentage), color: 'var(--color-warning-500)' };
    if (percentage >= 40) return { grade: 'D', percentage: Math.round(percentage), color: 'var(--color-warning-500)' };
    return { grade: 'F', percentage: Math.round(percentage), color: 'var(--color-error-500)' };
}

/**
 * Format attendance status
 * @param {number} percentage
 * @returns {Object} { status, color, label }
 */
export function formatAttendanceStatus(percentage) {
    if (percentage >= 85) return { status: 'excellent', color: 'var(--color-success-500)', label: 'Excellent' };
    if (percentage >= 75) return { status: 'good', color: 'var(--color-success-500)', label: 'Good' };
    if (percentage >= 65) return { status: 'warning', color: 'var(--color-warning-500)', label: 'Warning' };
    return { status: 'danger', color: 'var(--color-error-500)', label: 'Critical' };
}

/**
 * Format countdown timer
 * @param {number} seconds
 * @returns {string}
 */
export function formatCountdown(seconds) {
    if (seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get ordinal suffix (1st, 2nd, 3rd, etc.)
 * @param {number} n
 * @returns {string}
 */
export function ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Format a list with Oxford comma
 * @param {Array} items
 * @param {string} conjunction
 * @returns {string}
 */
export function formatList(items, conjunction = 'and') {
    if (!items || items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
    return `${items.slice(0, -1).join(', ')}, ${conjunction} ${items[items.length - 1]}`;
}

/**
 * Format bytes with unit
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
    return formatFileSize(bytes);
}

/**
 * Get day name from date
 * @param {Date|string} date
 * @param {boolean} short
 * @returns {string}
 */
export function getDayName(date, short = false) {
    const days = short 
        ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date(date).getDay()];
}

/**
 * Get month name
 * @param {number} month - 0-11
 * @param {boolean} short
 * @returns {string}
 */
export function getMonthName(month, short = false) {
    const months = short
        ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month] || '';
}

export default {
    formatDate,
    timeAgo,
    formatNumber,
    formatCurrency,
    formatPercentage,
    formatFileSize,
    formatDuration,
    formatPhone,
    truncateText,
    titleCase,
    slugify,
    formatGrade,
    formatAttendanceStatus,
    formatCountdown,
    ordinal,
    formatList,
    formatBytes,
    getDayName,
    getMonthName
};