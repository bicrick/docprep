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
                <h2>Ready to extract</h2>
            </div>
            
            <div class="folder-cards-container">
                <div class="folder-card folder-card-source">
                    <div class="folder-card-label">Source</div>
                    <div class="folder-card-content">
                        <div class="folder-icon">
                            ${icons.folder}
                        </div>
                        <div class="folder-info">
                            <p class="folder-name" id="folderName">Selected Folder</p>
                            <p class="folder-path" id="folderPath">/path/to/folder</p>
                        </div>
                    </div>
                </div>
                
                <div class="folder-arrow-down">
                    ${icons.arrowRight}
                </div>
                
                <div class="folder-card folder-card-destination">
                    <div class="folder-card-label">Destination</div>
                    <div class="folder-card-content">
                        <div class="folder-icon folder-icon-new">
                            ${icons.folderPlus}
                        </div>
                        <div class="folder-info">
                            <div class="output-input-row">
                                <input 
                                    type="text" 
                                    id="outputFolderName" 
                                    class="output-name-input"
                                    placeholder="extracted_files"
                                    spellcheck="false"
                                    autocomplete="off"
                                >
                                <button type="button" class="browse-btn" id="btnBrowseOutput">Browse</button>
                            </div>
                            <span class="output-name-error" id="outputNameError"></span>
                            <p class="folder-path folder-path-preview" id="outputFolderPath">/path/to/output</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="safe-notice">
                <span class="safe-notice-text">Your original files will not be modified. Extracted content goes to a new folder.</span>
            </div>
            
            <div class="file-preview" id="filePreview">
                <div class="preview-stat">
                    <span class="stat-number" id="fileCount">0</span>
                    <span class="stat-label">files found</span>
                </div>
            </div>
            
            <div class="options-section" id="pptxOptionsSection">
                <label class="toggle-option">
                    <input type="checkbox" id="pptxImagesToggle">
                    <span class="toggle-switch"></span>
                    <span class="toggle-label">Extract images from PowerPoint files</span>
                    <span class="info-icon" data-tooltip="We have detected LibreOffice installed on your computer. Use this to get more in-depth extractions for slides.">
                        ${icons.info}
                    </span>
                </label>
            </div>
            
            <div class="action-buttons">
                ${SecondaryButton('Back', 'btnBack', icons.arrowLeft)}
                ${PrimaryButton('Start Extraction', 'btnStart', { showArrow: true })}
            </div>
        </div>
    </section>`;
}

