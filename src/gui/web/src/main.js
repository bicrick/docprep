/**
 * DocPrep - Main Entry Point
 * Imports styles and initializes the application
 */

// Import all styles
import './styles/index.css';

// Import components
import { Welcome, Intro, Tutorial, SignIn, Onboarding, DropZone, Ready, Progress, Complete } from './slides/index.js';
import { ThemeToggle } from './components/ThemeToggle.js';
import { UserAvatar } from './components/UserAvatar.js';
import { Footer } from './components/Footer.js';
import { UpdateNotice, initUpdateNotice } from './components/UpdateNotice.js';

// Import app logic
import { initApp } from './app.js';

/**
 * Render the application
 */
function renderApp() {
    const app = document.querySelector('.app');
    if (!app) return;

    // Render all slides
    app.innerHTML = `
        ${Welcome()}
        ${Intro()}
        ${Tutorial()}
        ${SignIn()}
        ${Onboarding()}
        ${DropZone()}
        ${Ready()}
        ${Progress()}
        ${Complete()}
        ${Footer()}
        ${ThemeToggle()}
        ${UserAvatar()}
        ${UpdateNotice()}
    `;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    renderApp();
    initApp();
    initUpdateNotice();
});

