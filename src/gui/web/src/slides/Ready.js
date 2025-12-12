/**
 * Ready Slide Component
 * Shows folder info and extraction options before starting
 */

import { icons } from '../components/icons.js';
import { PrimaryButton, SecondaryButton } from '../components/Button.js';

export function Ready() {
    return `
    <section class="slide slide-ready" id="slide-ready">
        <div class="slide-content slide-content-wide">
            <div class="ready-header">
                <h2>Ready to extract</h2>
                <p class="ready-subtitle"><span id="fileCount">0</span> files will be processed</p>
            </div>
            
            <div class="workflow-card">
                <div class="workflow-row">
                    <!-- Source -->
                    <div class="workflow-col">
                        <span class="workflow-label">From</span>
                        <button type="button" class="folder-box" id="btnChangeSource">
                            <span class="folder-box-icon">${icons.folder}</span>
                            <span class="folder-box-name" id="folderName">Selected Folder</span>
                            <span class="folder-box-edit">${icons.edit}</span>
                        </button>
                        <p class="folder-box-path" id="folderPath">/path/to/folder</p>
                    </div>
                    
                    <!-- Arrow -->
                    <div class="workflow-arrow">
                        ${icons.arrowRight}
                    </div>
                    
                    <!-- Destination -->
                    <div class="workflow-col">
                        <span class="workflow-label">To</span>
                        <div class="folder-box folder-box-editable">
                            <span class="folder-box-icon folder-box-icon-new">${icons.folderPlus}</span>
                            <input 
                                type="text" 
                                id="outputFolderName" 
                                class="folder-box-input"
                                placeholder="extracted_files"
                                spellcheck="false"
                                autocomplete="off"
                            >
                            <button type="button" class="folder-box-edit-btn" id="btnBrowseOutput">${icons.edit}</button>
                        </div>
                        <p class="folder-box-path" id="outputFolderPath">/path/to/output</p>
                        <span class="output-name-error" id="outputNameError"></span>
                    </div>
                </div>
                
                <!-- Options Section (collapsible) -->
                <div class="workflow-options">
                    <button type="button" class="options-toggle" id="btnSettingsToggle" aria-expanded="false" aria-controls="settingsPanel">
                        <span class="options-toggle-left">
                            <span class="options-icon">${icons.settings}</span>
                            <span class="options-text">Options</span>
                        </span>
                        <span class="options-chevron">${icons.chevronDown}</span>
                    </button>
                    
                    <div class="options-panel" id="settingsPanel">
                        <div class="options-content">
                            <label class="toggle-option">
                                <input type="checkbox" id="pptxImagesToggle">
                                <span class="toggle-switch"></span>
                                <span class="toggle-label">Extract PowerPoint images</span>
                            </label>
                            
                            <label class="toggle-option toggle-option-disabled">
                                <input type="checkbox" id="summaryFilesToggle" disabled>
                                <span class="toggle-switch"></span>
                                <span class="toggle-label">Add summary files</span>
                                <span class="coming-soon-badge">Soon</span>
                            </label>
                            
                            <label class="toggle-option toggle-option-disabled">
                                <input type="checkbox" id="extractImagesToggle" disabled>
                                <span class="toggle-switch"></span>
                                <span class="toggle-label">Extract all images</span>
                                <span class="coming-soon-badge">Soon</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            
            <p class="safe-notice">Your original files will not be modified.</p>
            
            <div class="action-buttons action-buttons-fixed">
                ${SecondaryButton('Back', 'btnBack', icons.arrowLeft)}
                ${PrimaryButton('Extract', 'btnStart', { showArrow: true })}
            </div>
        </div>
    </section>`;
}
