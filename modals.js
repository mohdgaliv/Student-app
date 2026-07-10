/* ============================================
   MODAL COMPONENT
   Reusable modal dialog
   ============================================ */

import { generateId } from '../js/utils.js';

/**
 * Show a modal
 * @param {Object} options
 * @param {string} options.title - Modal title
 * @param {string} options.content - HTML content
 * @param {Array} options.actions - Footer buttons [{ text, type, onClick }]
 * @param {boolean} options.closeOnOverlay - Close on overlay click
 * @param {string} options.size - 'sm' | 'md' | 'lg' | 'full'
 * @returns {string} Modal ID
 */
export function showModal(options = {}) {
    const {
        title = '',
        content = '',
        actions = [],
        closeOnOverlay = true,
        size = 'md'
    } = options;
    
    const modalId = generateId('modal');
    const container = document.getElementById('modal-container');
    
    if (!container) return null;
    
    const sizeClass = size !== 'md' ? `modal-content--${size}` : '';
    
    const html = `
        <div class="modal-overlay" id="${modalId}" role="dialog" aria-modal="true" aria-labelledby="${modalId}-title">
            <div class="modal-content ${sizeClass}">
                <div class="modal__header">
                    <h3 class="modal__title" id="${modalId}-title">${title}</h3>
                    <button class="modal__close" onclick="document.dispatchEvent(new CustomEvent('modal:close', {detail:'${modalId}'}))" aria-label="Close">✕</button>
                </div>
                <div class="modal__body">
                    ${content}
                </div>
                ${actions.length > 0 ? `
                    <div class="modal__footer">
                        ${actions.map(action => `
                            <button class="btn btn-${action.type || 'ghost'}" 
                                    onclick="document.dispatchEvent(new CustomEvent('modal:action', {detail:{modalId:'${modalId}', action:'${action.id}'}}))">
                                ${action.text}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    container.innerHTML += html;
    
    // Close on overlay click
    if (closeOnOverlay) {
        const overlay = document.getElementById(modalId);
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeModal(modalId);
                }
            });
        }
    }
    
    // Listen for close event
    const closeHandler = (e) => {
        if (e.detail === modalId) {
            closeModal(modalId);
            document.removeEventListener('modal:close', closeHandler);
        }
    };
    document.addEventListener('modal:close', closeHandler);
    
    return modalId;
}

/**
 * Close a modal by ID
 * @param {string} modalId
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.2s ease';
        setTimeout(() => modal.remove(), 200);
    }
}

/**
 * Confirm dialog
 * @param {string} message
 * @param {string} title
 * @returns {Promise<boolean>}
 */
export function confirmDialog(message, title = 'Confirm') {
    return new Promise((resolve) => {
        const modalId = showModal({
            title,
            content: `<p class="text-secondary">${message}</p>`,
            actions: [
                { id: 'cancel', text: 'Cancel', type: 'ghost' },
                { id: 'confirm', text: 'Confirm', type: 'primary' }
            ]
        });
        
        const handler = (e) => {
            if (e.detail.modalId === modalId) {
                document.removeEventListener('modal:action', handler);
                resolve(e.detail.action === 'confirm');
            }
        };
        document.addEventListener('modal:action', handler);
    });
}

/**
 * Alert dialog
 * @param {string} message
 * @param {string} title
 */
export function alertDialog(message, title = 'Alert') {
    showModal({
        title,
        content: `<p class="text-secondary">${message}</p>`,
        actions: [
            { id: 'ok', text: 'OK', type: 'primary' }
        ]
    });
}

export default { showModal, closeModal, confirmDialog, alertDialog };