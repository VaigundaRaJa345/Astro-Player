import React from 'react';
import { Compass, Music, Flame, Sparkles, Activity } from 'lucide-react';

export default function Discover({ setView, setViewParams }) {
  const genres = [
    { name: 'Lo-fi', color: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', query: 'lofi beats' },
    { name: 'Electronic', color: 'linear-gradient(135deg, #F000FF 0%, #7B00FF 100%)', query: 'synthwave electronic' },
    { name: 'Pop', color: 'linear-gradient(135deg, #e65c00 0%, #F9D423 100%)', query: 'pop hits' },
    { name: 'Hip-Hop', color: 'linear-gradient(135deg, #00b4db 0%, #0083b0 100%)', query: 'hip hop music' },
    { name: 'Rock', color: 'linear-gradient(135deg, #780206 0%, #061161 100%)', query: 'rock classics' },
    { name: 'Jazz', color: 'linear-gradient(135deg, #5A3F37 0%, #2C7744 100%)', query: 'smooth jazz' },
    { name: 'Tamil', color: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)', query: 'tamil songs' },
    { name: 'Telugu', color: 'linear-gradient(135deg, #a8ff78 0%, #78ffd6 100%)', query: 'telugu hits' },
    { name: 'Hindi', color: 'linear-gradient(135deg, #8A2387 0%, #E94057 100%, #F27121 100%)', query: 'hindi new songs' },
    { name: 'English', color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', query: 'english songs' },
    { name: 'International', color: 'linear-gradient(135deg, #0f2027 0%, #203a43 100%)', query: 'international hits' }
  ];

  const moods = [
    { name: 'Chill Space', icon: Compass, color: '#2563EB', query: 'chill space music' },
    { name: 'Super Energy', icon: Flame, color: '#EF4444', query: 'workout high energy music' },
    { name: 'Galaxy Focus', icon: Sparkles, color: '#8B5CF6', query: 'focus concentration ambient' },
    { name: 'Cosmic Sleep', icon: Music, color: '#1E1B4B', query: 'sleep delta waves ambient' },
    { name: 'Starlight Party', icon: Activity, color: '#EC4899', query: 'dance party hits' }
  ];

  const handleCardClick = (queryText) => {
    setView('search');
    setViewParams({ query: queryText });
    
    // Simulate typing trigger on Search view
    setTimeout(() => {
      const searchInput = document.querySelector('.input-field');
      if (searchInput) {
        searchInput.value = queryText;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 100);
  };

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Compass size={24} color="var(--accent)" />
          Music Discovery
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Browse curated galactic genres and moods
        </p>
      </div>

      {/* Moods Panel */}
      <section>
        <h3 style={{ fontSize: '16px', color: 'white', marginBottom: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Moods & Activities
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
          {moods.map((mood, idx) => {
            const Icon = mood.icon;
            return (
              <div
                key={idx}
                className="glass-panel"
                onClick={() => handleCardClick(mood.query)}
                style={{
                  height: '110px',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.03)',
                  transition: 'var(--transition)'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = mood.color; e.currentTarget.style.boxShadow = `0 0 15px ${mood.color}40`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: `${mood.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: mood.color
                }}>
                  <Icon size={18} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>{mood.name}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Genres Grid */}
      <section>
        <h3 style={{ fontSize: '16px', color: 'white', marginBottom: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Explore Genres
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
          {genres.map((genre, idx) => (
            <div
              key={idx}
              onClick={() => handleCardClick(genre.query)}
              style={{
                height: '100px',
                borderRadius: 'var(--radius-md)',
                background: genre.color,
                padding: '16px',
                display: 'flex',
                alignItems: 'flex-end',
                cursor: 'pointer',
                transition: 'var(--transition)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {/* Decorative circle */}
              <div style={{
                position: 'absolute',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.06)',
                right: '-15px',
                top: '-15px'
              }} />
              <span style={{ 
                fontSize: '16px', 
                fontWeight: '800', 
                color: 'white', 
                zIndex: 1, 
                textShadow: '0 2px 4px rgba(0,0,0,0.4)' 
              }}>
                {genre.name}
              </span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
