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
            
            <div class="workflow-card">
                <!-- Source Section -->
                <div class="workflow-section workflow-source">
                    <span class="workflow-label">SOURCE</span>
                    <div class="workflow-row">
                        <div class="workflow-icon">
                            ${icons.folder}
                        </div>
                        <div class="workflow-info">
                            <div class="source-input-row">
                                <button type="button" class="source-name-box" id="btnChangeSource">
                                    <span class="source-name" id="folderName">Selected Folder</span>
                                </button>
                                <span class="change-label">Change</span>
                            </div>
                            <p class="workflow-path" id="folderPath">/path/to/folder</p>
                        </div>
                    </div>
                </div>
                
                <!-- Connector with File Count -->
                <div class="workflow-connector">
                    <div class="connector-line"></div>
                    <div class="connector-badge">
                        <span class="connector-arrow">${icons.arrowRight}</span>
                        <span class="connector-count" id="fileCount">0</span>
                        <span class="connector-label">files</span>
                    </div>
                    <div class="connector-line"></div>
                </div>
                
                <!-- Destination Section -->
                <div class="workflow-section workflow-destination">
                    <span class="workflow-label">DESTINATION</span>
                    <div class="workflow-row">
                        <div class="workflow-icon workflow-icon-new">
                            ${icons.folderPlus}
                        </div>
                        <div class="workflow-info">
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
                            <p class="workflow-path workflow-path-preview" id="outputFolderPath">/path/to/output</p>
                        </div>
                    </div>
                </div>
                
                <!-- Options Section (collapsible) -->
                <div class="workflow-options">
                    <button type="button" class="options-toggle" id="btnSettingsToggle" aria-expanded="false" aria-controls="settingsPanel">
                        <span class="options-toggle-left">
                            <span class="options-icon">${icons.settings}</span>
                            <span class="options-text">Extraction Options</span>
                        </span>
                        <span class="options-chevron">${icons.chevronDown}</span>
                    </button>
                    
                    <div class="options-panel" id="settingsPanel">
                        <div class="options-content">
                            <label class="toggle-option">
                                <input type="checkbox" id="pptxImagesToggle">
                                <span class="toggle-switch"></span>
                                <span class="toggle-label">Extract images from PowerPoint files</span>
                                <span class="info-icon" data-tooltip="Requires LibreOffice. Extracts embedded images from slides.">
                                    ${icons.info}
                                </span>
                            </label>
                            
                            <label class="toggle-option toggle-option-disabled">
                                <input type="checkbox" id="summaryFilesToggle" disabled>
                                <span class="toggle-switch"></span>
                                <span class="toggle-label">Add summary files</span>
                                <span class="coming-soon-badge">Coming soon</span>
                            </label>
                            
                            <label class="toggle-option toggle-option-disabled">
                                <input type="checkbox" id="extractImagesToggle" disabled>
                                <span class="toggle-switch"></span>
                                <span class="toggle-label">Extract embedded images</span>
                                <span class="coming-soon-badge">Coming soon</span>
                            </label>
                            
                            <label class="toggle-option toggle-option-disabled">
                                <input type="checkbox" id="preserveFormattingToggle" disabled>
                                <span class="toggle-switch"></span>
                                <span class="toggle-label">Preserve text formatting</span>
                                <span class="coming-soon-badge">Coming soon</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            
            <p class="safe-notice">Your original files will not be modified.</p>
            
            <div class="action-buttons">
                ${SecondaryButton('Back', 'btnBack', icons.arrowLeft)}
                ${PrimaryButton('Start Extraction', 'btnStart', { showArrow: true })}
            </div>
        </div>
    </section>`;
}
