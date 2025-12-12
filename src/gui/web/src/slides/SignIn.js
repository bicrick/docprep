/**
 * Sign In Slide Component
 * Firebase authentication with Google and Email options
 * Styled to match shadcn aesthetic
 */

import { icons } from '../components/icons.js';

export function SignIn() {
    return `
    <section class="slide slide-signin" id="slide-signin">
        <div class="slide-content signin-content">
            <div class="signin-card">
                <div class="signin-header">
                    <h2 class="signin-title">Sign in to continue</h2>
                    <p class="signin-subtitle">Enter your email below to sign in to your account</p>
                </div>
                
                <form class="signin-form" id="signinForm">
                    <div class="form-group">
                        <label class="form-label" for="signinEmail">Email</label>
                        <input 
                            type="email" 
                            id="signinEmail" 
                            class="form-input" 
                            placeholder="name@example.com"
                            autocomplete="email"
                            required
                        >
                    </div>
                    
                    <div class="form-group" id="passwordGroup" style="display: none;">
                        <label class="form-label" for="signinPassword">Password</label>
                        <input 
                            type="password" 
                            id="signinPassword" 
                            class="form-input" 
                            placeholder="Enter your password"
                            autocomplete="current-password"
                        >
                        <button type="button" class="forgot-password-link" id="forgotPasswordBtn">
                            Forgot password?
                        </button>
                    </div>
                    
                    <div class="signin-error" id="signinError"></div>
                    <div class="signin-status" id="signinStatus">
                        <svg class="status-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
                        </svg>
                        <span class="status-text"></span>
                    </div>
                    
                    <button type="submit" class="btn btn-signin-primary" id="btnSignInEmail">
                        <span class="btn-text">Continue with Email</span>
                        <span class="btn-spinner" style="display: none;">
                            ${icons.spinner || '<span class="spinner"></span>'}
                        </span>
                    </button>
                </form>
                
                <div class="signin-divider">
                    <span class="divider-line"></span>
                    <span class="divider-text">Or continue with</span>
                    <span class="divider-line"></span>
                </div>
                
                <button type="button" class="btn btn-signin-google" id="btnSignInGoogle">
                    <svg class="google-icon" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Google</span>
                </button>
                
                <p class="signin-terms">
                    By clicking continue, you agree to our
                    <a href="#" class="terms-link" id="openTermsModal">Terms of Service</a>
                    and
                    <a href="#" class="terms-link" id="openPrivacyModal">Privacy Policy</a>.
                </p>
            </div>
            
            <button type="button" class="btn-back-link" id="btnBackToTutorial">
                ${icons.arrowLeft}
                <span>Back</span>
            </button>
        </div>
        
        <!-- Privacy Policy Modal -->
        <div class="modal-overlay" id="privacy-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <button class="modal-close" aria-label="Close">&times;</button>
                    <h2 class="modal-title">Privacy Policy</h2>
                </div>
                <div class="modal-body">
                    <p class="modal-date">Last updated: December 12, 2025</p>
                    
                    <h3>1. Introduction</h3>
                    <p>Welcome to docprep. This Privacy Policy explains how we handle information when you use our desktop application. Our commitment to your privacy is simple: <strong>we don't collect, store, or transmit any of your document data.</strong></p>
                    
                    <h3>2. Information We Collect</h3>
                    <p><strong>Authentication only.</strong> When you sign in, we collect basic account information (email address) through Firebase Authentication to identify your account. We do not collect any document content, usage analytics, or telemetry.</p>
                    
                    <h3>3. How Your Data is Processed</h3>
                    <p>All document processing happens entirely on your local device. When you use docprep to extract text from documents:</p>
                    <ul>
                        <li>Your files never leave your computer</li>
                        <li>No document data is sent to any server</li>
                        <li>No internet connection is required for document processing</li>
                        <li>Extracted content is saved only to locations you specify on your device</li>
                    </ul>
                    
                    <h3>4. Third-Party Services</h3>
                    <p>docprep uses Firebase Authentication (by Google) solely for user sign-in. No other third-party services, analytics platforms, or external APIs are integrated.</p>
                    
                    <h3>5. Data Security</h3>
                    <p>Since all document processing occurs locally and no document data is transmitted, your documents remain as secure as your own computer. We recommend following standard security practices for your device.</p>
                    
                    <h3>6. Children's Privacy</h3>
                    <p>docprep does not knowingly collect information from children under 13 years of age.</p>
                    
                    <h3>7. Changes to This Policy</h3>
                    <p>We may update this Privacy Policy from time to time. Any changes will be reflected on this page with an updated revision date.</p>
                    
                    <h3>8. Contact</h3>
                    <p>If you have questions about this Privacy Policy, please contact us.</p>
                </div>
            </div>
        </div>
        
        <!-- Terms of Service Modal -->
        <div class="modal-overlay" id="terms-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <button class="modal-close" aria-label="Close">&times;</button>
                    <h2 class="modal-title">Terms of Service</h2>
                </div>
                <div class="modal-body">
                    <p class="modal-date">Last updated: December 12, 2025</p>
                    
                    <h3>1. Acceptance of Terms</h3>
                    <p>By downloading, installing, or using docprep ("the Software"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Software.</p>
                    
                    <h3>2. License Grant</h3>
                    <p>docprep is provided as free software. You are granted a non-exclusive, non-transferable license to use the Software for personal or commercial purposes, subject to these terms.</p>
                    
                    <h3>3. Permitted Uses</h3>
                    <p>You may:</p>
                    <ul>
                        <li>Use the Software to extract text from documents for any lawful purpose</li>
                        <li>Install the Software on multiple devices you own or control</li>
                        <li>Use extracted content in AI-integrated editors and other applications</li>
                    </ul>
                    
                    <h3>4. Restrictions</h3>
                    <p>You may not:</p>
                    <ul>
                        <li>Reverse engineer, decompile, or disassemble the Software</li>
                        <li>Modify, adapt, or create derivative works based on the Software</li>
                        <li>Redistribute, sell, lease, or sublicense the Software</li>
                        <li>Remove or alter any proprietary notices or labels on the Software</li>
                        <li>Use the Software for any unlawful purpose</li>
                    </ul>
                    
                    <h3>5. Intellectual Property</h3>
                    <p>The Software and all associated intellectual property rights remain the property of the developers. These Terms do not grant you any rights to trademarks, service marks, or logos.</p>
                    
                    <h3>6. Disclaimer of Warranties</h3>
                    <p>THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. THE ENTIRE RISK AS TO THE QUALITY AND PERFORMANCE OF THE SOFTWARE IS WITH YOU.</p>
                    
                    <h3>7. Limitation of Liability</h3>
                    <p>IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.</p>
                    
                    <h3>8. Your Documents</h3>
                    <p>You retain all rights to your documents and any content you process using the Software. The Software does not claim any ownership or rights over your files or extracted content.</p>
                    
                    <h3>9. Updates</h3>
                    <p>The Software may be updated from time to time. Updates may modify features or functionality. Continued use of the Software after updates constitutes acceptance of any changes.</p>
                    
                    <h3>10. Termination</h3>
                    <p>These Terms are effective until terminated. Your rights under these Terms will terminate automatically if you fail to comply with any of its provisions. Upon termination, you must cease all use of the Software and destroy all copies.</p>
                    
                    <h3>11. Governing Law</h3>
                    <p>These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.</p>
                    
                    <h3>12. Changes to Terms</h3>
                    <p>We reserve the right to modify these Terms at any time. Changes will be effective immediately upon update.</p>
                    
                    <h3>13. Contact</h3>
                    <p>For questions about these Terms, please contact us.</p>
                </div>
            </div>
        </div>
    </section>`;
}

// Add spinner icon to icons if not present
if (!icons.spinner) {
    icons.spinner = `<svg class="spinner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
    </svg>`;
}

