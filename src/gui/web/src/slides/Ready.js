/**
 * Ready Slide Component
 * Shows folder info and extraction options before starting
 */

import { icons } from '../components/icons.js';
import { PrimaryButton, SecondaryButton } from '../components/Button.js';

export function Ready() {
    return `
    <section class="slide slide-ready" id="slide-ready">
        <div class="slide-content">
            <div class="ready-header">
                <div class="check-circle">
                    ${icons.check}
                </div>
                <h2>Ready to extract</h2>
            </div>
            
            <div class="folder-card">
                <div class="folder-icon">
                    ${icons.folder}
                </div>
                <div class="folder-info">
                    <p class="folder-name" id="folderName">Selected Folder</p>
                    <p class="folder-path" id="folderPath">/path/to/folder</p>
                </div>
            </div>
            
            <div class="file-preview" id="filePreview">
                <div class="preview-stat">
                    <span class="stat-number" id="fileCount">0</span>
                    <span class="stat-label">files found</span>
                </div>
            </div>
            
            <div class="options-section">
                <label class="toggle-option">
                    <input type="checkbox" id="pptxImagesToggle">
                    <span class="toggle-switch"></span>
                    <span class="toggle-label">Extract images from PowerPoint files</span>
                </label>
            </div>
            
            <div class="action-buttons">
                ${SecondaryButton('Back', 'btnBack', icons.arrowLeft)}
                ${PrimaryButton('Start Extraction', 'btnStart', { showArrow: true })}
            </div>
        </div>
    </section>`;
}

