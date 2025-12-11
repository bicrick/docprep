/**
 * Progress Slide Component
 * Shows extraction progress
 */

import { SkipButton, CancelButton } from '../components/Button.js';

export function Progress() {
    return `
    <section class="slide slide-progress" id="slide-progress">
        <div class="slide-content">
            <div class="progress-header">
                <div class="spinner"></div>
                <h2>Extracting documents</h2>
            </div>
            
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <div class="progress-stats">
                    <span class="progress-percent" id="progressPercent">0%</span>
                    <span class="progress-count" id="progressCount">0 / 0 files</span>
                </div>
            </div>
            
            <div class="current-file">
                <p class="current-file-label">Currently processing:</p>
                <p class="current-file-name" id="currentFileName">Waiting...</p>
            </div>
            
            <div class="action-buttons">
                ${SkipButton('btnSkip')}
                ${CancelButton('btnCancel')}
            </div>
        </div>
    </section>`;
}

