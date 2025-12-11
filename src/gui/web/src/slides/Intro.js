/**
 * Introduction Slide Component
 * Shows the file tree comparison (before/after extraction)
 */

import { icons } from '../components/icons.js';
import { PrimaryButton, BackButton } from '../components/Button.js';

function FileRow(name, iconType, indent = 0, isFolder = false) {
    const indentClass = indent > 0 ? `indent-${indent}` : '';
    const rowClass = isFolder ? 'folder' : 'file';
    
    let icon;
    if (isFolder) {
        icon = `<svg class="icon icon-folder" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z"/></svg>`;
    } else {
        const iconMap = {
            excel: `<svg class="icon icon-excel" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="#217346"/><path d="M7 7l4 5-4 5M12 7h5M12 12h5M12 17h5" stroke="white" stroke-width="1.5" fill="none"/></svg>`,
            word: `<svg class="icon icon-word" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="#2b579a"/><path d="M7 8l2 8 2-6 2 6 2-8" stroke="white" stroke-width="1.5" fill="none"/></svg>`,
            pdf: `<svg class="icon icon-pdf" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="#d63031"/><text x="12" y="15" text-anchor="middle" fill="white" font-size="7" font-weight="bold">PDF</text></svg>`,
            pptx: `<svg class="icon icon-pptx" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="#d24726"/><circle cx="10" cy="12" r="4" stroke="white" stroke-width="1.5" fill="none"/><path d="M10 8v8M14 12h4" stroke="white" stroke-width="1.5"/></svg>`,
            csv: `<svg class="icon icon-csv" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="#217346"/><path d="M7 8h10M7 12h10M7 16h10" stroke="white" stroke-width="1.5"/></svg>`,
            txt: `<svg class="icon icon-txt" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="#6b7280"/><path d="M7 8h10M7 12h7M7 16h9" stroke="white" stroke-width="1.5"/></svg>`
        };
        icon = iconMap[iconType] || iconMap.txt;
    }
    
    return `<div class="finder-row ${rowClass} ${indentClass}">${icon}<span>${name}</span></div>`;
}

export function Intro() {
    return `
    <section class="slide slide-intro" id="slide-intro">
        <div class="slide-content intro-content">
            <h2 class="intro-title">How it works</h2>
            <p class="intro-subtitle">DocPrep extracts clean, structured data from your documents</p>
            
            <div class="tree-comparison">
                <!-- Before Tree -->
                <div class="tree-panel tree-before">
                    <div class="tree-label">Your Files</div>
                    <div class="finder-list">
                        ${FileRow('Project Files', null, 0, true)}
                        ${FileRow('Financials', null, 1, true)}
                        ${FileRow('Q1_Report.xlsx', 'excel', 2)}
                        ${FileRow('Q2_Report.xlsx', 'excel', 2)}
                        ${FileRow('Budget_2024.xls', 'excel', 2)}
                        ${FileRow('Contracts', null, 1, true)}
                        ${FileRow('NDA_v1.docx', 'word', 2)}
                        ${FileRow('Agreement_FINAL.docx', 'word', 2)}
                        ${FileRow('Terms.pdf', 'pdf', 2)}
                        ${FileRow('Presentations', null, 1, true)}
                        ${FileRow('Sales_Deck.pptx', 'pptx', 2)}
                    </div>
                </div>
                
                <!-- Arrow -->
                <div class="tree-arrow">
                    ${icons.arrowRight}
                </div>
                
                <!-- After Tree -->
                <div class="tree-panel tree-after">
                    <div class="tree-label">Extracted Output</div>
                    <div class="finder-list">
                        ${FileRow('Project Files_extracted', null, 0, true)}
                        ${FileRow('Financials', null, 1, true)}
                        ${FileRow('q1_report', null, 2, true)}
                        ${FileRow('sheet1.csv', 'csv', 3)}
                        ${FileRow('q2_report', null, 2, true)}
                        ${FileRow('sheet1.csv', 'csv', 3)}
                        ${FileRow('budget_2024', null, 2, true)}
                        ${FileRow('sheet1.csv', 'csv', 3)}
                        ${FileRow('Contracts', null, 1, true)}
                        ${FileRow('nda_v1.txt', 'txt', 2)}
                        ${FileRow('agreement_final.txt', 'txt', 2)}
                        ${FileRow('terms.txt', 'txt', 2)}
                        ${FileRow('Presentations', null, 1, true)}
                        ${FileRow('sales_deck.txt', 'txt', 2)}
                    </div>
                </div>
            </div>
            
            <div class="action-buttons">
                ${BackButton('btnBackToWelcomeFromIntro')}
                ${PrimaryButton('Continue', 'btnContinue', { showArrow: true, large: true })}
            </div>
        </div>
    </section>`;
}

