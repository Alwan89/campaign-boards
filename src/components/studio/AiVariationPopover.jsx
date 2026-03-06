import { useState, useEffect, useRef } from 'react';
import { generateVariations, hasApiKey } from '../../utils/claudeApi';

/**
 * Popover showing AI-generated copy variations.
 * Appears when clicking the sparkle button on CopyField.
 */
export default function AiVariationPopover({
  fieldType,
  currentValue,
  charLimit,
  projectName,
  developer,
  objective,
  language,
  platform,
  onSelect,
  onClose,
  onNeedApiKey,
}) {
  const [variations, setVariations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (!hasApiKey()) {
      onNeedApiKey?.();
      onClose();
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const results = await generateVariations({
          fieldType,
          currentValue,
          charLimit,
          projectName,
          developer,
          objective,
          language,
          platform,
          count: 3,
        });
        if (!cancelled) {
          setVariations(results);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Close on click outside
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: 4,
        width: 360,
        maxWidth: '90vw',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border, rgba(0,0,0,.1))',
        borderRadius: 12,
        boxShadow: 'var(--shadow-lg)',
        zIndex: 100,
        animation: 'fadeIn .15s ease',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border, rgba(0,0,0,.06))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
          AI Variations
        </span>
        <button
          onClick={onClose}
          style={{
            border: 'none', background: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', padding: 2,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '8px 6px', maxHeight: 300, overflowY: 'auto' }}>
        {loading && (
          <div style={{
            padding: '20px 14px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: 13,
          }}>
            <div style={{
              width: 20, height: 20, border: '2px solid var(--border, rgba(0,0,0,.1))',
              borderTopColor: 'var(--periphery)', borderRadius: '50%',
              animation: 'spin .8s linear infinite',
              margin: '0 auto 10px',
            }} />
            Generating variations...
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px 14px', color: '#dc2626', fontSize: 13,
            background: '#fef2f2', borderRadius: 8, margin: '4px 8px',
          }}>
            {error}
          </div>
        )}

        {!loading && !error && variations.map((v, i) => (
          <button
            key={i}
            onClick={() => {
              onSelect(v);
              onClose();
            }}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '10px 14px',
              margin: '2px 0',
              background: 'transparent',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              lineHeight: 1.5,
              color: 'var(--text-primary)',
              transition: 'background .1s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{
              fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)',
              marginRight: 8, verticalAlign: 'middle',
            }}>
              {i + 1}
            </span>
            {v}
            {charLimit && (
              <span style={{
                fontSize: 10,
                color: v.length > charLimit ? '#dc2626' : 'var(--text-tertiary, var(--text-secondary))',
                marginLeft: 8,
              }}>
                {v.length}/{charLimit}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
