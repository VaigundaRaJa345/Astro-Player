import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X, Play, Heart, Clock, Flame, Loader2 } from 'lucide-react';
import { usePlayback } from '../context/PlaybackContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { getTranslation } from '../services/translations';

// Pre-seeded dictionary of Tamil search hints
const knownSuggestions = [
  'Anirudh Ravichander', 'Anirudh Tamil Songs', 'Anirudh Hit Songs', 'Anirudh Melody Songs', 'Anirudh Movie Songs',
  'A.R. Rahman Hits', 'A.R. Rahman Tamil Songs', 'A.R. Rahman Melodies', 'Ilaiyaraaja Classic Hits', 
  'Ilaiyaraaja Melody Songs', 'Yuvan Shankar Raja Hits', 'Yuvan Shankar Raja Melodies', 'Harris Jayaraj Hit Songs',
  'Why This Kolaveri Di', 'Arabic Kuthu', 'Hukum', 'Hukum Tamil Song', 'Hukum Jailer', 'Kaavaalaa', 'Vaa Vaathi', 
  'Enjoy Enjaami', 'Munbe Vaa', 'Vaseegara', 'Nenjukkul Peidhidum', 'Anbe En Anbe',
  'Jailer Songs', 'Leo Songs', 'Vikram Songs', '96 Songs', 'Vaaranam Aayiram Songs', 'Alaipayuthey Songs', 'Sillunu Oru Kadhal'
];

export default function Search({ viewParams, setView, setViewParams, userPlaylists, refreshPlaylists }) {
  const { playTrack, likedSongIds, toggleLike } = usePlayback();
  const { language } = useAuth();
  const t = (key) => getTranslation(language, key);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'songs' | 'artists' | 'playlists' | 'tamil'
  
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('astro_recent_searches') || '[]');
    } catch {
      return [];
    }
  });

  const trendingSearches = ['Hukum', 'Munbe Vaa', 'Arabic Kuthu', 'Yuvan Shankar Raja Hits', 'Anirudh Melody Songs'];

  // Handle Ctrl+K shortcut focus on desktop
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (inputRef.current) inputRef.current.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle initialQuery redirect parameters on mount
  useEffect(() => {
    if (viewParams && viewParams.initialQuery) {
      setQuery(viewParams.initialQuery);
      executeSearch(viewParams.initialQuery);
    }
  }, [viewParams]);

  // Generate suggestions while typing
  useEffect(() => {
    if (query.trim().length >= 2) {
      const val = query.toLowerCase().trim();
      const matches = knownSuggestions.filter(s => s.toLowerCase().includes(val)).slice(0, 5);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  // Debounced search trigger
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(() => {
      const targetQuery = filter === 'tamil' && !query.toLowerCase().includes('tamil') ? `${query} Tamil` : query;
      executeSearch(targetQuery);
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [query, filter]);

  async function executeSearch(searchQuery) {
    setLoading(true);
    try {
      // Connect to host-safe api utility supporting local db fallbacks
      const data = await api.searchSongs(searchQuery);
      setResults(data.songs || []);
      
      // Save query to recent searches history list
      if (!viewParams?.initialQuery) {
        setRecentSearches(prev => {
          const next = [searchQuery.replace(/ Tamil$/i, ''), ...prev.filter(q => q !== searchQuery)].slice(0, 5);
          localStorage.setItem('astro_recent_searches', JSON.stringify(next));
          return next;
        });
      }
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const handleRecentClick = (q) => {
    setQuery(q);
    setShowSuggestions(false);
    executeSearch(q);
  };

  const handleClearRecent = () => {
    localStorage.removeItem('astro_recent_searches');
    setRecentSearches([]);
  };

  const handleSuggestionClick = (sug) => {
    setQuery(sug);
    setShowSuggestions(false);
    executeSearch(sug);
  };

  const filteredResults = results.filter(item => {
    if (filter === 'all' || filter === 'tamil') return true;
    if (filter === 'songs') return item.source === 'youtube' || item.source === 'astro';
    if (filter === 'artists') return false; // placeholder filter
    return true;
  });

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '80px', position: 'relative' }}>
      
      {/* Search Header Input */}
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          ref={inputRef}
          id="search-input"
          type="text"
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="input-field"
          style={{ paddingLeft: '50px', paddingRight: '48px', fontSize: '16px' }}
        />
        <SearchIcon 
          size={20} 
          color="var(--text-secondary)" 
          style={{ position: 'absolute', left: '18px', top: '15px' }} 
        />
        {query && (
          <button 
            onClick={() => { setQuery(''); setResults([]); }}
            style={{ position: 'absolute', right: '18px', top: '13px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        )}

        {/* Live Auto-Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div 
            className="glass-panel"
            style={{
              position: 'absolute',
              top: '52px',
              left: 0,
              right: 0,
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
              zIndex: 90,
              padding: '6px 0',
              border: '1px solid var(--divider)',
              maxHeight: '220px',
              overflowY: 'auto'
            }}
          >
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(sug)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '10px 16px',
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '13.5px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <SearchIcon size={14} color="var(--text-muted)" />
                {sug}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {['all', 'songs', 'artists', 'playlists', 'tamil'].map(p => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: filter === p ? '1px solid var(--accent)' : '1px solid var(--divider)',
              backgroundColor: filter === p ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-secondary)',
              color: filter === p ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'var(--transition)',
              flexShrink: 0
            }}
          >
            {p === 'all' ? t('home') : p === 'tamil' ? 'தமிழ்' : p}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {loading ? (
        /* Skeleton loaders */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '6px' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="skeleton" style={{ width: '40%', height: '14px' }} />
                <div className="skeleton" style={{ width: '20%', height: '10px' }} />
              </div>
            </div>
          ))}
        </div>
      ) : query.trim() === '' ? (
        /* Default Search Dashboard (Recent/Trending) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '10px' }}>
          
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ fontSize: '15px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="var(--text-muted)" />
                  Recent Searches
                </h4>
                <button onClick={handleClearRecent} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}>
                  {t('clearAll')}
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {recentSearches.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRecentClick(q)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--divider)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending Searches */}
          <div>
            <h4 style={{ fontSize: '15px', color: 'white', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={16} color="var(--accent)" />
              {t('trendingTamil')}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {trendingSearches.map((term, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRecentClick(term)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--divider)',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--divider)'}
                >
                  <span style={{ color: 'var(--accent)', fontWeight: '800' }}>#{idx + 1}</span>
                  {term}
                </button>
              ))}
            </div>
          </div>

        </div>
      ) : (
        /* Search Results List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredResults.map(song => {
            const isLiked = likedSongIds.has(song.id);
            return (
              <div 
                key={song.id} 
                className="glass-panel"
                onClick={() => playTrack(song)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.03)',
                  transition: 'var(--transition)'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <img 
                  src={song.artwork_url} 
                  alt={song.title} 
                  style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', marginRight: '12px' }} 
                />
                
                <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {song.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                    {song.artist}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => toggleLike(song)} className="btn-icon" style={{ width: '32px', height: '32px', color: isLiked ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    <Heart size={14} fill={isLiked ? 'var(--accent)' : 'none'} />
                  </button>
                  <button 
                    onClick={() => playTrack(song)}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Play size={12} color="black" fill="black" style={{ marginLeft: '1px' }} />
                  </button>
                </div>
              </div>
            );
          })}
          {filteredResults.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px', fontSize: '14px' }}>
              <div>{t('noResults')} "{query}"</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>{t('tryDifferent')}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
