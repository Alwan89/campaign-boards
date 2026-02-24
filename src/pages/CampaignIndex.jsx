import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/* Color palette for project avatars based on first letter */
const avatarColors = [
  '#6B2D8B', '#2563eb', '#059669', '#d97706', '#dc2626',
  '#7c3aed', '#0891b2', '#4f46e5', '#be123c', '#15803d',
];

function getAvatarColor(name) {
  const code = (name || 'A').charCodeAt(0);
  return avatarColors[code % avatarColors.length];
}

export default function CampaignIndex() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Campaign Boards — Periphery Digital';
    const basePath = import.meta.env.BASE_URL;
    fetch(`${basePath}campaigns/index.json`)
      .then(res => res.ok ? res.json() : [])
      .then(staticCampaigns => {
        // Merge with locally-built campaigns from localStorage
        let localIndex = [];
        try {
          const raw = localStorage.getItem('campaigns:index');
          if (raw) localIndex = JSON.parse(raw);
        } catch (e) { /* ignore */ }

        // Local campaigns appear first; skip dupes already in static
        const staticSlugs = new Set(staticCampaigns.map(c => c.slug));
        const localOnly = localIndex.filter(c => !staticSlugs.has(c.slug));
        const merged = [...localOnly, ...staticCampaigns];

        setCampaigns(merged);
        setLoading(false);
      })
      .catch(() => {
        // Even if static fetch fails, show local campaigns
        try {
          const raw = localStorage.getItem('campaigns:index');
          if (raw) setCampaigns(JSON.parse(raw));
        } catch (e) { /* ignore */ }
        setLoading(false);
      });
  }, []);

  return (
    <div style={{
      maxWidth: 900,
      margin: '0 auto',
      padding: '48px 20px',
      animation: 'fadeIn .4s ease',
    }}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:8}}>
        <div className="campaign-badge" style={{width:52,height:52,fontSize:20}}>
          <span>PD</span>
        </div>
        <div style={{flex:1}}>
          <h1 style={{fontSize:26,fontWeight:700,margin:0,color:'var(--text-primary)',letterSpacing:'-0.01em'}}>
            Campaign Boards
          </h1>
          <p style={{fontSize:14,color:'var(--text-secondary)',margin:'3px 0 0'}}>
            Select a campaign to view its ad board
          </p>
        </div>
        <Link to="/new" className="builder-nav-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Campaign
        </Link>
      </div>

      <div style={{
        width:60,
        height:3,
        background:'var(--periphery-gradient, var(--periphery))',
        borderRadius:3,
        marginBottom:36,
        marginTop:16,
      }}></div>

      {loading ? (
        /* Skeleton loading cards */
        <div className="campaign-grid">
          {[1,2,3,4].map(i => (
            <div key={i} style={{
              background:'var(--bg-surface)',
              borderRadius:'var(--radius-lg)',
              padding:'20px 22px',
              boxShadow:'var(--shadow-sm)',
            }}>
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                <div className="skeleton" style={{width:42,height:42,borderRadius:'50%'}}></div>
                <div style={{flex:1}}>
                  <div className="skeleton" style={{width:'70%',height:14,borderRadius:6,marginBottom:8}}></div>
                  <div className="skeleton" style={{width:'45%',height:10,borderRadius:6}}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div style={{
          textAlign:'center',
          padding:'48px 20px',
          color:'var(--text-secondary)',
          fontSize:14,
          background:'var(--bg-subtle)',
          borderRadius:'var(--radius-lg)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom:12,opacity:.5}}>
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </svg>
          <p style={{margin:0}}>No campaigns found.</p>
          <p style={{margin:'4px 0 0',fontSize:12,opacity:.7}}>Click "New Campaign" to build one from a Google Sheet &amp; Drive folder.</p>
        </div>
      ) : (
        <div className="campaign-grid">
          {campaigns.map(c => {
            const initial = (c.project || c.name || 'C').charAt(0).toUpperCase();
            const color = getAvatarColor(c.project || c.name);

            return (
              <Link
                key={c.slug}
                to={`/${c.slug}`}
                className="campaign-card"
              >
                <div className="campaign-card-avatar" style={{background:color}}>
                  {initial}
                </div>
                <div className="campaign-card-info">
                  <div className="campaign-card-title">{c.project || c.name}</div>
                  <div className="campaign-card-meta">
                    <span>{c.client}</span>
                    <span style={{opacity:.4}}>·</span>
                    <span>{c.date}</span>
                    {c.status === 'active' && (
                      <span className="status-badge active">Active</span>
                    )}
                    {c.status === 'draft' && (
                      <span className="status-badge draft">Draft</span>
                    )}
                    {c.status === 'complete' && (
                      <span className="status-badge complete">Complete</span>
                    )}
                  </div>
                </div>
                <div className="campaign-card-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9,18 15,12 9,6"/>
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div style={{
        textAlign:'center',
        fontSize:12,
        color:'var(--text-secondary)',
        marginTop:48,
        opacity:.5,
      }}>
        Periphery Digital · Campaign Boards
      </div>
    </div>
  );
}
