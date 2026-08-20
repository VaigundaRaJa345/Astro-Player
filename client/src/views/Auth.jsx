import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Music, Disc, Loader2 } from 'lucide-react';

export default function Auth() {
  const { login, register, loginWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('astro@player.com');
  const [password, setPassword] = useState('astro');
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize and mount Google Identity Services Sign-In button
  useEffect(() => {
    /* global google */
    if (typeof google !== 'undefined') {
      try {
        google.accounts.id.initialize({
          client_id: '541413798070-kvctjqv0hl0hecrfabj7od07mit0me9r.apps.googleusercontent.com',
          callback: async (response) => {
            setIsLoading(true);
            setAuthError(null);
            try {
              await loginWithGoogle(response.credential);
            } catch (err) {
              setAuthError(err.message || 'Google sign in authentication failed');
            } finally {
              setIsLoading(false);
            }
          }
        });
        
        google.accounts.id.renderButton(
          document.getElementById('google-signin-btn-container'),
          { 
            theme: 'filled_blue', 
            size: 'large', 
            width: 340,
            text: 'continue_with',
            shape: 'rectangular'
          }
        );
      } catch (err) {
        console.error('Failed to render Google Sign-In button:', err);
      }
    }
  }, [isLogin]);

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
              Preset login auto-filled. Click <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Sign In</span> to enter.
            </div>
          )}
        </form>

        <div style={{ display: 'flex', alignItems: 'center', width: '100%', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--divider)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--divider)' }} />
        </div>

        {/* Google Native OAuth container */}
        <div 
          id="google-signin-btn-container" 
          style={{ 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            minHeight: '44px',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden'
          }}
        ></div>

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
