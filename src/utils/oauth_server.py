"""
Local OAuth Callback Server
Handles OAuth redirect for desktop app Google sign-in
"""

import http.server
import socketserver
import threading
import webbrowser
import urllib.parse
import logging
import json
from typing import Optional, Callable

logger = logging.getLogger(__name__)


class OAuthCallbackHandler(http.server.BaseHTTPRequestHandler):
    """Handle OAuth callback from Google"""
    
    # Class-level storage for the auth code
    auth_code: Optional[str] = None
    error: Optional[str] = None
    callback_received = threading.Event()
    
    def log_message(self, format, *args):
        """Suppress default logging"""
        pass
    
    def do_GET(self):
        """Handle GET request (OAuth callback)"""
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        
        if 'code' in params:
            OAuthCallbackHandler.auth_code = params['code'][0]
            OAuthCallbackHandler.error = None
            self._send_success_page()
        elif 'error' in params:
            OAuthCallbackHandler.error = params.get('error_description', params['error'])[0]
            OAuthCallbackHandler.auth_code = None
            self._send_error_page(OAuthCallbackHandler.error)
        else:
            self._send_error_page("No authorization code received")
        
        OAuthCallbackHandler.callback_received.set()
    
    def _send_success_page(self):
        """Send success HTML page"""
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sign In Successful</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #1e3a5a 0%, #2d4a6a 100%);
                    color: white;
                }
                .container {
                    text-align: center;
                    padding: 40px;
                }
                .checkmark {
                    width: 80px;
                    height: 80px;
                    margin-bottom: 20px;
                }
                h1 { font-size: 24px; margin-bottom: 10px; }
                p { opacity: 0.8; }
            </style>
        </head>
        <body>
            <div class="container">
                <svg class="checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9 12l2 2 4-4"/>
                </svg>
                <h1>Sign In Successful</h1>
                <p>You can close this window and return to docprep.</p>
            </div>
        </body>
        </html>
        """
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(html.encode())
    
    def _send_error_page(self, error: str):
        """Send error HTML page"""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sign In Failed</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #5a1e1e 0%, #6a2d2d 100%);
                    color: white;
                }}
                .container {{
                    text-align: center;
                    padding: 40px;
                }}
                h1 {{ font-size: 24px; margin-bottom: 10px; }}
                p {{ opacity: 0.8; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Sign In Failed</h1>
                <p>{error}</p>
                <p>Please close this window and try again.</p>
            </div>
        </body>
        </html>
        """
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(html.encode())


class ReusableTCPServer(socketserver.TCPServer):
    """TCPServer with SO_REUSEADDR enabled"""
    allow_reuse_address = True
    
    def server_close(self):
        """Override to ensure socket is fully closed"""
        try:
            self.socket.close()
        except Exception:
            pass


class OAuthServer:
    """
    Local OAuth server for handling Google sign-in in desktop apps
    """
    
    def __init__(self, port: int = 8547):
        self.port = port
        self.server: Optional[ReusableTCPServer] = None
        self.server_thread: Optional[threading.Thread] = None
    
    @property
    def redirect_uri(self) -> str:
        return f"http://127.0.0.1:{self.port}/callback"
    
    def start(self):
        """Start the local server"""
        # Reset state
        OAuthCallbackHandler.auth_code = None
        OAuthCallbackHandler.error = None
        OAuthCallbackHandler.callback_received.clear()
        
        # Close any existing server first
        self.stop()
        
        try:
            self.server = ReusableTCPServer(("127.0.0.1", self.port), OAuthCallbackHandler)
            self.server_thread = threading.Thread(target=self._handle_single_request, daemon=True)
            self.server_thread.start()
            logger.info(f"OAuth callback server started on port {self.port}")
        except OSError as e:
            logger.error(f"Failed to start OAuth server: {e}")
            raise
    
    def _handle_single_request(self):
        """Handle a single request then close the server"""
        try:
            self.server.handle_request()
        finally:
            # Close server immediately after handling the request
            try:
                if self.server:
                    self.server.server_close()
            except Exception:
                pass
    
    def wait_for_callback(self, timeout: float = 300) -> tuple[Optional[str], Optional[str]]:
        """
        Wait for the OAuth callback
        
        Args:
            timeout: Maximum seconds to wait (default 5 minutes)
            
        Returns:
            Tuple of (auth_code, error)
        """
        OAuthCallbackHandler.callback_received.wait(timeout=timeout)
        return OAuthCallbackHandler.auth_code, OAuthCallbackHandler.error
    
    def stop(self):
        """Stop the server"""
        if self.server:
            try:
                self.server.server_close()
            except Exception as e:
                logger.warning(f"Error stopping OAuth server: {e}")
            finally:
                self.server = None
                self.server_thread = None


def start_google_oauth(
    client_id: str,
    redirect_uri: str,
    scopes: list[str] = None
) -> str:
    """
    Generate Google OAuth URL and open in browser
    
    Args:
        client_id: Google OAuth client ID
        redirect_uri: Callback URL (should be http://localhost:PORT/callback)
        scopes: OAuth scopes (defaults to email and profile)
        
    Returns:
        The OAuth URL that was opened
    """
    if scopes is None:
        scopes = ["email", "profile", "openid"]
    
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(scopes),
        "access_type": "offline",
        "prompt": "consent"
    }
    
    oauth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)
    
    # Open in default browser
    webbrowser.open(oauth_url)
    
    return oauth_url



