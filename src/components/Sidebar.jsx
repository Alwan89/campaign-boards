import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDownIcon } from './icons/Icons';

export default function Sidebar({
  campaign,
  adSets,
  ads,
  totalFiles,
  activePlacement,
  setActivePlacement,
  view,
  setView,
  theme,
  setTheme,
  modifiedCount,
  onExport,
}) {
  const [structureOpen, setStructureOpen] = useState(false);

  const tierColor = (t) => t === 'Broad' ? 'var(--tier-broad)' : t === 'Interest' ? 'var(--tier-interest)' : 'var(--tier-retarg)';

  /* Count ads by placement */
  const feedCount = ads.filter(a => (a.placement || 'Feed') === 'Feed').length;
  const storyReelCount = ads.filter(a => (a.placement || 'Feed') === 'StoryReel').length;

  const placements = [
    { key: 'all', label: 'All Placements', count: ads.length, icon: '📋' },
    { key: 'Feed', label: 'Feed', count: feedCount, icon: '📰' },
    { key: 'StoryReel', label: 'Stories & Reels', count: storyReelCount, icon: '🎬' },
  ];

  return (
    <div className="sidebar">
      {/* Brand */}
      <div className="sidebar__brand">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="campaign-badge" style={{ width: 32, height: 32, fontSize: 12 }}>
            <span>PD</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#fff', letterSpacing: '-0.01em' }}>Campaign Boards</span>
        </Link>
      </div>

      {/* Campaign info */}
      <div style={{ padding: '0 20px' }}>
        <div className="sidebar__campaign-name">{campaign.name}</div>
        <div className="sidebar__campaign-meta">
          {campaign.project} · {campaign.budget}
        </div>
      </div>

      <div className="sidebar__divider" />

      {/* Placement filters */}
      <div style={{ padding: '0 12px' }}>
        <div className="sidebar__nav-label">Placements</div>
        {placements.map(p => (
          <div
            key={p.key}
            className={`sidebar__nav-item${activePlacement === p.key ? ' active' : ''}`}
            onClick={() => setActivePlacement(p.key)}
          >
            <span style={{ fontSize: 14 }}>{p.icon}</span>
            <span>{p.label}</span>
            <span className="sidebar__nav-count">{p.count}</span>
          </div>
        ))}
      </div>

      <div className="sidebar__divider" />

      {/* Structure tree */}
      <div style={{ padding: '0 12px' }}>
        <div
          className="sidebar__nav-item"
          onClick={() => setStructureOpen(!structureOpen)}
          style={{ cursor: 'pointer' }}
        >
          <span style={{ fontSize: 14 }}>🗂️</span>
          <span>Campaign Structure</span>
          <span className={`structure-toggle-icon${structureOpen ? ' open' : ''}`} style={{ marginLeft: 'auto' }}>
            <ChevronDownIcon />
          </span>
        </div>
        {structureOpen && (
          <div style={{ padding: '8px 12px 4px 32px', animation: 'fadeIn .2s ease' }}>
            {adSets.map(as => (
              <div key={as.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12, color: 'rgba(255,255,255,.6)' }}>
                <span className="structure-dot" style={{ background: tierColor(as.tier), width: 7, height: 7 }}></span>
                <span style={{ color: 'rgba(255,255,255,.8)' }}>{as.name}</span>
                <span style={{ marginLeft: 'auto', opacity: .5, fontSize: 11 }}>{as.ads.length}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sidebar__divider" />

      {/* View toggle */}
      <div style={{ padding: '0 12px' }}>
        <div className="sidebar__nav-label">View Mode</div>
        <div
          className={`sidebar__nav-item${view === 'internal' ? ' active' : ''}`}
          onClick={() => setView('internal')}
        >
          <span style={{ fontSize: 14 }}>🔧</span>
          <span>Internal</span>
        </div>
        <div
          className={`sidebar__nav-item${view === 'client' ? ' active' : ''}`}
          onClick={() => setView('client')}
        >
          <span style={{ fontSize: 14 }}>👁️</span>
          <span>Client Preview</span>
        </div>
      </div>

      <div className="sidebar__divider" />

      {/* Theme toggle */}
      <div style={{ padding: '0 12px' }}>
        <div className="sidebar__nav-label">Theme</div>
        <div
          className={`sidebar__nav-item${theme === 'light' ? ' active' : ''}`}
          onClick={() => setTheme('light')}
        >
          <span style={{ fontSize: 14 }}>☀️</span>
          <span>Light</span>
        </div>
        <div
          className={`sidebar__nav-item${theme === 'dark' ? ' active' : ''}`}
          onClick={() => setTheme('dark')}
        >
          <span style={{ fontSize: 14 }}>🌙</span>
          <span>Dark</span>
        </div>
      </div>

      {/* Footer actions */}
      <div className="sidebar__footer">
        {modifiedCount > 0 && (
          <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 8, textAlign: 'center' }}>
            {modifiedCount} ad{modifiedCount > 1 ? 's' : ''} modified
          </div>
        )}
        <button
          className="export-btn"
          onClick={onExport}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export Copy
          {modifiedCount > 0 && <span className="export-badge">{modifiedCount}</span>}
        </button>
      </div>
    </div>
  );
}
