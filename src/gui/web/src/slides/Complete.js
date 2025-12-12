/**
 * Complete Slide Component
 * Shows extraction results with clickable stats for details
 */

import { icons } from '../components/icons.js';
import { SecondaryButton } from '../components/Button.js';

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
                    <button class="btn btn-primary" id="btnOpenFolder">
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
