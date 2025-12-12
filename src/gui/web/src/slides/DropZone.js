/**
 * Drop Zone Slide Component
 * Allows users to select or drop a folder
 */

import { icons } from '../components/icons.js';
import { BackButton } from '../components/Button.js';

export function DropZone() {
    return `
    <section class="slide slide-drop" id="slide-drop">
        <div class="slide-content">
            <h2 class="slide-title">Select a folder</h2>
            <p class="slide-subtitle">Choose the folder containing your documents</p>
            
            <div class="drop-zone" id="dropZone">
                <div class="drop-zone-inner">
                    <div class="drop-icon">
                        ${icons.upload}
                    </div>
                    <h3 class="drop-title">Drop your folder here</h3>
                    <p class="drop-subtitle">or click to browse</p>
                </div>
            </div>
            
            <div class="action-buttons action-buttons-fixed">
                ${BackButton('btnBackToWelcome')}
            </div>
        </div>
    </section>`;
}

