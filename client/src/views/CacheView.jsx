import React, { useEffect, useState } from 'react';
import { Database, RefreshCw, Trash2, Calendar, HardDrive, BarChart3, ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getTranslation } from '../services/translations';

export default function CacheView({ setView }) {
  const { language } = useAuth();
  const t = (key) => getTranslation(language, key);

  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'song' | 'playlist' | 'artist' | 'search'
  const [sort, setSort] = useState('recent'); // 'recent' | 'expires' | 'used' | 'alpha'

  useEffect(() => {
    loadCacheData();
  }, []);

  async function loadCacheData() {
    setLoading(true);
    try {
      const statsRes = await api.getCacheStats();
      setStats(statsRes);
      
      const listRes = await api.getCacheList();
      setItems(listRes.items || []);
    } catch (err) {
      console.error('Failed to load cache data', err);
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = async (item) => {
    try {
      await api.refreshCache(item.id, item.type);
      alert('Cache refreshed successfully! Expiry pushed by 7 days.');
      loadCacheData();
    } catch (err) {
      alert('Failed to refresh cache.');
    }
  };

  const handleRemove = async (item) => {
    if (!confirm('Remove this metadata from 7-day cache?')) return;
    try {
      await api.removeCache(item.id);
      loadCacheData();
    } catch (err) {
      alert('Failed to remove cache entry.');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all cached YouTube metadata? This will delete all search results and song caches, increasing YouTube API requests.')) return;
    try {
      await api.clearAllCache();
      loadCacheData();
    } catch (err) {
      alert('Failed to clear cache.');
    }
  };

  // Helper to compute remaining days
  const getRemainingDays = (expiryStr) => {
    const diff = new Date(expiryStr) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days <= 0 ? 'Expired' : `${days} days left`;
  };

  // Filter and Sort cached items list
  const processedItems = items
    .filter(item => {
      if (filter === 'all') return true;
      return item.type === filter;
    })
    .sort((a, b) => {
      if (sort === 'recent') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === 'expires') return new Date(a.expiresAt) - new Date(b.expiresAt);
      if (sort === 'used') return b.accessCount - a.accessCount;
      if (sort === 'alpha') return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button onClick={() => setView('settings')} className="btn-icon">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={22} color="var(--accent)" />
            Cached Music
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Manage YouTube API metadata caches and tracking metrics
          </p>
        </div>
      </div>

      {/* 1. Statistics Summary Grid */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <HardDrive size={22} color="var(--accent)" style={{ opacity: 0.8 }} />
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>API Cache Size</span>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'white', marginTop: '2px' }}>{stats.cacheSizeMB} MB</div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{stats.totalCached} total items</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <BarChart3 size={22} color="#10B981" style={{ opacity: 0.8 }} />
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cache Hit Rate</span>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#10B981', marginTop: '2px' }}>{stats.hitRate}%</div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{stats.hitCount} requests saved</span>
            </div>
          </div>
        </div>
      )}

      {/* Cache Warnings and Clear Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--divider)', paddingBottom: '14px', marginTop: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>Active Cached Entries ({processedItems.length})</span>
        </div>
        <button 
          onClick={handleClearAll}
          className="btn"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--error)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '6px 12px',
            fontSize: '11px',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <Trash2 size={12} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'text-top' }} />
          Clear All Cache
        </button>
      </div>

      {/* Filter and Sorting Selection controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Type Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'song', label: 'Songs' },
            { id: 'playlist', label: 'Playlists' },
            { id: 'search', label: 'Search Queries' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setFilter(p.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '16px',
                border: filter === p.id ? '1px solid var(--accent)' : '1px solid var(--divider)',
                backgroundColor: filter === p.id ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-secondary)',
                color: filter === p.id ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Sorting Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sort by:</span>
          <select 
            value={sort} 
            onChange={e => setSort(e.target.value)}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--divider)',
              color: 'white',
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '4px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="recent">Recently Cached</option>
            <option value="expires">Expiring Soon</option>
            <option value="used">Most Popular Usage</option>
            <option value="alpha">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* 2. Cached Items Lists */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>
          <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 10px auto', color: 'var(--accent)' }} />
          Loading Cached Music Registry...
        </div>
      ) : processedItems.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 20px', fontSize: '13px', border: '1px dashed var(--divider)', borderRadius: 'var(--radius-md)' }}>
          No cached items match this category filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {processedItems.map(item => (
            <div 
              key={item.id}
              className="glass-panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255,255,255,0.02)'
              }}
            >
              <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    fontSize: '9px', 
                    fontWeight: '800', 
                    color: 'white', 
                    backgroundColor: item.type === 'song' ? 'var(--primary)' : 'var(--bg-elevated)', 
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    textTransform: 'uppercase'
                  }}>
                    {item.type}
                  </span>
                  {item.isPinned && (
                    <span style={{ fontSize: '9px', fontWeight: '800', color: 'black', backgroundColor: 'var(--accent)', padding: '2px 6px', borderRadius: '4px' }}>
                      PINNED
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '6px' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                  {item.type === 'song' ? item.artist : `${item.songCount} cached results`} • Used {item.accessCount} times
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ textAlign: 'right', marginRight: '6px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    {getRemainingDays(item.expiresAt)}
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>7d Expiration</div>
                </div>
                
                <button 
                  onClick={() => handleRefresh(item)}
                  className="btn-icon" 
                  style={{ width: '32px', height: '32px' }}
                  title="Refresh cache (Reset 7 days)"
                >
                  <RefreshCw size={14} />
                </button>
                
                <button 
                  onClick={() => handleRemove(item)}
                  className="btn-icon" 
                  style={{ width: '32px', height: '32px', color: 'var(--error)' }}
                  title="Remove from Cache"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
