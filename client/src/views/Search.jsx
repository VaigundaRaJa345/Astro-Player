import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X, Play, Heart, MoreVertical, Loader2, Clock, Flame } from 'lucide-react';
import { usePlayback } from '../context/PlaybackContext';
import { api } from '../services/api';

export default function Search({ setView, setViewParams, userPlaylists, refreshPlaylists }) {
  const { playTrack, likedSongIds, toggleLike } = usePlayback();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'songs' | 'artists' | 'playlists'
  
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('astro_recent_searches') || '[]');
    } catch {
      return [];
    }
  });

  const trendingSearches = ['Stellar Drift', 'Space Ambient', 'Nebula Chill', 'Lofi Orbit', 'Synthwave 2026'];

  // Debounced search trigger
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(() => {
      executeSearch(query);
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  async function executeSearch(searchQuery) {
    try {
      const res = await fetch(`http://localhost:5000/api/songs/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('astro_token')}`
        }
      });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      
      setResults(data.songs || []);
      
      // Save to recent searches if not already there
      setRecentSearches(prev => {
        const next = [searchQuery, ...prev.filter(q => q !== searchQuery)].slice(0, 5);
        localStorage.setItem('astro_recent_searches', JSON.stringify(next));
        return next;
      });
    } catch (err) {
      console.error(err);
      // Fallback: search local mock store/Astro Originals
      try {
        const feat = await api.getFeatured();
        const filtered = feat.songs.filter(
          s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
               s.artist.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setResults(filtered);
      } catch (mockErr) {
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleRecentClick = (q) => {
    setQuery(q);
  };

  const handleClearRecent = () => {
    localStorage.removeItem('astro_recent_searches');
    setRecentSearches([]);
  };

  // Filter songs based on pill selection
  const filteredResults = results.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'songs') return item.source === 'youtube' || item.source === 'astro';
    // Mock other formats for search UI richness
    if (filter === 'artists') return false; // Demo details
    return true;
  });

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Search Header Input */}
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          type="text"
          placeholder="Search songs, artists, albums, playlists"
          value={query}
          onChange={e => setQuery(e.target.value)}
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
            onClick={() => setQuery('')}
            style={{ position: 'absolute', right: '18px', top: '13px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {['all', 'songs', 'artists', 'playlists'].map(p => (
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
              transition: 'var(--transition)'
            }}
          >
            {p}
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
                  Clear All
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
              Trending Searches
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
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
