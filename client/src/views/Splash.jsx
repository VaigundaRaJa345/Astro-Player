import React, { useEffect } from 'react';
import { Music } from 'lucide-react';

export default function Splash({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      backgroundColor: 'var(--bg)',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999
    }}>
      {/* Animated Orbiting Element Logo */}
      <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '24px', display: 'flex', alignItems: 'center', justify: 'center', justifyContent: 'center' }}>
        {/* Orbital circle 1 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '50%',
          border: '1.5px solid rgba(59, 130, 246, 0.25)',
          animation: 'spin 12s linear infinite'
        }} />
        
        {/* Orbital circle 2 with neon node */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: '12px',
          bottom: '12px',
          borderRadius: '50%',
          border: '2px dashed var(--accent)',
          animation: 'spin 8s linear infinite reverse',
          boxShadow: '0 0 10px rgba(59, 130, 246, 0.1)'
        }} />

        {/* Central Core Star Note */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 35px var(--accent)',
          zIndex: 2,
          animation: 'pulse 2s infinite ease-in-out'
        }}>
          <Music size={32} color="white" />
        </div>
      </div>

      <h1 style={{
        fontSize: '28px',
        fontWeight: '800',
        letterSpacing: '0.2em',
        background: 'linear-gradient(to right, #FFFFFF, var(--accent))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '8px',
        textTransform: 'uppercase'
      }}>
        ASTRO PLAYER
      </h1>
      
      <p style={{
        fontSize: '12px',
        color: 'var(--text-secondary)',
        fontWeight: '600',
        letterSpacing: '0.15em',
        textTransform: 'uppercase'
      }}>
        Your Sound. Your Universe.
      </p>

      {/* Futuristic loading line */}
      <div style={{
        width: '140px',
        height: '3px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '3px',
        marginTop: '40px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          height: '100%',
          backgroundColor: 'var(--accent)',
          width: '50px',
          borderRadius: '3px',
          animation: 'shuttle 1.5s infinite ease-in-out',
          boxShadow: '0 0 8px var(--accent)'
        }} />
      </div>

      <style>{`
        @keyframes shuttle {
          0% { left: -50px; }
          50% { left: 140px; }
          100% { left: 140px; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 30px var(--accent-glow); }
          50% { transform: scale(1.06); box-shadow: 0 0 45px var(--accent); }
        }
      `}</style>
    </div>
  );
}
