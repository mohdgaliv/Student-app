/* ============================================
   CHART COMPONENTS
   Bar charts, progress circles, line charts
   ============================================ */

/**
 * Create a vertical bar chart
 * @param {Array} data - [{ label, value, color }]
 * @param {number} height - Chart height in px
 * @returns {string} HTML
 */
export function BarChart(data, height = 200) {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    return `
        <div class="chart-bars" style="height: ${height}px;">
            ${data.map(item => {
                const percent = (item.value / maxValue) * 100;
                const color = item.color || 'var(--color-primary-500)';
                return `
                    <div class="chart-bar-group">
                        <div class="chart-bar" style="height: ${percent}%; background: ${color};" title="${item.label}: ${item.value}">
                            <span class="chart-value">${item.value}</span>
                        </div>
                        <span class="chart-label">${item.label}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Create a progress circle
 * @param {number} percentage - 0-100
 * @param {number} size - Circle size in px
 * @param {string} color - Stroke color
 * @returns {string} HTML
 */
export function ProgressCircle(percentage, size = 80, color = 'var(--color-success-500)') {
    const radius = (size / 2) - 5;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    
    return `
        <div class="progress-circle" style="width: ${size}px; height: ${size}px;">
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                <circle cx="${size/2}" cy="${size/2}" r="${radius}" 
                        fill="none" stroke="var(--bg-tertiary)" stroke-width="6"/>
                <circle cx="${size/2}" cy="${size/2}" r="${radius}" 
                        fill="none" stroke="${color}" stroke-width="6" 
                        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" 
                        stroke-linecap="round" transform="rotate(-90 ${size/2} ${size/2})"/>
            </svg>
            <span class="progress-circle__value">${percentage}%</span>
        </div>
    `;
}

/**
 * Create a stat card
 * @param {Object} config
 * @returns {string} HTML
 */
export function StatCard(config) {
    const { icon, value, label, trend, color } = config;
    
    return `
        <div class="stat-card card">
            <div class="stat-card__icon">${icon || ''}</div>
            <div class="stat-card__value" style="${color ? 'color: ' + color : ''}">${value}</div>
            <div class="stat-card__label">${label}</div>
            ${trend ? `<div class="text-xs ${trend > 0 ? 'text-success' : 'text-error'} mt-1">
                ${trend > 0 ? '↑' : '↓'} ${Math.abs(trend)}%
            </div>` : ''}
        </div>
    `;
}

export default { BarChart, ProgressCircle, StatCard };