import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Music, Disc, Loader2 } from 'lucide-react';

export default function Auth() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('astro@player.com');
  const [password, setPassword] = useState('astro');
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !username)) {
      setAuthError('Please fill out all fields.');
      return;
    }

    setAuthError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError(null);
    setIsLoading(true);
    try {
      // Simulate Google auth via mock profile creation
      await login('explorer@astro.com', 'google_mock_password');
    } catch (err) {
      // If login fails (user doesn't exist yet), register user
      try {
        await register('Astro Explorer', 'explorer@astro.com', 'google_mock_password');
      } catch (regErr) {
        setAuthError('Google sign in failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      backgroundColor: 'var(--bg)',
      padding: '20px',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 900
    }}>
      {/* Background Ambient Glow */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '25%',
        width: '50%',
        height: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, rgba(5,5,5,0) 70%)',
        zIndex: -1,
        pointerEvents: 'none'
      }} />

      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '400px',
        padding: '36px 30px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Brand Logo */}
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px var(--accent-glow)',
          marginBottom: '20px'
        }}>
          <Music size={24} color="white" />
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>
          {isLogin ? 'Welcome back' : 'Create an account'}
        </h2>
        
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '28px', textAlign: 'center' }}>
          {isLogin ? 'Sign in to access your sound universe' : 'Sign up to build your custom music library'}
        </p>

        {authError && (
          <div style={{
            width: '100%',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            color: 'var(--error)',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Username"
              className="input-field"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={isLoading}
              required
            />
          )}
          
          <input
            type="email"
            placeholder="Email address"
            className="input-field"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="input-field"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', height: '46px', marginTop: '8px', position: 'relative' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
          {isLogin && (
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '12px', opacity: 0.85 }}>
              Preset login auto-filled. Click <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Sign In</span> or Guest Login to enter.
            </div>
          )}
        </form>

        <div style={{ display: 'flex', alignItems: 'center', width: '100%', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--divider)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--divider)' }} />
        </div>

        <button 
          onClick={handleGoogleAuth}
          className="btn btn-secondary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justify: 'center', justifyContent: 'center', gap: '10px', height: '44px' }}
          disabled={isLoading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <button 
          onClick={() => { setIsLogin(!isLogin); setAuthError(null); }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--accent)',
            fontSize: '13px',
            fontWeight: '600',
            marginTop: '28px',
            cursor: 'pointer'
          }}
        >
          {isLogin ? 'Create an account' : 'Already have an account? Sign In'}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
