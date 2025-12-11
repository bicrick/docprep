/**
 * Reusable Button Components
 */

import { icons } from './icons.js';

/**
 * Primary button with optional arrow icon
 * @param {string} text - Button text
 * @param {string} id - Button ID
 * @param {boolean} showArrow - Whether to show arrow icon
 * @param {boolean} large - Whether to use large size
 * @returns {string} Button HTML
 */
export function PrimaryButton(text, id, { showArrow = true, large = false } = {}) {
    const sizeClass = large ? 'btn-large' : '';
    const arrow = showArrow ? icons.arrowRight : '';
    return `<button class="btn btn-primary ${sizeClass}" id="${id}">
        ${text}
        ${arrow}
    </button>`;
}

/**
 * Secondary button with optional icon
 * @param {string} text - Button text
 * @param {string} id - Button ID
 * @param {string} icon - Optional icon (from icons object)
 * @returns {string} Button HTML
 */
export function SecondaryButton(text, id, icon = '') {
    return `<button class="btn btn-secondary" id="${id}">
        ${icon}
        ${text}
    </button>`;
}

/**
 * Back link button
 * @param {string} id - Button ID
 * @param {string} text - Button text (default: "Back")
 * @returns {string} Button HTML
 */
export function BackButton(id, text = 'Back') {
    return `<button class="btn-back-link" id="${id}">
        ${icons.arrowLeft}
        ${text}
    </button>`;
}

/**
 * Cancel button
 * @param {string} id - Button ID
 * @param {string} text - Button text
 * @returns {string} Button HTML
 */
export function CancelButton(id, text = 'Cancel') {
    return `<button class="btn btn-cancel" id="${id}">${text}</button>`;
}

/**
 * Skip button
 * @param {string} id - Button ID
 * @param {string} text - Button text
 * @returns {string} Button HTML
 */
export function SkipButton(id, text = 'Skip') {
    return `<button class="btn btn-skip" id="${id}">${text}</button>`;
}

