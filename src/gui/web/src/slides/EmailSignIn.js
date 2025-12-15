/**
 * Email Sign In Slide Component
 * Dedicated page for email/password authentication
 */

import { icons } from '../components/icons.js';

export function EmailSignIn() {
    return `
    <section class="slide slide-signin" id="slide-email-signin">
        <div class="slide-content signin-content">
            <div class="signin-card">
                <div class="signin-header">
                    <h2 class="signin-title">Sign in with Email</h2>
                    <p class="signin-subtitle">Enter your credentials below</p>
                </div>
                
                <form class="signin-form" id="emailSigninForm">
                    <div class="form-group">
                        <label class="form-label" for="emailSigninEmail">Email</label>
                        <input type="email" id="emailSigninEmail" class="form-input" placeholder="user@example.com" autocomplete="email" required>
                    </div>
                    <div class="form-group">
                        <div class="form-label-row">
                            <label class="form-label" for="emailSigninPassword">Password</label>
                            <button type="button" class="forgot-password-link" id="emailForgotPasswordBtn">Forgot your password?</button>
                        </div>
                        <input type="password" id="emailSigninPassword" class="form-input" placeholder="Enter your password" autocomplete="current-password" required>
                    </div>
                    <div class="signin-error" id="emailSigninError"></div>
                    <button type="submit" class="btn btn-signin-primary" id="btnEmailSignIn">
                        <span class="btn-text">Login</span>
                        <span class="btn-spinner" style="display: none;">${icons.spinner || '<span class="spinner"></span>'}</span>
                    </button>
                </form>
                
                <p class="signin-signup-prompt">
                    Don't have an account? <a href="#" class="signup-link" id="btnGoToSignUpFromEmail">Sign up</a>
                </p>
            </div>
            
            <button type="button" class="btn-back-link" id="btnBackToSignIn">
                ${icons.arrowLeft}
                <span>Back</span>
            </button>
        </div>
    </section>`;
}




