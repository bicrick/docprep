/**
 * Complete Slide Component
 * Shows extraction results
 */

import { icons } from '../components/icons.js';
import { SecondaryButton, PrimaryButton } from '../components/Button.js';

export function Complete() {
    return `
    <section class="slide slide-complete" id="slide-complete">
        <div class="slide-content">
            <div class="complete-header">
                <div class="success-icon">
                    ${icons.success}
                </div>
                <h2>Extraction Complete</h2>
                <p class="complete-subtitle">Your documents have been processed successfully</p>
            </div>
            
            <div class="results-list">
                <div class="result-row result-row-primary">
                    <div class="result-row-content">
                        <span class="result-label">Files Processed</span>
                        <span class="result-number" id="resultProcessed">0</span>
                    </div>
                </div>
                <div class="result-row result-row-secondary">
                    <div class="result-row-content">
                        <span class="result-label">Files Extracted</span>
                        <span class="result-number" id="resultExtracted">0</span>
                    </div>
                </div>
                <div class="result-row result-row-warning" id="resultWarningsCard" style="display: none;">
                    <div class="result-row-content">
                        <span class="result-label">Warnings</span>
                        <span class="result-number" id="resultWarnings">0</span>
                    </div>
                </div>
                <div class="result-row result-row-error" id="resultErrorsCard" style="display: none;">
                    <div class="result-row-content">
                        <span class="result-label">Errors</span>
                        <span class="result-number" id="resultErrors">0</span>
                    </div>
                </div>
            </div>
            
            <div class="action-buttons">
                ${SecondaryButton('New Extraction', 'btnNewExtraction', icons.refresh)}
                <button class="btn btn-primary" id="btnOpenFolder">
                    Open Output Folder
                    ${icons.externalLink}
                </button>
            </div>
        </div>
    </section>`;
}

