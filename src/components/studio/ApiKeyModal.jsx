import { useState } from 'react';
import { getApiKey, setApiKey } from '../../utils/claudeApi';

/**
 * Modal for entering the Anthropic API key. Stores in localStorage.
 */
export default function ApiKeyModal({ onClose, onSaved }) {
  const [key, setKey] = useState(getApiKey());

  function handleSave() {
    if (key.trim()) {
      setApiKey(key.trim());
      onSaved?.();
      onClose();
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,.4)', animation: 'fadeIn .15s ease',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-surface)', borderRadius: 14, padding: 28,
        width: 420, maxWidth: '90vw', boxShadow: 'var(--shadow-lg)',
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
          Anthropic API Key
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>
          Enter your API key to enable AI copy generation. The key is stored locally in your browser only.
        </p>

        <input
          type="password"
          className="studio-copy-input"
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="sk-ant-api03-..."
          autoFocus
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          style={{ marginBottom: 16 }}
        />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            className="studio-action-btn"
            onClick={onClose}
            style={{ padding: '8px 16px', fontSize: 13 }}
          >
            Cancel
          </button>
          <button
            className="studio-action-btn studio-action-btn--primary"
            onClick={handleSave}
            disabled={!key.trim()}
            style={{ padding: '8px 20px', fontSize: 13 }}
          >
            Save Key
          </button>
        </div>
      </div>
    </div>
  );
}
