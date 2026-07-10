/* ============================================
   FORM COMPONENTS
   Reusable form field generators
   ============================================ */

import { generateId } from '../js/utils.js';

/**
 * Generate a form input field
 * @param {Object} config
 * @returns {string} HTML
 */
export function FormInput(config) {
    const {
        type = 'text',
        name = '',
        id = generateId('input'),
        label = '',
        placeholder = '',
        value = '',
        required = false,
        disabled = false,
        readonly = false,
        icon = null,
        iconPosition = 'left',
        error = '',
        helperText = '',
        className = '',
        autocomplete = '',
        min = null,
        max = null,
        maxlength = null,
        pattern = null
    } = config;
    
    const inputAttrs = [
        `type="${type}"`,
        `name="${name}"`,
        `id="${id}"`,
        `placeholder="${placeholder}"`,
        `value="${value}"`,
        required ? 'required' : '',
        disabled ? 'disabled' : '',
        readonly ? 'readonly' : '',
        autocomplete ? `autocomplete="${autocomplete}"` : '',
        min !== null ? `min="${min}"` : '',
        max !== null ? `max="${max}"` : '',
        maxlength ? `maxlength="${maxlength}"` : '',
        pattern ? `pattern="${pattern}"` : '',
        className ? `class="form-input ${className}"` : 'class="form-input"'
    ].filter(Boolean).join(' ');
    
    const iconHtml = icon ? `
        <svg class="input-with-icon__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${icon}
        </svg>
    ` : '';
    
    return `
        <div class="form-group">
            ${label ? `
                <label class="form-label ${required ? 'form-label--required' : ''}" for="${id}">
                    ${label}
                </label>
            ` : ''}
            <div class="input-with-icon ${iconPosition === 'right' ? 'input-with-icon--right' : ''}">
                ${iconPosition === 'left' ? iconHtml : ''}
                <input ${inputAttrs}>
                ${iconPosition === 'right' ? iconHtml : ''}
            </div>
            ${error ? `<span class="helper-text helper-text--error">${error}</span>` : ''}
            ${helperText && !error ? `<span class="helper-text">${helperText}</span>` : ''}
        </div>
    `;
}

/**
 * Generate a select dropdown
 * @param {Object} config
 * @returns {string} HTML
 */
export function FormSelect(config) {
    const {
        name = '',
        id = generateId('select'),
        label = '',
        options = [],
        selected = '',
        required = false,
        disabled = false,
        placeholder = 'Select...'
    } = config;
    
    return `
        <div class="form-group">
            ${label ? `
                <label class="form-label ${required ? 'form-label--required' : ''}" for="${id}">
                    ${label}
                </label>
            ` : ''}
            <select name="${name}" id="${id}" class="form-input form-select" 
                    ${required ? 'required' : ''} ${disabled ? 'disabled' : ''}>
                <option value="">${placeholder}</option>
                ${options.map(opt => `
                    <option value="${opt.value}" ${opt.value === selected ? 'selected' : ''}>
                        ${opt.label}
                    </option>
                `).join('')}
            </select>
        </div>
    `;
}

/**
 * Generate a textarea
 * @param {Object} config
 * @returns {string} HTML
 */
export function FormTextarea(config) {
    const {
        name = '',
        id = generateId('textarea'),
        label = '',
        placeholder = '',
        value = '',
        rows = 4,
        required = false,
        maxlength = null,
        showCount = false
    } = config;
    
    return `
        <div class="form-group">
            ${label ? `
                <label class="form-label ${required ? 'form-label--required' : ''}" for="${id}">
                    ${label}
                </label>
            ` : ''}
            <textarea 
                name="${name}" 
                id="${id}" 
                class="form-input form-textarea" 
                placeholder="${placeholder}" 
                rows="${rows}"
                ${required ? 'required' : ''}
                ${maxlength ? `maxlength="${maxlength}"` : ''}
            >${value}</textarea>
            ${showCount && maxlength ? `<span class="helper-text" id="${id}-count">${value.length}/${maxlength}</span>` : ''}
        </div>
    `;
}

/**
 * Generate a toggle/switch
 * @param {Object} config
 * @returns {string} HTML
 */
export function FormToggle(config) {
    const {
        name = '',
        id = generateId('toggle'),
        label = '',
        checked = false,
        disabled = false
    } = config;
    
    return `
        <div class="settings-item">
            <div class="flex-1">
                <div class="font-medium text-sm">${label}</div>
            </div>
            <label class="switch">
                <input type="checkbox" name="${name}" id="${id}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}>
                <span class="switch__slider"></span>
            </label>
        </div>
    `;
}

/**
 * Generate a checkbox group
 * @param {Object} config
 * @returns {string} HTML
 */
export function FormCheckbox(config) {
    const {
        name = '',
        id = generateId('checkbox'),
        label = '',
        checked = false,
        required = false,
        link = null
    } = config;
    
    return `
        <label class="checkbox-group">
            <input type="checkbox" name="${name}" id="${id}" ${checked ? 'checked' : ''} ${required ? 'required' : ''}>
            <span class="text-sm text-secondary">
                ${label}
                ${link ? `<a href="${link.href}" class="text-link">${link.text}</a>` : ''}
            </span>
        </label>
    `;
}

/**
 * Generate a radio group
 * @param {Object} config
 * @returns {string} HTML
 */
export function FormRadioGroup(config) {
    const {
        name = '',
        label = '',
        options = [],
        selected = '',
        required = false
    } = config;
    
    return `
        <div class="form-group">
            ${label ? `<label class="form-label">${label}</label>` : ''}
            <div class="flex gap-4">
                ${options.map(opt => `
                    <label class="radio-group">
                        <input type="radio" name="${name}" value="${opt.value}" 
                               ${opt.value === selected ? 'checked' : ''} ${required ? 'required' : ''}>
                        ${opt.label}
                    </label>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Create a complete form from schema
 * @param {Array} fields - Array of field configs
 * @param {Object} options
 * @returns {string} HTML
 */
export function createForm(fields, options = {}) {
    const { id = generateId('form'), submitLabel = 'Submit', onSubmit = null } = options;
    
    const fieldsHtml = fields.map(field => {
        switch (field.type) {
            case 'select':
                return FormSelect(field);
            case 'textarea':
                return FormTextarea(field);
            case 'toggle':
                return FormToggle(field);
            case 'checkbox':
                return FormCheckbox(field);
            case 'radio':
                return FormRadioGroup(field);
            default:
                return FormInput(field);
        }
    }).join('');
    
    return `
        <form class="form-layout" id="${id}" novalidate>
            ${fieldsHtml}
            <button type="submit" class="btn btn-primary btn-block">
                ${submitLabel}
            </button>
        </form>
    `;
}

// Common icon paths for inputs
export const InputIcons = {
    email: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    password: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>',
    user: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    phone: '<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'
};

export default {
    FormInput,
    FormSelect,
    FormTextarea,
    FormToggle,
    FormCheckbox,
    FormRadioGroup,
    createForm,
    InputIcons
};