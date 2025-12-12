/**
 * Welcome Slide Component
 */

import { icons } from '../components/icons.js';

export function Welcome() {
    return `
    <section class="slide slide-welcome active" id="slide-welcome">
        <div class="slide-content">
            <div class="welcome-logo">
                <span class="logo-text">docprep</span>
            </div>
            <p class="welcome-description">
                Make your documents AI-ready. Extract clean text from complex file formats.
            </p>
            <div class="welcome-formats">
                <img src="./pdf-logo.svg" alt="PDF" class="format-logo">
                <img src="./excel-logo.svg" alt="Excel" class="format-logo">
                <img src="./word-logo.svg" alt="Word" class="format-logo">
                <img src="./powerpoint-logo.svg" alt="PowerPoint" class="format-logo">
            </div>
            <button class="btn btn-primary btn-large btn-auth-loading" id="btnGetStarted">
                <span class="btn-text">Get Started</span>
                <span class="btn-spinner">
                    <svg class="spinner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
                    </svg>
                </span>
                ${icons.arrowRight}
            </button>
        </div>
    </section>`;
}

