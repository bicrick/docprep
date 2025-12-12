/**
 * Complete Slide Component
 * Shows extraction results with clickable stats for details
 */

import { icons } from '../components/icons.js';
import { SecondaryButton } from '../components/Button.js';

/**
 * Editor dropdown button for opening output in code editors
 */
function EditorDropdownButton() {
    return `
    <div class="editor-dropdown" id="editorDropdown">
        <button class="btn btn-primary editor-dropdown-btn" id="btnOpenInEditor">
            <span class="editor-btn-text">Open in Editor</span>
            <span class="editor-dropdown-divider"></span>
            <span class="editor-dropdown-chevron">${icons.chevronDown}</span>
        </button>
        <div class="editor-dropdown-menu" id="editorDropdownMenu">
            <button class="editor-option" data-editor="cursor">
                <span class="editor-option-icon">${icons.cursor}</span>
                <span class="editor-option-name">Cursor</span>
                <span class="editor-option-check">${icons.check}</span>
            </button>
            <button class="editor-option" data-editor="windsurf">
                <span class="editor-option-icon">${icons.windsurf}</span>
                <span class="editor-option-name">Windsurf</span>
                <span class="editor-option-check">${icons.check}</span>
            </button>
            <button class="editor-option" data-editor="antigravity">
                <span class="editor-option-icon">${icons.antigravity}</span>
                <span class="editor-option-name">Antigravity</span>
                <span class="editor-option-check">${icons.check}</span>
            </button>
        </div>
    </div>`;
}

export function Complete() {
    return `
    <section class="slide slide-complete" id="slide-complete">
        <div class="slide-content complete-content">
            <!-- Summary View (default) -->
            <div class="complete-summary" id="completeSummary">
                <div class="complete-header">
                    <h2>Extraction Complete</h2>
                    <p class="complete-subtitle">Your documents have been processed</p>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card stat-card-primary" id="statProcessedCard">
                        <span class="stat-card-label">Files Processed</span>
                        <span class="stat-card-value" id="statProcessedValue">0</span>
                    </div>
                    <div class="stat-card stat-card-secondary" id="statExtractedCard">
                        <span class="stat-card-label">Files Extracted</span>
                        <span class="stat-card-value" id="statExtractedValue">0</span>
                    </div>
                    <div class="stat-card stat-card-clickable stat-card-success" id="statSucceededCard" style="display: none;">
                        <span class="stat-card-label">Succeeded</span>
                        <span class="stat-card-value" id="statSucceededValue">0</span>
                    </div>
                    <div class="stat-card stat-card-clickable stat-card-warning" id="statWarningsCard" style="display: none;">
                        <span class="stat-card-label">Warnings</span>
                        <span class="stat-card-value" id="statWarningsValue">0</span>
                    </div>
                    <div class="stat-card stat-card-clickable stat-card-error" id="statFailedCard" style="display: none;">
                        <span class="stat-card-label">Failed</span>
                        <span class="stat-card-value" id="statFailedValue">0</span>
                    </div>
                </div>
                
                <div class="action-buttons">
                    ${SecondaryButton('New Extraction', 'btnNewExtraction', icons.refresh)}
                    ${EditorDropdownButton()}
                    <button class="btn btn-secondary" id="btnOpenFolder">
                        Open Output Folder
                        ${icons.externalLink}
                    </button>
                </div>
            </div>
            
            <!-- Detail View (hidden by default) -->
            <div class="complete-detail" id="completeDetail" style="display: none;">
                <div class="detail-header">
                    <button class="back-button" id="btnBackToSummary">
                        ${icons.arrowLeft}
                        <span>Back</span>
                    </button>
                    <h3 class="detail-title" id="detailTitle">Files</h3>
                </div>
                
                <div class="results-content">
                    <div class="results-list" id="resultsList">
                        <!-- Populated by JS -->
                    </div>
                </div>
                
                <div class="action-buttons">
                    <button class="btn btn-secondary" id="btnBackToSummary2">
                        Back to Summary
                    </button>
                </div>
            </div>
        </div>
    </section>`;
}
