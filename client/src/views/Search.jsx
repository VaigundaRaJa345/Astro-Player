import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X, Play, Heart, Clock, Flame, Loader2, MoreVertical } from 'lucide-react';
import { usePlayback } from '../context/PlaybackContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { getTranslation } from '../services/translations';

export default function Search({ viewParams, setView, setViewParams, userPlaylists, refreshPlaylists }) {
  const { playTrack, likedSongIds, toggleLike, addToQueue, downloadSong } = usePlayback();
  const { language } = useAuth();
  const t = (key) => getTranslation(language, key);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); 
  const [error, setError] = useState(null);
  
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  // Cache Indicators and Multi-Select states
  const [locallyCachedIds, setLocallyCachedIds] = useState(new Set());
  const [selectedSongIds, setSelectedSongIds] = useState(new Set());
  const [activeMenuSong, setActiveMenuSong] = useState(null);
  const [showAddToPlaylistDropdown, setShowAddToPlaylistDropdown] = useState(false);

  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('astro_recent_searches') || '[]');
    } catch {
      return [];
    }
  });

  const trendingSearches = ['Hukum', 'Munbe Vaa', 'Arabic Kuthu', 'Yuvan Shankar Raja Hits', 'Anirudh Melody Songs'];

  // Load cached item IDs on mount
  useEffect(() => {
    async function loadCachedMetadataList() {
      try {
        const res = await api.getCacheList();
        const ids = new Set(res.items.map(item => item.id));
        setLocallyCachedIds(ids);
        localStorage.setItem('astro_locally_cached_ids', JSON.stringify(Array.from(ids)));
      } catch {
        const localCached = JSON.parse(localStorage.getItem('astro_locally_cached_ids') || '[]');
        setLocallyCachedIds(new Set(localCached));
      }
    }
    loadCachedMetadataList();
  }, []);

  // Keyboard shortcut Ctrl+K focus
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

  // Redirect initialQuery checks
  useEffect(() => {
    if (viewParams && viewParams.initialQuery) {
      setQuery(viewParams.initialQuery);
      executeSearch(viewParams.initialQuery);
    }
  }, [viewParams]);

  // Handle typing suggestions dynamically from cache history
  useEffect(() => {
    if (query.trim().length >= 2) {
      const delaySuggestions = setTimeout(async () => {
        try {
          const res = await api.getSearchSuggestions(query);
          setSuggestions(res.suggestions || []);
        } catch (e) {
          console.warn('Failed to load search suggestions:', e);
          setSuggestions([]);
        }
      }, 200);
      return () => clearTimeout(delaySuggestions);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  // Debounced search trigger (400ms, query >= 2 chars)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (query.trim().length < 2) {
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(() => {
      const targetQuery = filter === 'tamil' && !query.toLowerCase().includes('tamil') ? `${query} Tamil` : query;
      executeSearch(targetQuery);
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [query, filter]);

  async function executeSearch(searchQuery) {
    setLoading(true);
    setError(null);
    try {
      const data = await api.searchSongs(searchQuery);
      if (data.error) {
        setError(data.error);
        setResults([]);
      } else {
        setResults(data.songs || []);
      }
      
      if (!viewParams?.initialQuery && data.songs && data.songs.length > 0) {
        setRecentSearches(prev => {
          const next = [searchQuery.replace(/ Tamil$/i, ''), ...prev.filter(q => q !== searchQuery)].slice(0, 5);
          localStorage.setItem('astro_recent_searches', JSON.stringify(next));
          return next;
        });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to connect to YouTube. Check your internet connection.');
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

  const toggleSongSelection = (id) => {
    setSelectedSongIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleKeepSelectedCached = async () => {
    const size = selectedSongIds.size;
    if (!confirm(`Cache ${size} ${size === 1 ? 'song' : 'songs'} for 7 days? We'll keep the songs' metadata cached to preserve API quota.`)) return;
    
    try {
      const promises = Array.from(selectedSongIds).map(id => {
        const songObj = results.find(s => s.id === id);
        if (songObj) {
          return api.keepCached(id, 'song', songObj);
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
      
      const newCached = Array.from(new Set([...Array.from(locallyCachedIds), ...selectedSongIds]));
      localStorage.setItem('astro_locally_cached_ids', JSON.stringify(newCached));
      setLocallyCachedIds(new Set(newCached));
      
      setSelectedSongIds(new Set());
      alert(`✓ ${size} songs cached for 7 days successfully.`);
    } catch (err) {
      console.error(err);
      alert('Failed to cache selected songs.');
    }
  };

  // Individual Song Option Actions
  const toggleTrackMenu = (e, song) => {
    e.stopPropagation();
    if (activeMenuSong && activeMenuSong.id === song.id) {
      setActiveMenuSong(null);
    } else {
      setActiveMenuSong(song);
    }
    setShowAddToPlaylistDropdown(false);
  };

  const handleMenuPlayNext = (e) => {
    e.stopPropagation();
    addToQueue(activeMenuSong);
    setActiveMenuSong(null);
    alert(`"${activeMenuSong.title}" added to queue.`);
  };

  const handleMenuAddToPlaylist = async (e, plId) => {
    e.stopPropagation();
    try {
      await api.addSongToPlaylist(plId, activeMenuSong.id, activeMenuSong);
      setActiveMenuSong(null);
      setShowAddToPlaylistDropdown(false);
      alert('Added to playlist successfully!');
      refreshPlaylists();
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeepCached = async (song) => {
    setActiveMenuSong(null);
    if (!confirm('Keep this song cached for 7 days? We\'ll keep the song\'s available metadata and discovery information cached to reduce API requests.')) return;
    
    try {
      await api.keepCached(song.id, 'song', song);
      
      const newCached = Array.from(new Set([...Array.from(locallyCachedIds), song.id]));
      localStorage.setItem('astro_locally_cached_ids', JSON.stringify(newCached));
      setLocallyCachedIds(new Set(newCached));
      
      alert('✓ Cached for 7 days');
    } catch (err) {
      alert('Failed to cache song metadata.');
    }
  };

  const handleMenuShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/song/${activeMenuSong.id}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Share link copied to clipboard!');
      setActiveMenuSong(null);
    });
  };

  // Close menus on outside click
  useEffect(() => {
    const handleDocumentClick = () => {
      setActiveMenuSong(null);
      setShowAddToPlaylistDropdown(false);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const filteredResults = results.filter(item => {
    if (filter === 'all' || filter === 'tamil') return true;
    if (filter === 'songs') return item.source === 'youtube' || item.source === 'astro';
    if (filter === 'artists') return false; 
    return true;
  });

  // Unique song card renderer for search results list (supports Best Match highlights)
  const renderSongCard = (song, isBestMatch = false) => {
    const isLiked = likedSongIds.has(song.id);
    const isCached = locallyCachedIds.has(song.id);
    
    return (
      <div 
        key={song.id} 
        className="glass-panel"
        onClick={() => playTrack(song)}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: isBestMatch ? '14px 18px' : '8px 12px',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          border: isBestMatch ? '2px solid var(--accent)' : selectedSongIds.has(song.id) ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.03)',
          backgroundColor: selectedSongIds.has(song.id) ? 'rgba(59, 130, 246, 0.05)' : isBestMatch ? 'rgba(59, 130, 246, 0.03)' : 'transparent',
          transition: 'var(--transition)',
          position: 'relative'
        }}
        onMouseEnter={e => { if (!selectedSongIds.has(song.id)) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
        onMouseLeave={e => { if (!selectedSongIds.has(song.id)) e.currentTarget.style.backgroundColor = isBestMatch ? 'rgba(59, 130, 246, 0.03)' : 'transparent'; }}
      >
        {/* Checkbox selector */}
        <input 
          type="checkbox"
          checked={selectedSongIds.has(song.id)}
          onChange={() => toggleSongSelection(song.id)}
          style={{ marginRight: '12px', width: '16px', height: '16px', accentColor: 'var(--accent)', cursor: 'pointer' }}
          onClick={e => e.stopPropagation()}
        />

        {/* Artwork */}
        <img 
          src={song.artwork_url} 
          alt={song.title} 
          style={{ 
            width: isBestMatch ? '64px' : '48px', 
            height: isBestMatch ? '64px' : '48px', 
            borderRadius: 'var(--radius-sm)', 
            objectFit: 'cover', 
            marginRight: '14px' 
          }} 
        />
        
        {/* Titles */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
          {isBestMatch && (
            <div style={{ fontSize: '9px', fontWeight: '900', color: 'black', backgroundColor: 'var(--accent)', padding: '2px 8px', borderRadius: '4px', width: 'fit-content', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>
              Best Match
            </div>
          )}
          <div style={{ fontSize: isBestMatch ? '15.5px' : '14px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.title}</span>
            {isCached && (
              <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--accent)', backgroundColor: 'var(--bg-elevated)', padding: '1px 5px', borderRadius: '3px', flexShrink: 0 }}>
                ✓ Cached
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '4px' }}>
            {song.album ? `${song.artist} • ${song.album}` : song.artist}
          </div>
        </div>

        {/* Play, Likes, & Options Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={e => e.stopPropagation()}>
          <button onClick={() => toggleLike(song)} className="btn-icon" style={{ width: '32px', height: '32px', color: isLiked ? 'var(--accent)' : 'var(--text-secondary)' }}>
            <Heart size={14} fill={isLiked ? 'var(--accent)' : 'none'} />
          </button>
          <button onClick={(e) => toggleTrackMenu(e, song)} className="btn-icon" style={{ width: '32px', height: '32px' }}>
            <MoreVertical size={16} />
          </button>
        </div>

        {/* Track Option Menu Popup */}
        {activeMenuSong && activeMenuSong.id === song.id && (
          <div 
            onClick={e => e.stopPropagation()}
            className="glass-panel"
            style={{
              position: 'absolute',
              right: '12px',
              top: '46px',
              width: '200px',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              zIndex: 80,
              padding: '6px'
            }}
          >
            <button onClick={() => { playTrack(song); setActiveMenuSong(null); }} style={menuItemStyle}>{t('play')}</button>
            <button onClick={handleMenuPlayNext} style={menuItemStyle}>{t('addQueue')}</button>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowAddToPlaylistDropdown(!showAddToPlaylistDropdown); }} 
              style={{ ...menuItemStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              {t('addToPlaylist')} {showAddToPlaylistDropdown ? '▼' : '►'}
            </button>
            {showAddToPlaylistDropdown && (
              <div style={{ paddingLeft: '8px', maxHeight: '100px', overflowY: 'auto', borderLeft: '2px solid var(--divider)', margin: '4px 0' }}>
                {userPlaylists.map(pl => (
                  <button key={pl.id} onClick={(e) => handleMenuAddToPlaylist(e, pl.id)} style={{ ...menuItemStyle, fontSize: '11px', padding: '6px 8px' }}>
                    {pl.name}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => handleKeepCached(song)} style={{ ...menuItemStyle, color: 'var(--accent)' }}>Keep Cached for 7 Days</button>
            <button onClick={() => { downloadSong(song); setActiveMenuSong(null); }} style={menuItemStyle}>{t('download')}</button>
            <button onClick={handleMenuShare} style={menuItemStyle}>{t('shareLink')}</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '140px', position: 'relative' }}>
      
      {/* Search Input Bar */}
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
            onClick={() => { setQuery(''); setResults([]); setSelectedSongIds(new Set()); setError(null); }}
            style={{ position: 'absolute', right: '18px', top: '13px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        )}

        {/* Dynamic Auto-Suggestions Dropdown */}
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
        /* Default Dashboard */
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error ? (
            <div style={{ textAlign: 'center', color: 'var(--error)', padding: '40px 20px', fontSize: '14.5px', border: '1px dashed var(--error)', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(239, 68, 68, 0.03)' }}>
              <div>{error}</div>
            </div>
          ) : filteredResults.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px', fontSize: '14px' }}>
              <div>{t('noResults')} "{query}"</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>{t('tryDifferent')}</div>
            </div>
          ) : (
            <>
              {/* Best Match Section */}
              {filteredResults.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Search Results
                  </h4>
                  {renderSongCard(filteredResults[0], true)}
                </div>
              )}

              {/* Other Results Section */}
              {filteredResults.length > 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    Other Results
                  </h4>
                  {filteredResults.slice(1).map(song => renderSongCard(song, false))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Floating Multi-Select Action Panel */}
      {selectedSongIds.size > 0 && (
        <div 
          className="glass-panel"
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 32px)',
            maxWidth: '500px',
            padding: '12px 18px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 200,
            border: '1px solid var(--accent)',
            animation: 'slideUp 0.25s ease-out'
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>
            Selected {selectedSongIds.size} {selectedSongIds.size === 1 ? 'song' : 'songs'}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setSelectedSongIds(new Set())}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}
            >
              Cancel
            </button>
            <button 
              onClick={handleKeepSelectedCached}
              className="btn btn-primary"
              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}
            >
              Keep Selected Cached
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const menuItemStyle = {
  display: 'block',
  width: '100%',
  padding: '8px 12px',
  background: 'transparent',
  border: 'none',
  color: 'var(--text-primary)',
  fontSize: '12px',
  fontWeight: '600',
  textAlign: 'left',
  cursor: 'pointer',
  borderRadius: '4px',
  transition: 'background 0.2s ease'
};
