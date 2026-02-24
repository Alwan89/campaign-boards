import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { initGoogleAuth, requestAccessToken, isSignedIn, signOut } from '../utils/googleAuth';
import { parseCopyFromSheet } from '../utils/sheetsReader';
import { buildFileIdMap } from '../utils/driveScanner';
import { assemble } from '../utils/assembleData';

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

/* ── Build Steps Config ── */
const BUILD_STEPS = [
  { key: 'auth', label: 'Authenticating with Google' },
  { key: 'sheets', label: 'Reading ad copy from Google Sheet' },
  { key: 'drive', label: 'Scanning Drive folder for creatives' },
  { key: 'assemble', label: 'Assembling campaign data' },
  { key: 'save', label: 'Saving campaign' },
];

export default function CampaignBuilder() {
  const navigate = useNavigate();

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

  /* ── Build state ── */
  const [building, setBuilding] = useState(false);
  const [buildStep, setBuildStep] = useState(null); // current step key
  const [buildProgress, setBuildProgress] = useState(''); // detail message
  const [buildError, setBuildError] = useState(null);
  const [buildReport, setBuildReport] = useState(null);

  /* ── Auth state ── */
  const [googleReady, setGoogleReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const progressRef = useRef(null);

  /* ── Extracted IDs ── */
  const sheetId = extractSheetId(sheetUrl);
  const driveId = extractDriveId(driveUrl);
  const slug = toSlug(campaignName);
  const canBuild = sheetId && driveId && campaignName && slug && !building;

  /* ── Initialize Google Identity Services ── */
  useEffect(() => {
    let timer;
    function tryInit() {
      if (window.google?.accounts?.oauth2) {
        initGoogleAuth()
          .then(() => {
            setGoogleReady(true);
            setSignedIn(isSignedIn());
          })
          .catch(err => console.warn('Google auth init failed:', err));
      } else {
        // GIS script may still be loading — retry
        timer = setTimeout(tryInit, 500);
      }
    }
    tryInit();
    return () => clearTimeout(timer);
  }, []);

  /* ── Build Campaign ── */
  async function handleBuild() {
    setBuilding(true);
    setBuildError(null);
    setBuildReport(null);
    setBuildStep('auth');
    setBuildProgress('');

    try {
      // 1. Auth
      setBuildProgress('Requesting Google access…');
      await requestAccessToken();
      setSignedIn(true);

      // 2. Read Sheet
      setBuildStep('sheets');
      const copyData = await parseCopyFromSheet(
        sheetId,
        sheetTab || null,
        msg => setBuildProgress(msg),
      );

      // 3. Scan Drive
      setBuildStep('drive');
      const fileMap = await buildFileIdMap(
        driveId,
        msg => setBuildProgress(msg),
      );

      console.log('[Builder] Sheet copy groups:', Object.keys(copyData.meta_ads || {}));
      console.log('[Builder] Drive files found:', Object.keys(fileMap).length, Object.keys(fileMap));

      const fileCount = Object.keys(fileMap).length;
      if (fileCount === 0) {
        setBuildProgress('Drive scan complete — 0 creative files found. Check the folder URL or try signing out and back in to re-grant Drive access.');
      } else {
        setBuildProgress(`Drive scan complete — ${fileCount} creative file${fileCount !== 1 ? 's' : ''} found.`);
      }

      // 4. Assemble
      setBuildStep('assemble');
      setBuildProgress(`Assembling ${Object.keys(fileMap).length} files…`);
      const campaignConfig = {
        name: campaignName,
        project: projectName || copyData.project_name || '',
        developer: developer,
        objective: objective,
        budget: budget,
        languages: languages,
        housing_category: housing,
        landing_page: landingPage,
        sheet_id: sheetId,
        drive_folder_id: driveId,
      };

      const { data, report } = assemble(copyData, fileMap, campaignConfig, langCode);

      // 5. Save to localStorage
      setBuildStep('save');
      setBuildProgress('Saving campaign locally…');

      // Add slug + status metadata
      data.meta = {
        ...data.meta,
        slug,
        builtAt: new Date().toISOString(),
        source: 'browser-builder',
      };

      // Store campaign data
      const storageKey = `campaign:${slug}`;
      localStorage.setItem(storageKey, JSON.stringify(data));

      // Update local campaign index
      const indexRaw = localStorage.getItem('campaigns:index');
      const localIndex = indexRaw ? JSON.parse(indexRaw) : [];
      const existing = localIndex.findIndex(c => c.slug === slug);
      const indexEntry = {
        slug,
        name: campaignName,
        project: data.campaign.project,
        client: developer,
        date: campaignDate || new Date().toISOString().slice(0, 7),
        status: 'draft',
        source: 'local',
      };
      if (existing >= 0) {
        localIndex[existing] = indexEntry;
      } else {
        localIndex.push(indexEntry);
      }
      localStorage.setItem('campaigns:index', JSON.stringify(localIndex));

      setBuildReport(report);
      setBuildProgress('Done!');

      // Only auto-navigate if we actually got ads
      if (report.total_ads > 0) {
        setTimeout(() => {
          navigate(`/${slug}`);
        }, 3000);
      }

    } catch (err) {
      console.error('Build failed:', err);
      setBuildError(err.message || 'Unknown error');
    } finally {
      setBuilding(false);
    }
  }

  function handleSignOut() {
    signOut();
    setSignedIn(false);
  }

  function toggleLanguage(lang) {
    setLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  }

  // Scroll progress into view when build starts
  useEffect(() => {
    if (building && progressRef.current) {
      progressRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [building]);

  return (
    <div className="builder-page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div className="campaign-badge" style={{ width: 44, height: 44, fontSize: 16 }}>
            <span>PD</span>
          </div>
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            New Campaign
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
            Connect your Google Sheet &amp; Drive folder to build a campaign board
          </p>
        </div>
        {/* Auth status */}
        {googleReady && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: signedIn ? '#22c55e' : '#94a3b8',
            }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {signedIn ? 'Google connected' : 'Not signed in'}
            </span>
            {signedIn && (
              <button
                onClick={handleSignOut}
                style={{
                  fontSize: 11, color: 'var(--text-secondary)', background: 'none',
                  border: 'none', textDecoration: 'underline', cursor: 'pointer', padding: 0,
                }}
              >
                Sign out
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ width: 60, height: 3, background: 'var(--periphery-gradient, var(--periphery))', borderRadius: 3, marginBottom: 32, marginTop: 12 }}></div>

      {/* GIS not loaded warning */}
      {!googleReady && (
        <div style={{
          padding: '12px 16px', borderRadius: 8, marginBottom: 20,
          background: '#fef3c7', color: '#92400e', fontSize: 13,
        }}>
          Loading Google Identity Services…
        </div>
      )}

      {/* Section 1: Data Sources */}
      <div className="builder-section">
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
          Data Sources
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
            <div className="builder-id-badge">Sheet ID: {sheetId.slice(0, 20)}…</div>
          )}
          {sheetUrl && !sheetId && (
            <div className="builder-id-badge" style={{ background: '#fef2f2', color: '#dc2626' }}>
              Could not extract Sheet ID
            </div>
          )}
        </div>

        <div className="builder-field">
          <label className="builder-label">Google Drive Folder URL</label>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Paste the folder containing the creative files for <strong>this campaign</strong> (not the parent folder with all campaigns).
          </div>
          <input
            className="builder-input builder-input--mono"
            type="url"
            placeholder="https://drive.google.com/drive/folders/..."
            value={driveUrl}
            onChange={e => setDriveUrl(e.target.value)}
          />
          {driveId && (
            <div className="builder-id-badge">Folder ID: {driveId.slice(0, 20)}…</div>
          )}
          {driveUrl && !driveId && (
            <div className="builder-id-badge" style={{ background: '#fef2f2', color: '#dc2626' }}>
              Could not extract Folder ID
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
          Campaign Identity
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
          Settings
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
            <div className="builder-toggle" onClick={() => !building && setHousing(!housing)}>
              <div className={`builder-toggle__track${housing ? ' on' : ''}`}>
                <div className="builder-toggle__thumb" />
              </div>
              <span className="builder-toggle__label">
                {housing ? 'Enabled — Special Ad Category' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Build button */}
      <button
        className="builder-generate-btn"
        disabled={!canBuild || !googleReady}
        onClick={handleBuild}
      >
        {building ? (
          <>
            <svg className="builder-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 11-6.22-8.56" />
            </svg>
            Building…
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5,3 19,12 5,21" />
            </svg>
            Build Campaign
          </>
        )}
      </button>

      {/* Build Progress */}
      {(building || buildReport || buildError) && (
        <div className="builder-section" ref={progressRef} style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
            Build Progress
          </h2>

          <div className="builder-progress">
            {BUILD_STEPS.map(step => {
              const stepIdx = BUILD_STEPS.findIndex(s => s.key === step.key);
              const currentIdx = BUILD_STEPS.findIndex(s => s.key === buildStep);
              let status = 'pending';
              if (buildError && currentIdx === stepIdx) {
                status = 'error';
              } else if (currentIdx > stepIdx) {
                status = 'done';
              } else if (currentIdx === stepIdx) {
                status = building ? 'active' : (buildError ? 'error' : 'done');
              }

              return (
                <div key={step.key} className={`builder-progress__step ${status}`}>
                  <div className="builder-progress__icon">
                    {status === 'done' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                    )}
                    {status === 'active' && (
                      <svg className="builder-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 11-6.22-8.56" />
                      </svg>
                    )}
                    {status === 'error' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                    {status === 'pending' && (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', opacity: 0.3 }} />
                    )}
                  </div>
                  <span className="builder-progress__label">{step.label}</span>
                </div>
              );
            })}
          </div>

          {/* Detail message */}
          {buildProgress && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 12, fontStyle: 'italic' }}>
              {buildProgress}
            </div>
          )}

          {/* Error */}
          {buildError && (
            <div style={{
              marginTop: 16, padding: '12px 16px', borderRadius: 8,
              background: '#fef2f2', color: '#dc2626', fontSize: 13,
              border: '1px solid #fecaca',
            }}>
              <strong>Build failed:</strong> {buildError}
            </div>
          )}

          {/* Report */}
          {buildReport && !buildError && (
            <div style={{
              marginTop: 16, padding: '12px 16px', borderRadius: 8,
              background: buildReport.total_files > 0 ? '#f0fdf4' : '#fefce8',
              color: buildReport.total_files > 0 ? '#166534' : '#854d0e',
              fontSize: 13,
              border: `1px solid ${buildReport.total_files > 0 ? '#bbf7d0' : '#fde68a'}`,
            }}>
              <strong>Build complete!</strong> {buildReport.total_ads} ads across {buildReport.total_ad_sets} ad sets from {buildReport.total_files} creative files.
              {buildReport.total_files === 0 && (
                <div style={{ marginTop: 6, fontSize: 12 }}>
                  No creative files found in the Drive folder. Make sure the folder contains image files (jpg, png, gif, webp) or videos (mp4, mov). The scanner checks all subfolders.
                  <div style={{ marginTop: 8 }}>
                    <button
                      onClick={() => { handleSignOut(); setBuildReport(null); setBuildStep(null); }}
                      style={{
                        fontSize: 12, fontWeight: 600, color: '#854d0e', background: '#fef3c7',
                        border: '1px solid #fde68a', borderRadius: 6, padding: '5px 12px',
                        cursor: 'pointer',
                      }}
                    >
                      Sign out &amp; retry with fresh permissions
                    </button>
                  </div>
                </div>
              )}
              {buildReport.unmatched_ads?.length > 0 && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#854d0e' }}>
                  Unmatched ad groups: {buildReport.unmatched_ads.join(', ')}
                </div>
              )}
              {buildReport.total_ads > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, fontStyle: 'italic' }}>
                  Redirecting to campaign board…
                </div>
              )}
              {buildReport.total_ads === 0 && (
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  <Link to={`/${slug}`} style={{ color: 'inherit', fontWeight: 600 }}>
                    View campaign board anyway →
                  </Link>
                </div>
              )}
            </div>
          )}
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
