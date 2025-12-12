/**
 * Tutorial Slide Component
 * Shows AI-ready data explanation and IDE options
 */

import { icons } from '../components/icons.js';
import { PrimaryButton, BackButton } from '../components/Button.js';

export function Tutorial() {
    return `
    <section class="slide slide-tutorial" id="slide-tutorial">
        <div class="slide-content tutorial-content">
            <h2 class="tutorial-title">AI-Ready Data</h2>
            <p class="tutorial-subtitle">Open your extracted folder in an AI-integrated editor of your choice</p>
            
            <div class="ide-grid">
                <a href="https://cursor.com/?from=home" class="ide-card" target="_blank">
                    <svg class="ide-logo" fill="currentColor" fill-rule="evenodd" viewBox="0 0 24 24">
                        <path d="M22.106 5.68L12.5.135a.998.998 0 00-.998 0L1.893 5.68a.84.84 0 00-.419.726v11.186c0 .3.16.577.42.727l9.607 5.547a.999.999 0 00.998 0l9.608-5.547a.84.84 0 00.42-.727V6.407a.84.84 0 00-.42-.726zm-.603 1.176L12.228 22.92c-.063.108-.228.064-.228-.061V12.34a.59.59 0 00-.295-.51l-9.11-5.26c-.107-.062-.063-.228.062-.228h18.55c.264 0 .428.286.296.514z"/>
                    </svg>
                    <span class="ide-name">Cursor</span>
                </a>
                <a href="https://windsurf.com/" class="ide-card" target="_blank">
                    <svg class="ide-logo" fill="none" viewBox="0 0 512 512">
                        <g clip-path="url(#clip0)"><g clip-path="url(#clip1)">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M507.307 106.752h-4.864a46.653 46.653 0 00-43.025 28.969 46.66 46.66 0 00-3.482 17.879v104.789c0 20.907-17.152 37.867-37.547 37.867a38.785 38.785 0 01-31.402-16.491l-106.07-152.832a46.865 46.865 0 00-38.613-20.266c-24.192 0-45.952 20.736-45.952 46.357v105.387c0 20.906-17.003 37.866-37.547 37.866-12.16 0-24.234-6.165-31.402-16.49L8.704 108.757C6.016 104.917 0 106.816 0 111.531v91.392c0 4.608 1.408 9.088 4.01 12.885l116.801 168.299c6.912 9.941 17.066 17.322 28.821 20.01 29.376 6.742 56.427-16.085 56.427-45.162V253.653c0-20.906 16.789-37.866 37.546-37.866h.043c12.501 0 24.213 6.144 31.403 16.49L381.12 385.088a45.872 45.872 0 0038.613 20.267c24.704 0 45.888-20.758 45.888-46.358V253.632c0-20.907 16.79-37.867 37.547-37.867h4.139c2.602 0 4.693-2.133 4.693-4.736v-99.562a4.7 4.7 0 00-1.366-3.34 4.705 4.705 0 00-3.327-1.396v.021z" fill="currentColor"/>
                        </g></g>
                        <defs>
                            <clipPath id="clip0"><path fill="currentColor" d="M0 0h512v512H0z"/></clipPath>
                            <clipPath id="clip1"><path fill="currentColor" d="M0 0h512v512H0z"/></clipPath>
                        </defs>
                    </svg>
                    <span class="ide-name">Windsurf</span>
                </a>
                <a href="https://antigravity.google/" class="ide-card" target="_blank">
                    <svg class="ide-logo" viewBox="0 0 24 24" fill="currentColor">
                        <path d="m19.94,20.59c1.09.82,2.73.27,1.23-1.23-4.5-4.36-3.55-16.36-9.14-16.36S7.39,15,2.89,19.36c-1.64,1.64.14,2.05,1.23,1.23,4.23-2.86,3.95-7.91,7.91-7.91s3.68,5.05,7.91,7.91Z"/>
                    </svg>
                    <span class="ide-name">Antigravity</span>
                </a>
            </div>
            
            <p class="tutorial-description">Chat with your business documents natively. Make plans, visualizations, and more.</p>
            
            <div class="security-notice">
                ${icons.lock.replace('<svg', '<svg class="security-icon"')}
                <p class="security-text">All processing happens locally on your device. Your documents never leave your computer.</p>
            </div>
            
            <div class="action-buttons action-buttons-fixed">
                ${BackButton('btnBackToIntro')}
                ${PrimaryButton('Continue', 'btnContinueToUpload', { showArrow: true, large: true })}
            </div>
        </div>
    </section>`;
}

