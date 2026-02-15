import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';

/* ── Helpers ── */
function extractSheetId(url) {
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function extractDriveId(url) {
  const m = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const OBJECTIVES = [
  'Lead Generation', 'Traffic', 'Conversions', 'Brand Awareness',
  'Engagement', 'App Installs', 'Video Views', 'Messages',
];

const LANGUAGES = ['EN', 'ZH_S', 'ZH_T', 'KR', 'FA'];

export default function CampaignBuilder() {
  /* ── Form state ── */
  const [sheetUrl, setSheetUrl] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [developer, setDeveloper] = useState('');
  const [objective, setObjective] = useState('Lead Generation');
  const [budget, setBudget] = useState('');
  const [languages, setLanguages] = useState(['EN']);
  const [landingPage, setLandingPage] = useState('');
  const [housing, setHousing] = useState(false);
  const [campaignDate, setCampaignDate] = useState('');
  const [langCode, setLangCode] = useState('en');
  const [sheetTab, setSheetTab] = useState('');
  const [dryRun, setDryRun] = useState(false);

  const [copied, setCopied] = useState(false);
  const outputRef = useRef(null);

  /* ── Extracted IDs ── */
  const sheetId = extractSheetId(sheetUrl);
  const driveId = extractDriveId(driveUrl);
  const slug = toSlug(campaignName);

  /* ── Generate CLI command ── */
  const canGenerate = sheetId && driveId && campaignName && slug;

  function buildCommand() {
    const parts = ['python -m scripts.build_campaign'];
    // Required
    parts.push(`  --sheet-id "${sheetId}"`);
    parts.push(`  --drive-folder-id "${driveId}"`);
    parts.push(`  --slug "${slug}"`);
    parts.push(`  --name "${campaignName}"`);
    // Optional metadata
    if (projectName) parts.push(`  --project "${projectName}"`);
    if (developer) parts.push(`  --developer "${developer}"`);
    if (objective) parts.push(`  --objective "${objective}"`);
    if (budget) parts.push(`  --budget "${budget}"`);
    if (languages.length > 0) parts.push(`  --languages ${languages.join(' ')}`);
    if (landingPage) parts.push(`  --landing-page "${landingPage}"`);
    if (housing) parts.push('  --housing-category');
    if (campaignDate) parts.push(`  --date "${campaignDate}"`);
    // Options
    if (langCode && langCode !== 'en') parts.push(`  --lang "${langCode}"`);
    if (sheetTab) parts.push(`  --tab "${sheetTab}"`);
    if (dryRun) parts.push('  --dry-run');
    return parts.join(' \\\n');
  }

  const command = canGenerate ? buildCommand() : '';

  function handleCopy() {
    navigator.clipboard.writeText(command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function toggleLanguage(lang) {
    setLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  }

  return (
    <div className="builder-page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div className="campaign-badge" style={{ width: 44, height: 44, fontSize: 16 }}>
            <span>PD</span>
          </div>
        </Link>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            New Campaign
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
            Generate a build command from your Google Sheet &amp; Drive folder
          </p>
        </div>
      </div>

      <div style={{ width: 60, height: 3, background: 'var(--periphery-gradient, var(--periphery))', borderRadius: 3, marginBottom: 32, marginTop: 12 }}></div>

      {/* Section 1: Data Sources */}
      <div className="builder-section">
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
          📊 Data Sources
        </h2>

        <div className="builder-field">
          <label className="builder-label">Google Sheet URL</label>
          <input
            className="builder-input builder-input--mono"
            type="url"
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={sheetUrl}
            onChange={e => setSheetUrl(e.target.value)}
          />
          {sheetId && (
            <div className="builder-id-badge">✓ Sheet ID: {sheetId.slice(0, 20)}…</div>
          )}
          {sheetUrl && !sheetId && (
            <div className="builder-id-badge" style={{ background: '#fef2f2', color: '#dc2626' }}>
              ✗ Could not extract Sheet ID
            </div>
          )}
        </div>

        <div className="builder-field">
          <label className="builder-label">Google Drive Folder URL</label>
          <input
            className="builder-input builder-input--mono"
            type="url"
            placeholder="https://drive.google.com/drive/folders/..."
            value={driveUrl}
            onChange={e => setDriveUrl(e.target.value)}
          />
          {driveId && (
            <div className="builder-id-badge">✓ Folder ID: {driveId.slice(0, 20)}…</div>
          )}
          {driveUrl && !driveId && (
            <div className="builder-id-badge" style={{ background: '#fef2f2', color: '#dc2626' }}>
              ✗ Could not extract Folder ID
            </div>
          )}
        </div>

        <div className="builder-field">
          <label className="builder-label">Sheet Tab Name <span style={{fontWeight:400,color:'var(--text-secondary)'}}>(optional — reads first tab if blank)</span></label>
          <input
            className="builder-input"
            type="text"
            placeholder="e.g. Feed Copy"
            value={sheetTab}
            onChange={e => setSheetTab(e.target.value)}
          />
        </div>
      </div>

      {/* Section 2: Campaign Identity */}
      <div className="builder-section">
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
          🏷️ Campaign Identity
        </h2>

        <div className="builder-field">
          <label className="builder-label">Campaign Name *</label>
          <input
            className="builder-input"
            type="text"
            placeholder="e.g. The Edgemont Collection — Feb 2026"
            value={campaignName}
            onChange={e => setCampaignName(e.target.value)}
          />
          {slug && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              Slug: <code style={{ background: 'var(--bg-subtle)', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>{slug}</code>
            </div>
          )}
        </div>

        <div className="builder-row">
          <div className="builder-field" style={{ flex: 1 }}>
            <label className="builder-label">Project Name</label>
            <input
              className="builder-input"
              type="text"
              placeholder="e.g. The Edgemont Collection"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
            />
          </div>
          <div className="builder-field" style={{ flex: 1 }}>
            <label className="builder-label">Developer / Client</label>
            <input
              className="builder-input"
              type="text"
              placeholder="e.g. Intracorp Developments"
              value={developer}
              onChange={e => setDeveloper(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Section 3: Settings */}
      <div className="builder-section">
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
          ⚙️ Settings
        </h2>

        <div className="builder-row">
          <div className="builder-field" style={{ flex: 1 }}>
            <label className="builder-label">Objective</label>
            <select
              className="builder-select"
              value={objective}
              onChange={e => setObjective(e.target.value)}
            >
              {OBJECTIVES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="builder-field" style={{ flex: 1 }}>
            <label className="builder-label">Budget</label>
            <input
              className="builder-input"
              type="text"
              placeholder="e.g. $5,000/mo"
              value={budget}
              onChange={e => setBudget(e.target.value)}
            />
          </div>
        </div>

        <div className="builder-field">
          <label className="builder-label">Languages</label>
          <div className="builder-chips">
            {LANGUAGES.map(lang => (
              <button
                key={lang}
                className={`builder-chip${languages.includes(lang) ? ' selected' : ''}`}
                onClick={() => toggleLanguage(lang)}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div className="builder-field">
          <label className="builder-label">Landing Page</label>
          <input
            className="builder-input builder-input--mono"
            type="url"
            placeholder="https://example.com/project"
            value={landingPage}
            onChange={e => setLandingPage(e.target.value)}
          />
        </div>

        <div className="builder-row">
          <div className="builder-field" style={{ flex: 1 }}>
            <label className="builder-label">Campaign Date</label>
            <input
              className="builder-input"
              type="text"
              placeholder="e.g. 2026-02"
              value={campaignDate}
              onChange={e => setCampaignDate(e.target.value)}
            />
          </div>
          <div className="builder-field" style={{ flex: 1 }}>
            <label className="builder-label">Copy Language Code</label>
            <select
              className="builder-select"
              value={langCode}
              onChange={e => setLangCode(e.target.value)}
            >
              <option value="en">en (English)</option>
              <option value="zh_s">zh_s (Simplified Chinese)</option>
              <option value="zh_t">zh_t (Traditional Chinese)</option>
              <option value="kr">kr (Korean)</option>
              <option value="fa">fa (Farsi)</option>
            </select>
          </div>
        </div>

        <div className="builder-row" style={{ alignItems: 'center' }}>
          <div className="builder-field" style={{ flex: 1 }}>
            <label className="builder-label">Housing Category</label>
            <div className="builder-toggle" onClick={() => setHousing(!housing)}>
              <div className={`builder-toggle__track${housing ? ' on' : ''}`}>
                <div className="builder-toggle__thumb" />
              </div>
              <span className="builder-toggle__label">
                {housing ? 'Enabled — Special Ad Category' : 'Disabled'}
              </span>
            </div>
          </div>
          <div className="builder-field" style={{ flex: 1 }}>
            <label className="builder-label">Dry Run</label>
            <div className="builder-toggle" onClick={() => setDryRun(!dryRun)}>
              <div className={`builder-toggle__track${dryRun ? ' on' : ''}`}>
                <div className="builder-toggle__thumb" />
              </div>
              <span className="builder-toggle__label">
                {dryRun ? 'Enabled — preview only, no files written' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Generate button */}
      <button
        className="builder-generate-btn"
        disabled={!canGenerate}
        onClick={() => {
          if (outputRef.current) {
            outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }}
      >
        Generate Build Command
      </button>

      {/* Output */}
      {canGenerate && (
        <div className="builder-section" ref={outputRef} style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
            🖥️ Build Command
          </h2>
          <div className="builder-output">
            <div className="builder-output__header">
              <span className="builder-output__title">Terminal</span>
              <button className={`builder-copy-btn${copied ? ' copied' : ''}`} onClick={handleCopy}>
                {copied ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre>{command}</pre>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 12 }}>
            Run this command in the <code style={{ background: 'var(--bg-subtle)', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>campaign-boards</code> project root.
            Make sure you have Google Cloud credentials configured and the venv activated.
          </p>
        </div>
      )}

      {/* Back link */}
      <div style={{ textAlign: 'center', marginTop: 32, paddingBottom: 20 }}>
        <Link to="/" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          ← Back to Campaigns
        </Link>
      </div>
    </div>
  );
}
