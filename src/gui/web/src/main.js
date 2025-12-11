/**
 * DocPrep - Main Entry Point
 * Imports styles and initializes the application
 */

// Import all styles
import './styles/index.css';

// Import components
import { Welcome, Intro, Tutorial, DropZone, Ready, Progress, Complete } from './slides/index.js';
import { ThemeToggle } from './components/ThemeToggle.js';
import { Footer } from './components/Footer.js';

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
        ${DropZone()}
        ${Ready()}
        ${Progress()}
        ${Complete()}
        ${Footer()}
        ${ThemeToggle()}
    `;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    renderApp();
    initApp();
});

