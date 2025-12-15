/**
 * User Avatar Component
 * Shows user photo/initials with sign out dropdown
 */

export function UserAvatar() {
    return `
    <div class="user-avatar-container" id="userAvatarContainer">
        <button class="user-avatar-btn" id="userAvatarBtn" aria-label="User menu">
            <span class="user-avatar-photo" id="userAvatarPhoto"></span>
            <span class="user-avatar-initial" id="userAvatarInitial"></span>
        </button>
        <div class="user-dropdown" id="userDropdown">
            <div class="user-dropdown-info" id="userDropdownInfo">
                <span class="user-dropdown-name" id="userDropdownName"></span>
                <span class="user-dropdown-email" id="userDropdownEmail"></span>
            </div>
            <div class="user-dropdown-divider"></div>
            <button class="user-dropdown-signout" id="btnSignOut">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span>Sign out</span>
            </button>
        </div>
    </div>`;
}



