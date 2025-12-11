/**
 * Welcome Slide Component
 */

import { icons } from '../components/icons.js';
import { PrimaryButton } from '../components/Button.js';

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
            ${PrimaryButton('Get Started', 'btnGetStarted', { showArrow: true, large: true })}
        </div>
    </section>`;
}

