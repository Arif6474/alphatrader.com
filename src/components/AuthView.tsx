import React, { useState, useEffect } from 'react';

interface AuthViewProps {
  onAuthSuccess: (user: any) => void;
}

export default function AuthView({ onAuthSuccess }: AuthViewProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Google Sign-In config check and simulation
  const [hasGoogleClientId, setHasGoogleClientId] = useState(false);
  const [showDemoGoogleModal, setShowDemoGoogleModal] = useState(false);

  useEffect(() => {
    // Check if Google Client ID is configured via public env or ask API
    // For local dev experience, we can check if it's set in client-side env
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (clientId) {
      setHasGoogleClientId(true);
      // Wait for Google script to load and initialize
      const interval = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          clearInterval(interval);
          initializeGoogleSignIn(clientId);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  const initializeGoogleSignIn = (clientId: string) => {
    try {
      const google = (window as any).google;
      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredentialResponse,
        cancel_on_tap_outside: false
      });
      google.accounts.id.renderButton(
        document.getElementById('google-btn-container'),
        { 
          theme: 'filled_dark', 
          size: 'large', 
          width: 320, 
          shape: 'pill',
          text: 'signin_with'
        }
      );
    } catch (err) {
      console.error('Failed to initialize Google Sign-In:', err);
    }
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onAuthSuccess(data.user);
      } else {
        setError(data.error || 'Google login failed.');
      }
    } catch (err) {
      setError('Connection error. Server offline.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Credentials Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = mode === 'signin' ? '/api/auth/signin' : '/api/auth/signup';
      const payload = mode === 'signin' ? { email, password } : { name, email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        if (mode === 'signup') {
          // Auto log in after sign up
          const loginRes = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const loginData = await loginRes.json();
          if (loginRes.ok && loginData.success) {
            onAuthSuccess(loginData.user);
          } else {
            setMode('signin');
            setError('Account created! Please sign in.');
          }
        } else {
          onAuthSuccess(data.user);
        }
      } else {
        setError(data.error || 'Authentication failed.');
      }
    } catch (err) {
      setError('Connection error. Server offline.');
    } finally {
      setLoading(false);
    }
  };

  // Simulate Google Login for local test
  const handleSimulateGoogleLogin = async (username: string) => {
    setLoading(true);
    setShowDemoGoogleModal(false);
    setError('');
    try {
      const mockToken = `mock_token_${username}`;
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: mockToken })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onAuthSuccess(data.user);
      } else {
        setError(data.error || 'Simulated login failed.');
      }
    } catch (err) {
      setError('Simulated login error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-bg-glows">
        <div className="glow glow-1"></div>
        <div className="glow glow-2"></div>
      </div>

      <div className="glass-panel auth-card">
        {/* Header / Logo */}
        <div className="auth-header">
          <svg className="auth-logo-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="32" y1="8" x2="32" y2="56" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
            <rect x="24" y="20" width="16" height="24" rx="3" fill="#10b981" />
            <path d="M12 48 L28 36 L44 42 L56 22" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h1 className="auth-logo-text">AlphaTrader</h1>
          <p className="auth-subtitle">
            {mode === 'signin' ? 'Welcome back. Access your trading journal.' : 'Start logging your trades professionally today.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error-banner">
              <span className="auth-error-dot"></span>
              <span>{error}</span>
            </div>
          )}

          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="input-control"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="input-control"
              placeholder="e.g. trader@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="input-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="input-control"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
            {loading ? (
              <span className="spinner"></span>
            ) : mode === 'signin' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span className="auth-divider-line"></span>
          <span className="auth-divider-text">Or continue with</span>
          <span className="auth-divider-line"></span>
        </div>

        {/* Google Authentication Container */}
        <div className="auth-oauth-section">
          {hasGoogleClientId ? (
            <div id="google-btn-container" className="google-btn-wrapper"></div>
          ) : (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button 
                type="button" 
                className="btn btn-secondary google-sim-btn"
                onClick={() => setShowDemoGoogleModal(true)}
              >
                {/* Custom inline Google SVG icon */}
                <svg className="google-icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Sign In with Google
              </button>
              
              <div className="demo-badge">
                <span>⚡ Dev Mode: Google Auth Simulation Available</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Toggle */}
        <div className="auth-footer">
          {mode === 'signin' ? (
            <p>
              New to AlphaTrader?{' '}
              <button 
                type="button" 
                className="auth-toggle-link" 
                onClick={() => {
                  setMode('signup');
                  setPassword('');
                  setConfirmPassword('');
                  setError('');
                }}
              >
                Create an account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button 
                type="button" 
                className="auth-toggle-link" 
                onClick={() => {
                  setMode('signin');
                  setPassword('');
                  setConfirmPassword('');
                  setError('');
                }}
              >
                Sign in instead
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Demo Google Account Selector Modal */}
      {showDemoGoogleModal && (
        <div className="modal-overlay" style={{ alignItems: 'center', padding: '16px' }}>
          <div className="glass-panel modal-content" style={{ maxWidth: '400px', borderRadius: 'var(--radius-md)', padding: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>
              Select simulated Google Profile
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px', textAlign: 'center' }}>
              Test user data isolation by logging into different accounts.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                type="button" 
                className="btn btn-secondary profile-select-item"
                onClick={() => handleSimulateGoogleLogin('alice')}
              >
                <div className="profile-avatar">A</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Alice Trader</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>alice@example.com</div>
                </div>
              </button>

              <button 
                type="button" 
                className="btn btn-secondary profile-select-item"
                onClick={() => handleSimulateGoogleLogin('bob')}
              >
                <div className="profile-avatar" style={{ backgroundColor: 'var(--color-primary)' }}>B</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Bob Position</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>bob@example.com</div>
                </div>
              </button>
            </div>

            <button 
              type="button" 
              className="btn btn-danger" 
              style={{ width: '100%', marginTop: '20px', justifyContent: 'center' }}
              onClick={() => setShowDemoGoogleModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Auth CSS Styles */}
      <style jsx>{`
        .auth-wrapper {
          position: relative;
          min-height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background-color: var(--bg-app);
          overflow: hidden;
        }

        .auth-bg-glows {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 1;
        }

        .glow {
          position: absolute;
          width: 350px;
          height: 350px;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
        }

        .glow-1 {
          background-color: var(--color-primary);
          top: -10%;
          left: -10%;
        }

        .glow-2 {
          background-color: var(--color-success);
          bottom: -10%;
          right: -10%;
        }

        .auth-card {
          width: 100%;
          max-width: 420px;
          padding: 36px 30px;
          z-index: 2;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .auth-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 30px;
        }

        .auth-logo-icon {
          width: 48px;
          height: 48px;
          margin-bottom: 12px;
        }

        .auth-logo-text {
          font-size: 1.6rem;
          font-weight: 800;
          margin-bottom: 8px;
          background: linear-gradient(135deg, var(--text-primary), var(--color-primary-hover));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .auth-subtitle {
          font-size: 0.82rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .auth-submit-btn {
          margin-top: 8px;
          width: 100%;
          padding: 12px;
          justify-content: center;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .auth-error-banner {
          background: var(--color-danger-bg);
          border: 1px solid rgba(244, 63, 94, 0.2);
          color: var(--color-danger-hover);
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .auth-error-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-danger);
          flex-shrink: 0;
        }

        .auth-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 24px 0;
          gap: 12px;
        }

        .auth-divider-line {
          flex: 1;
          height: 1px;
          background-color: var(--border-color);
        }

        .auth-divider-text {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .auth-oauth-section {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        .google-sim-btn {
          width: 100%;
          max-width: 320px;
          padding: 12px;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 0.9rem;
          font-weight: 500;
          border: 1px solid var(--border-color);
          background-color: rgba(255, 255, 255, 0.03);
          transition: all 0.2s;
        }

        .google-sim-btn:hover {
          background-color: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .google-icon-svg {
          width: 18px;
          height: 18px;
        }

        .demo-badge {
          margin-top: 10px;
          padding: 4px 10px;
          border-radius: 12px;
          background: var(--color-primary-glow);
          border: 1px solid rgba(99, 102, 241, 0.15);
          color: var(--color-primary-hover);
          font-size: 0.68rem;
          font-weight: 600;
          text-align: center;
        }

        .auth-footer {
          margin-top: 10px;
          text-align: center;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .auth-toggle-link {
          background: none;
          border: none;
          color: var(--color-primary-hover);
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
        }

        .auth-toggle-link:hover {
          color: var(--text-primary);
        }

        .profile-select-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          width: 100%;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          transition: background 0.2s;
          background-color: rgba(255, 255, 255, 0.02);
        }

        .profile-select-item:hover {
          background-color: var(--bg-card-hover);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .profile-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: var(--color-success);
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.95rem;
          flex-shrink: 0;
        }

        .spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-top-color: var(--text-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
