export function PrivacyPolicy() {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <p className="text-muted-foreground text-sm">Last updated: December 12, 2025</p>

      <h3>1. Introduction</h3>
      <p>
        Welcome to docprep. This Privacy Policy explains how we handle information when you use our
        desktop application. Our commitment to your privacy is simple:{' '}
        <strong>we don't collect, store, or transmit any of your document data.</strong>
      </p>

      <h3>2. Information We Collect</h3>
      <p>
        <strong>Authentication only.</strong> When you sign in, we collect basic account information
        (email address) through Firebase Authentication to identify your account. We do not collect
        any document content, usage analytics, or telemetry.
      </p>

      <h3>3. How Your Data is Processed</h3>
      <p>
        All document processing happens entirely on your local device. When you use docprep to
        extract text from documents:
      </p>
      <ul>
        <li>Your files never leave your computer</li>
        <li>No document data is sent to any server</li>
        <li>No internet connection is required for document processing</li>
        <li>Extracted content is saved only to locations you specify on your device</li>
      </ul>

      <h3>4. Third-Party Services</h3>
      <p>
        docprep uses Firebase Authentication (by Google) solely for user sign-in. No other
        third-party services, analytics platforms, or external APIs are integrated.
      </p>

      <h3>5. Data Security</h3>
      <p>
        Since all document processing occurs locally and no document data is transmitted, your
        documents remain as secure as your own computer. We recommend following standard security
        practices for your device.
      </p>

      <h3>6. Children's Privacy</h3>
      <p>docprep does not knowingly collect information from children under 13 years of age.</p>

      <h3>7. Changes to This Policy</h3>
      <p>
        We may update this Privacy Policy from time to time. Any changes will be reflected on this
        page with an updated revision date.
      </p>

      <h3>8. Contact</h3>
      <p>If you have questions about this Privacy Policy, please contact us.</p>
    </div>
  );
}

export function TermsOfService() {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <p className="text-muted-foreground text-sm">Last updated: December 12, 2025</p>

      <h3>1. Acceptance of Terms</h3>
      <p>
        By downloading, installing, or using docprep ("the Software"), you agree to be bound by
        these Terms of Service. If you do not agree to these terms, do not use the Software.
      </p>

      <h3>2. License Grant</h3>
      <p>
        docprep is provided as free software. You are granted a non-exclusive, non-transferable
        license to use the Software for personal or commercial purposes, subject to these terms.
      </p>

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
      <p>
        The Software and all associated intellectual property rights remain the property of the
        developers. These Terms do not grant you any rights to trademarks, service marks, or logos.
      </p>

      <h3>6. Disclaimer of Warranties</h3>
      <p className="uppercase text-xs">
        THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
        BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
        NONINFRINGEMENT.
      </p>

      <h3>7. Limitation of Liability</h3>
      <p className="uppercase text-xs">
        IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER
        IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH
        THE SOFTWARE.
      </p>

      <h3>8. Your Documents</h3>
      <p>
        You retain all rights to your documents and any content you process using the Software. The
        Software does not claim any ownership or rights over your files or extracted content.
      </p>

      <h3>9. Updates</h3>
      <p>
        The Software may be updated from time to time. Updates may modify features or functionality.
        Continued use of the Software after updates constitutes acceptance of any changes.
      </p>

      <h3>10. Termination</h3>
      <p>
        These Terms are effective until terminated. Your rights under these Terms will terminate
        automatically if you fail to comply with any of its provisions.
      </p>

      <h3>11. Governing Law</h3>
      <p>
        These Terms shall be governed by and construed in accordance with the laws of the United
        States, without regard to its conflict of law provisions.
      </p>

      <h3>12. Changes to Terms</h3>
      <p>We reserve the right to modify these Terms at any time.</p>

      <h3>13. Contact</h3>
      <p>For questions about these Terms, please contact us.</p>
    </div>
  );
}





