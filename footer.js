/* ============================================
   FOOTER COMPONENT
   App footer with links and info
   ============================================ */

/**
 * Footer component
 * @param {Object} options
 * @returns {string} HTML
 */
export function Footer(options = {}) {
    const { showLinks = true, showCopyright = true } = options;
    
    return `
        <footer class="app-footer" style="padding: var(--space-4); text-align: center; border-top: 1px solid var(--border-color); margin-top: auto;">
            ${showLinks ? `
                <div class="flex justify-center gap-4 mb-3" style="flex-wrap: wrap;">
                    <a href="#/about" class="text-sm text-secondary link-hover">About</a>
                    <a href="#/contact" class="text-sm text-secondary link-hover">Contact</a>
                    <a href="#/feedback" class="text-sm text-secondary link-hover">Feedback</a>
                    <a href="#/settings" class="text-sm text-secondary link-hover">Settings</a>
                    <a href="#/privacy" class="text-sm text-secondary link-hover">Privacy</a>
                    <a href="#/terms" class="text-sm text-secondary link-hover">Terms</a>
                </div>
            ` : ''}
            ${showCopyright ? `
                <p class="text-xs text-tertiary">
                    &copy; ${new Date().getFullYear()} Student App. All rights reserved.
                </p>
                <p class="text-xs text-tertiary mt-1">
                    Made with ❤️ for students everywhere
                </p>
            ` : ''}
        </footer>
    `;
}

export default { Footer };