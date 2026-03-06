import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loadStudioIndex, deleteStudioProject } from '../hooks/useAutoSave';

const avatarColors = [
  '#6B2D8B', '#2563eb', '#059669', '#d97706', '#dc2626',
  '#7c3aed', '#0891b2', '#4f46e5', '#be123c', '#15803d',
];

function getAvatarColor(name) {
  const code = (name || 'S').charCodeAt(0);
  return avatarColors[code % avatarColors.length];
}

export default function StudioIndex() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    document.title = 'Copy Studio — Periphery Digital';
    setProjects(loadStudioIndex());
  }, []);

  function handleDelete(slug) {
    if (!confirm(`Delete "${slug}"? This cannot be undone.`)) return;
    deleteStudioProject(slug);
    setProjects(loadStudioIndex());
  }

  return (
    <div style={{
      maxWidth: 900,
      margin: '0 auto',
      padding: '48px 20px',
      animation: 'fadeIn .4s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div className="campaign-badge" style={{ width: 52, height: 52, fontSize: 20 }}>
            <span>CS</span>
          </div>
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Copy Studio
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
            Write ad copy with live preview mockups
          </p>
        </div>
        <Link to="/studio/new" className="builder-nav-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Project
        </Link>
      </div>

      <div style={{
        width: 60, height: 3,
        background: 'var(--periphery-gradient, var(--periphery))',
        borderRadius: 3, marginBottom: 36, marginTop: 16,
      }}></div>

      {projects.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 20px',
          color: 'var(--text-secondary)', fontSize: 14,
          background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12, opacity: .5 }}>
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          <p style={{ margin: 0 }}>No copy projects yet.</p>
          <p style={{ margin: '4px 0 0', fontSize: 12, opacity: .7 }}>
            Click "New Project" to start writing ad copy with live previews.
          </p>
        </div>
      ) : (
        <div className="campaign-grid">
          {projects.map(p => {
            const initial = (p.projectName || p.name || 'S').charAt(0).toUpperCase();
            const color = getAvatarColor(p.projectName || p.name);
            const updated = p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '';

            return (
              <div key={p.slug} className="campaign-card" style={{ position: 'relative' }}>
                <Link to={`/studio/${p.slug}`} style={{
                  display: 'flex', alignItems: 'center', gap: 14, flex: 1,
                  textDecoration: 'none', color: 'inherit',
                }}>
                  <div className="campaign-card-avatar" style={{ background: color }}>
                    {initial}
                  </div>
                  <div className="campaign-card-info">
                    <div className="campaign-card-title">{p.projectName || p.name}</div>
                    <div className="campaign-card-meta">
                      {p.developer && <span>{p.developer}</span>}
                      {updated && (
                        <>
                          {p.developer && <span style={{ opacity: .4 }}>·</span>}
                          <span>{updated}</span>
                        </>
                      )}
                      <span className="status-badge draft">Draft</span>
                    </div>
                  </div>
                </Link>
                <button
                  className="studio-delete-btn"
                  onClick={() => handleDelete(p.slug)}
                  title="Delete project"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer with link back */}
      <div style={{ textAlign: 'center', marginTop: 48 }}>
        <Link to="/" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          ← Back to Campaign Boards
        </Link>
      </div>
    </div>
  );
}
