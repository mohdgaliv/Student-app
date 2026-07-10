/* ============================================
   FORM VALIDATOR
   Comprehensive form validation with custom rules
   ============================================ */

import { isEmpty, isValidEmail, isValidPhone, isValidURL } from './utils.js';

/**
 * Validator - Flexible form/field validation
 * Features: built-in rules, custom rules, async validation, error messages
 */
class Validator {
    constructor() {
        /** @type {Object} Built-in validation rules */
        this._rules = {
            required: this._required.bind(this),
            email: this._email.bind(this),
            phone: this._phone.bind(this),
            url: this._url.bind(this),
            minLength: this._minLength.bind(this),
            maxLength: this._maxLength.bind(this),
            min: this._min.bind(this),
            max: this._max.bind(this),
            pattern: this._pattern.bind(this),
            match: this._match.bind(this),
            number: this._number.bind(this),
            integer: this._integer.bind(this),
            alpha: this._alpha.bind(this),
            alphanumeric: this._alphanumeric.bind(this),
            password: this._password.bind(this),
            date: this._date.bind(this),
            fileType: this._fileType.bind(this),
            fileSize: this._fileSize.bind(this),
            custom: this._custom.bind(this)
        };
        
        /** @type {Object} Custom error messages */
        this._messages = {
            required: 'This field is required',
            email: 'Please enter a valid email address',
            phone: 'Please enter a valid phone number',
            url: 'Please enter a valid URL',
            minLength: 'Must be at least {0} characters',
            maxLength: 'Must be at most {0} characters',
            min: 'Must be at least {0}',
            max: 'Must be at most {0}',
            pattern: 'Invalid format',
            match: 'Fields do not match',
            number: 'Must be a number',
            integer: 'Must be a whole number',
            alpha: 'Only letters allowed',
            alphanumeric: 'Only letters and numbers allowed',
            password: 'Password is too weak',
            date: 'Please enter a valid date',
            fileType: 'File type not allowed. Allowed: {0}',
            fileSize: 'File is too large. Max: {0}'
        };
        
        /** @type {Map} Registered custom rules */
        this._customRules = new Map();
    }

    /**
     * Set custom error messages
     * @param {Object} messages - { ruleName: 'message' }
     */
    setMessages(messages) {
        Object.assign(this._messages, messages);
    }

    /**
     * Register a custom validation rule
     * @param {string} name - Rule name
     * @param {Function} validatorFn - (value, params, formData) => true|string
     * @param {string} defaultMessage
     */
    addRule(name, validatorFn, defaultMessage = 'Invalid value') {
        this._customRules.set(name, {
            validate: validatorFn,
            message: defaultMessage
        });
    }

    /**
     * Validate a single field
     * @param {*} value - Field value
     * @param {Array} rules - Array of rule strings/objects
     * @param {Object} formData - All form data (for match etc.)
     * @returns {Object} { valid: boolean, errors: string[] }
     * 
     * @example
     * validator.validateField('john@email.com', ['required', 'email']);
     * validator.validateField('pass123', [
     *     'required',
     *     { rule: 'minLength', params: [8] },
     *     { rule: 'password' }
     * ]);
     */
    validateField(value, rules, formData = {}) {
        const errors = [];
        
        for (const rule of rules) {
            let ruleName, params;
            
            if (typeof rule === 'string') {
                ruleName = rule;
                params = [];
            } else if (typeof rule === 'object') {
                ruleName = rule.rule;
                params = rule.params || [];
                // Allow custom message per rule
                if (rule.message) {
                    this._messages[ruleName] = rule.message;
                }
            }
            
            // Check if it's a custom rule
            if (this._customRules.has(ruleName)) {
                const customRule = this._customRules.get(ruleName);
                const result = customRule.validate(value, params, formData);
                if (result !== true) {
                    errors.push(typeof result === 'string' ? result : customRule.message);
                }
                continue;
            }
            
            // Built-in rule
            const validatorFn = this._rules[ruleName];
            if (!validatorFn) {
                console.warn(`[Validator] Unknown rule: "${ruleName}"`);
                continue;
            }
            
            const isValid = validatorFn(value, ...params, formData);
            if (!isValid) {
                let message = this._messages[ruleName] || 'Invalid value';
                // Replace placeholders with params
                params.forEach((param, index) => {
                    message = message.replace(`{${index}}`, param);
                });
                errors.push(message);
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate an entire form
     * @param {Object} formData - { fieldName: value }
     * @param {Object} validationRules - { fieldName: rules[] }
     * @returns {Object} { valid: boolean, errors: Object, firstError: string|null }
     * 
     * @example
     * const result = validator.validateForm(
     *     { email: 'test@email.com', password: 'pass123' },
     *     {
     *         email: ['required', 'email'],
     *         password: ['required', { rule: 'minLength', params: [6] }]
     *     }
     * );
     * 
     * if (!result.valid) {
     *     console.log(result.errors); // { email: [...], password: [...] }
     * }
     */
    validateForm(formData, validationRules) {
        const errors = {};
        let firstError = null;
        
        for (const [fieldName, rules] of Object.entries(validationRules)) {
            const value = formData[fieldName];
            const result = this.validateField(value, rules, formData);
            
            if (!result.valid) {
                errors[fieldName] = result.errors;
                if (!firstError) {
                    firstError = result.errors[0];
                }
            }
        }
        
        return {
            valid: Object.keys(errors).length === 0,
            errors,
            firstError
        };
    }

    /**
     * Validate an HTML form element
     * @param {HTMLFormElement} formElement
     * @param {Object} rules
     * @returns {Object} Validation result
     */
    validateHTMLForm(formElement, rules) {
        const formData = new FormData(formElement);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });
        
        const result = this.validateForm(data, rules);
        
        // Show/hide error messages on form
        this._displayFormErrors(formElement, result.errors, rules);
        
        return result;
    }

    /**
     * Display validation errors on form
     * @param {HTMLFormElement} form
     * @param {Object} errors
     * @param {Object} rules
     */
    _displayFormErrors(form, errors, rules) {
        // Clear previous errors
        form.querySelectorAll('.form-input--error').forEach(el => {
            el.classList.remove('form-input--error');
        });
        form.querySelectorAll('.helper-text--error').forEach(el => {
            el.remove();
        });
        
        // Show new errors
        Object.entries(errors).forEach(([fieldName, fieldErrors]) => {
            const input = form.querySelector(`[name="${fieldName}"]`);
            if (input) {
                input.classList.add('form-input--error');
                
                // Add error message below input
                const errorEl = document.createElement('span');
                errorEl.className = 'helper-text helper-text--error';
                errorEl.textContent = fieldErrors[0];
                input.parentNode.appendChild(errorEl);
            }
        });
    }

    /**
     * Validate a field and return boolean
     * @param {*} value
     * @param {Array} rules
     * @param {Object} formData
     * @returns {boolean}
     */
    isValid(value, rules, formData = {}) {
        return this.validateField(value, rules, formData).valid;
    }

    // ========== BUILT-IN VALIDATION RULES ==========

    _required(value) {
        return !isEmpty(value);
    }

    _email(value) {
        if (isEmpty(value)) return true; // Use required separately
        return isValidEmail(value);
    }

    _phone(value) {
        if (isEmpty(value)) return true;
        return isValidPhone(value);
    }

    _url(value) {
        if (isEmpty(value)) return true;
        return isValidURL(value);
    }

    _minLength(value, min) {
        if (isEmpty(value)) return true;
        return String(value).length >= min;
    }

    _maxLength(value, max) {
        if (isEmpty(value)) return true;
        return String(value).length <= max;
    }

    _min(value, min) {
        if (isEmpty(value)) return true;
        return Number(value) >= min;
    }

    _max(value, max) {
        if (isEmpty(value)) return true;
        return Number(value) <= max;
    }

    _pattern(value, regex) {
        if (isEmpty(value)) return true;
        const pattern = typeof regex === 'string' ? new RegExp(regex) : regex;
        return pattern.test(value);
    }

    _match(value, matchField, formData = {}) {
        return value === formData[matchField];
    }

    _number(value) {
        if (isEmpty(value)) return true;
        return !isNaN(Number(value));
    }

    _integer(value) {
        if (isEmpty(value)) return true;
        return Number.isInteger(Number(value));
    }

    _alpha(value) {
        if (isEmpty(value)) return true;
        return /^[a-zA-Z]+$/.test(value);
    }

    _alphanumeric(value) {
        if (isEmpty(value)) return true;
        return /^[a-zA-Z0-9]+$/.test(value);
    }

    _password(value) {
        if (isEmpty(value)) return true;
        // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);
    }

    _date(value) {
        if (isEmpty(value)) return true;
        const date = new Date(value);
        return !isNaN(date.getTime());
    }

    _fileType(value, allowedTypes) {
        if (!value || !value.name) return true;
        const extension = value.name.split('.').pop().toLowerCase();
        const types = typeof allowedTypes === 'string' 
            ? allowedTypes.split(',') 
            : allowedTypes;
        return types.map(t => t.trim()).includes(extension);
    }

    _fileSize(value, maxSize) {
        if (!value || !value.size) return true;
        // maxSize in MB
        return value.size <= maxSize * 1024 * 1024;
    }

    _custom(value, customFn, ...params) {
        if (isEmpty(value)) return true;
        return customFn(value, ...params);
    }
}

// Common validation rule presets
export const VALIDATION_PRESETS = {
    // Auth
    loginEmail: ['required', 'email'],
    loginPassword: ['required'],
    registerName: ['required', { rule: 'minLength', params: [2] }],
    registerEmail: ['required', 'email'],
    registerPassword: [
        'required',
        { rule: 'minLength', params: [8] },
        { rule: 'password' }
    ],
    registerConfirmPassword: [
        'required',
        { rule: 'match', params: ['password'] }
    ],
    phone: ['required', 'phone'],
    
    // Profile
    fullName: ['required', { rule: 'minLength', params: [2] }],
    bio: [{ rule: 'maxLength', params: [500] }],
    website: ['url'],
    
    // Forms
    title: ['required', { rule: 'minLength', params: [3] }],
    description: ['required', { rule: 'minLength', params: [10] }],
    date: ['required', 'date'],
    
    // Feedback
    subject: ['required'],
    message: ['required', { rule: 'minLength', params: [20] }],
    rating: ['required', { rule: 'min', params: [1] }, { rule: 'max', params: [5] }]
};

// Create and export singleton instance
const validator = new Validator();

export { Validator };
export default validator;