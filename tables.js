/* ============================================
   TABLE COMPONENT
   Reusable data tables with sorting & actions
   ============================================ */

import { formatDate } from '../js/formatter.js';

/**
 * Create a data table
 * @param {Object} config
 * @param {Array} config.columns - [{ key, label, sortable, render }]
 * @param {Array} config.rows - Data rows
 * @param {string} config.emptyMessage
 * @param {boolean} config.striped
 * @param {boolean} config.hoverable
 * @returns {string} HTML
 */
export function DataTable(config) {
    const {
        columns = [],
        rows = [],
        emptyMessage = 'No data available',
        striped = true,
        hoverable = true,
        responsive = true
    } = config;
    
    if (rows.length === 0) {
        return `
            <div class="empty-state-center">
                <div class="empty-state__icon">📊</div>
                <h3 class="empty-state__title">No Data</h3>
                <p class="empty-state__description">${emptyMessage}</p>
            </div>
        `;
    }
    
    const tableHtml = `
        <table class="${striped ? 'table--striped' : ''} ${hoverable ? 'table--hoverable' : ''}">
            <thead>
                <tr>
                    ${columns.map(col => `
                        <th class="${col.sortable ? 'table__th--sortable' : ''}" 
                            data-sort="${col.key}"
                            ${col.width ? `style="width:${col.width}"` : ''}>
                            ${col.label || col.key}
                            ${col.sortable ? '<span class="sort-icon">↕</span>' : ''}
                        </th>
                    `).join('')}
                </tr>
            </thead>
            <tbody>
                ${rows.map((row, index) => `
                    <tr data-index="${index}">
                        ${columns.map(col => `
                            <td data-label="${col.label || col.key}">
                                ${col.render ? col.render(row[col.key], row) : (row[col.key] ?? '-')}
                            </td>
                        `).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    if (responsive) {
        return `<div class="table-responsive">${tableHtml}</div>`;
    }
    
    return tableHtml;
}

/**
 * Create an attendance table
 * @param {Array} data
 * @returns {string} HTML
 */
export function AttendanceTable(data) {
    const columns = [
        { key: 'date', label: 'Date', sortable: true, render: (val) => formatDate(val) },
        { key: 'subject', label: 'Subject', sortable: true },
        { key: 'status', label: 'Status', render: (val) => {
            const statusMap = {
                present: '<span class="badge badge--success">Present</span>',
                absent: '<span class="badge badge--error">Absent</span>',
                late: '<span class="badge badge--warning">Late</span>',
                excused: '<span class="badge badge--primary">Excused</span>'
            };
            return statusMap[val] || val;
        }},
        { key: 'time', label: 'Time' },
        { key: 'remarks', label: 'Remarks', render: (val) => val || '-' }
    ];
    
    return DataTable({ columns, rows: data, emptyMessage: 'No attendance records' });
}

/**
 * Create a results/grades table
 * @param {Array} data
 * @returns {string} HTML
 */
export function ResultsTable(data) {
    const columns = [
        { key: 'subject', label: 'Subject', sortable: true },
        { key: 'code', label: 'Code' },
        { key: 'internalMarks', label: 'Internal', render: (val, row) => `${val}/${row.internalTotal || 30}` },
        { key: 'externalMarks', label: 'External', render: (val, row) => `${val}/${row.externalTotal || 70}` },
        { key: 'totalMarks', label: 'Total', sortable: true, render: (val, row) => {
            const total = (row.internalMarks || 0) + (row.externalMarks || 0);
            return `<strong>${total}</strong>`;
        }},
        { key: 'grade', label: 'Grade', render: (val) => {
            const gradeColors = { 'A+': 'success', 'A': 'success', 'B+': 'primary', 'B': 'primary', 'C': 'warning', 'D': 'warning', 'F': 'error' };
            return `<span class="badge badge--${gradeColors[val] || 'neutral'}">${val}</span>`;
        }}
    ];
    
    return DataTable({ columns, rows: data, emptyMessage: 'No results available' });
}

export default { DataTable, AttendanceTable, ResultsTable };