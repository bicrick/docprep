/**
 * Centralized SVG Icons
 * All icons used throughout the application
 */

export const icons = {
    // Navigation arrows
    arrowRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>`,
    
    arrowLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>`,

    // File system
    folder: `<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z"/>
    </svg>`,

    folderPlus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        <line x1="12" y1="11" x2="12" y2="17"/>
        <line x1="9" y1="14" x2="15" y2="14"/>
    </svg>`,

    shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
    </svg>`,

    // Actions
    upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 8l-5-5-5 5M12 3v12"/>
    </svg>`,

    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 6L9 17l-5-5"/>
    </svg>`,

    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <path d="M22 4L12 14.01l-3-3"/>
    </svg>`,

    refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
    </svg>`,

    externalLink: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
        <polyline points="15 3 21 3 21 9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>`,

    lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>`,

    // Theme toggle
    sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>`,

    moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>`,

    // File type icons (for intro slide tree)
    excel: `<svg class="icon icon-excel" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" fill="#217346"/>
        <path d="M7 7l4 5-4 5M12 7h5M12 12h5M12 17h5" stroke="white" stroke-width="1.5" fill="none"/>
    </svg>`,

    word: `<svg class="icon icon-word" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" fill="#2b579a"/>
        <path d="M7 8l2 8 2-6 2 6 2-8" stroke="white" stroke-width="1.5" fill="none"/>
    </svg>`,

    pdf: `<svg class="icon icon-pdf" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" fill="#d63031"/>
        <text x="12" y="15" text-anchor="middle" fill="white" font-size="7" font-weight="bold">PDF</text>
    </svg>`,

    powerpoint: `<svg class="icon icon-pptx" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" fill="#d24726"/>
        <circle cx="10" cy="12" r="4" stroke="white" stroke-width="1.5" fill="none"/>
        <path d="M10 8v8M14 12h4" stroke="white" stroke-width="1.5"/>
    </svg>`,

    csv: `<svg class="icon icon-csv" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" fill="#217346"/>
        <path d="M7 8h10M7 12h10M7 16h10" stroke="white" stroke-width="1.5"/>
    </svg>`,

    txt: `<svg class="icon icon-txt" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" fill="#6b7280"/>
        <path d="M7 8h10M7 12h7M7 16h9" stroke="white" stroke-width="1.5"/>
    </svg>`,

    // IDE logos (for tutorial slide)
    cursor: `<svg fill="currentColor" fill-rule="evenodd" viewBox="0 0 24 24">
        <path d="M22.106 5.68L12.5.135a.998.998 0 00-.998 0L1.893 5.68a.84.84 0 00-.419.726v11.186c0 .3.16.577.42.727l9.607 5.547a.999.999 0 00.998 0l9.608-5.547a.84.84 0 00.42-.727V6.407a.84.84 0 00-.42-.726zm-.603 1.176L12.228 22.92c-.063.108-.228.064-.228-.061V12.34a.59.59 0 00-.295-.51l-9.11-5.26c-.107-.062-.063-.228.062-.228h18.55c.264 0 .428.286.296.514z"/>
    </svg>`,

    windsurf: `<svg fill="none" viewBox="0 0 512 512">
        <g clip-path="url(#prefix__clip0_5_17)">
            <g clip-path="url(#prefix__clip1_5_17)">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M507.307 106.752h-4.864a46.653 46.653 0 00-43.025 28.969 46.66 46.66 0 00-3.482 17.879v104.789c0 20.907-17.152 37.867-37.547 37.867a38.785 38.785 0 01-31.402-16.491l-106.07-152.832a46.865 46.865 0 00-38.613-20.266c-24.192 0-45.952 20.736-45.952 46.357v105.387c0 20.906-17.003 37.866-37.547 37.866-12.16 0-24.234-6.165-31.402-16.49L8.704 108.757C6.016 104.917 0 106.816 0 111.531v91.392c0 4.608 1.408 9.088 4.01 12.885l116.801 168.299c6.912 9.941 17.066 17.322 28.821 20.01 29.376 6.742 56.427-16.085 56.427-45.162V253.653c0-20.906 16.789-37.866 37.546-37.866h.043c12.501 0 24.213 6.144 31.403 16.49L381.12 385.088a45.872 45.872 0 0038.613 20.267c24.704 0 45.888-20.758 45.888-46.358V253.632c0-20.907 16.79-37.867 37.547-37.867h4.139c2.602 0 4.693-2.133 4.693-4.736v-99.562a4.7 4.7 0 00-1.366-3.34 4.705 4.705 0 00-3.327-1.396v.021z" fill="currentColor"/>
            </g>
        </g>
        <defs>
            <clipPath id="prefix__clip0_5_17"><path fill="currentColor" d="M0 0h512v512H0z"/></clipPath>
            <clipPath id="prefix__clip1_5_17"><path fill="currentColor" d="M0 0h512v512H0z"/></clipPath>
        </defs>
    </svg>`,

    antigravity: `<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="m19.94,20.59c1.09.82,2.73.27,1.23-1.23-4.5-4.36-3.55-16.36-9.14-16.36S7.39,15,2.89,19.36c-1.64,1.64.14,2.05,1.23,1.23,4.23-2.86,3.95-7.91,7.91-7.91s3.68,5.05,7.91,7.91Z"/>
    </svg>`,

    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>`,

    settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>`,

    chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"/>
    </svg>`,

    image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
    </svg>`,

    fileText: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
    </svg>`,

    edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>`
};

/**
 * Get file icon by extension
 * @param {string} ext - File extension (e.g., '.xlsx', '.pdf')
 * @returns {string} SVG icon string
 */
export function getFileIcon(ext) {
    const iconMap = {
        '.xlsx': icons.excel,
        '.xls': icons.excel,
        '.csv': icons.csv,
        '.pdf': icons.pdf,
        '.docx': icons.word,
        '.doc': icons.word,
        '.pptx': icons.powerpoint,
        '.ppt': icons.powerpoint,
        '.txt': icons.txt,
        'folder': icons.folder
    };
    return iconMap[ext] || icons.txt;
}

