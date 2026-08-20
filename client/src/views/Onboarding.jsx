import React, { useState } from 'react';
import { ArrowRight, Disc, Heart, DownloadCloud } from 'lucide-react';

export default function Onboarding({ onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: 'Discover Your Sound',
      subtitle: 'Find songs, artists, albums, and playlists you\'ll love in our massive cosmic database.',
      icon: Disc,
      color: 'var(--accent)',
      visual: (
        <div style={{ display: 'flex', alignItems: 'flex-end', justify: 'center', gap: '8px', height: '120px', width: '200px', margin: '30px auto' }}>
          {[30, 80, 45, 95, 60, 85, 40, 75, 50, 90, 35].map((h, i) => (
            <div 
              key={i} 
              style={{
                width: '8px',
                height: `${h}%`,
                background: 'linear-gradient(to top, var(--primary), var(--accent))',
                borderRadius: '4px',
                boxShadow: '0 0 10px var(--accent-glow)',
                animation: `bounce-wave 1.2s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.1}s`
              }} 
            />
          ))}
        </div>
      )
    },
    {
      title: 'Build Your Collection',
      subtitle: 'Like songs, follow favorite artists, and assemble custom playlists for any travel mood.',
      icon: Heart,
      color: '#EC4899',
      visual: (
        <div style={{ position: 'relative', height: '140px', width: '200px', margin: '20px auto' }}>
          <div style={{
            position: 'absolute',
            width: '80px',
            height: '80px',
            borderRadius: '12px',
            background: 'linear-gradient(45deg, #111318, #171A21)',
            border: '1px solid rgba(255,255,255,0.08)',
            top: '10px',
            left: '10px',
            transform: 'rotate(-10deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(0,0,0,0.5)'
          }}>
            <Disc size={32} color="var(--text-muted)" />
          </div>
          <div style={{
            position: 'absolute',
            width: '80px',
            height: '80px',
            borderRadius: '12px',
            background: 'linear-gradient(45deg, #2563EB, #3B82F6)',
            top: '30px',
            left: '110px',
            transform: 'rotate(15deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 25px rgba(59,130,246,0.4)'
          }}>
            <Heart size={36} color="white" fill="white" />
          </div>
          <div style={{
            position: 'absolute',
            width: '70px',
            height: '70px',
            borderRadius: '10px',
            background: 'linear-gradient(45deg, #10B981, #059669)',
            top: '60px',
            left: '50px',
            transform: 'rotate(-5deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(16,185,129,0.3)'
          }}>
            <Disc size={28} color="white" />
          </div>
        </div>
      )
    },
    {
      title: 'Take Music Offline',
      subtitle: 'Download eligible tracks to your local device cache and play them anywhere in the galaxy.',
      icon: DownloadCloud,
      color: 'var(--success)',
      visual: (
        <div style={{
          width: '120px',
          height: '140px',
          margin: '20px auto',
          borderRadius: '16px',
          border: '2px solid var(--divider)',
          background: 'var(--bg-card)',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
          position: 'relative'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <DownloadCloud size={24} color="var(--accent)" />
          </div>
          <div style={{ width: '80%', height: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: '75%', height: '100%', backgroundColor: 'var(--accent)', animation: 'progress-mock 2.5s infinite linear' }} />
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '8px', fontWeight: '700' }}>Downloading... 75%</span>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      backgroundColor: 'var(--bg)',
      padding: '24px',
      textAlign: 'center',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 999
    }}>
      {/* Skip Button */}
      <button 
        onClick={onComplete}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          fontWeight: '600',
          fontSize: '14px',
          cursor: 'pointer'
        }}
      >
        Skip
      </button>

      {/* Main Slide Card */}
      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Render Slide Visual */}
        {slides[currentSlide].visual}

        {/* Text Details */}
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'white', marginBottom: '12px', marginTop: '24px' }}>
          {slides[currentSlide].title}
        </h2>
        
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '32px', height: '70px', padding: '0 8px' }}>
          {slides[currentSlide].subtitle}
        </p>

        {/* Dot Indicators */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
          {slides.map((_, idx) => (
            <div 
              key={idx}
              style={{
                width: idx === currentSlide ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: idx === currentSlide ? 'var(--accent)' : 'var(--divider)',
                transition: 'var(--transition)',
                boxShadow: idx === currentSlide ? '0 0 8px var(--accent-glow)' : 'none'
              }}
            />
          ))}
        </div>

        {/* Action Button */}
        <button 
          onClick={handleNext}
          className="btn btn-primary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justify: 'center', justifyContent: 'center' }}
        >
          {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          {currentSlide < slides.length - 1 && <ArrowRight size={18} style={{ marginLeft: '4px' }} />}
        </button>
      </div>

      <style>{`
        @keyframes bounce-wave {
          from { height: 10%; }
          to { height: 95%; }
        }
        @keyframes progress-mock {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
