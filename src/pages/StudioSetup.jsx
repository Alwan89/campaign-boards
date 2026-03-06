import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createInitialState } from '../hooks/useStudioState';
import {
  parseBriefText, importJsonToState, importParsedSheetToState,
  extractSheetId, extractDriveFolderId,
} from '../utils/studioImport';
import { initGoogleAuth, requestAccessToken, isSignedIn } from '../utils/googleAuth';
import { parseCopyFromSheet } from '../utils/sheetsReader';
import { buildFileIdMap } from '../utils/driveScanner';

const OBJECTIVES = [
  'Lead Generation', 'Traffic', 'Conversions', 'Brand Awareness',
  'Engagement', 'App Installs', 'Video Views', 'Messages',
];

const ALL_LANGUAGES = [
  { key: 'en', label: 'EN' },
  { key: 'zh_s', label: 'ZH-S' },
  { key: 'zh_t', label: 'ZH-T' },
  { key: 'kr', label: 'KR' },
  { key: 'fa', label: 'FA' },
];

function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export default function StudioSetup() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [name, setName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [developer, setDeveloper] = useState('');
  const [objective, setObjective] = useState('Lead Generation');
  const [budget, setBudget] = useState('');
  const [languages, setLanguages] = useState(['en']);
  const [landingPage, setLandingPage] = useState('');
  const [housing, setHousing] = useState(true);
  const [pageName, setPageName] = useState('');

  // Import state
  const [importMode, setImportMode] = useState(null); // null | 'brief' | 'json'
  const [briefText, setBriefText] = useState('');
  const [importedState, setImportedState] = useState(null);
  const [importStatus, setImportStatus] = useState('');

  // Google sources
  const [sheetUrl, setSheetUrl] = useState('');
  const [driveFolderUrl, setDriveFolderUrl] = useState('');
  const [sheetLoading, setSheetLoading] = useState(false);
  const [driveLoading, setDriveLoading] = useState(false);
  const [sheetStatus, setSheetStatus] = useState('');
  const [driveStatus, setDriveStatus] = useState('');
  const [driveFiles, setDriveFiles] = useState(null); // file map from driveScanner

  const slug = toSlug(name);
  const canCreate = name && slug;

  const sheetId = extractSheetId(sheetUrl);
  const driveFolderId = extractDriveFolderId(driveFolderUrl);

  function toggleLanguage(key) {
    setLanguages(prev =>
      prev.includes(key) ? prev.filter(l => l !== key) : [...prev, key]
    );
  }

  // ── Google auth helper ──
  async function ensureGoogleAuth() {
    if (!isSignedIn()) {
      await initGoogleAuth();
      await requestAccessToken();
    }
  }

  // ── Import handlers ──
  function handleParseBrief() {
    if (!briefText.trim()) return;
    const parsed = parseBriefText(briefText);

    // Auto-fill form fields from parsed brief
    if (parsed.projectName && !projectName) setProjectName(parsed.projectName);
    if (parsed.developer && !developer) setDeveloper(parsed.developer);
    if (parsed.objective) setObjective(parsed.objective);
    if (parsed.budget && !budget) setBudget(parsed.budget);
    if (parsed.landingPage && !landingPage) setLandingPage(parsed.landingPage);
    if (parsed.languages) setLanguages(parsed.languages);
    if (parsed.pageName && !pageName) setPageName(parsed.pageName);

    // Auto-fill Google source URLs if found in brief
    if (parsed.sheetUrl && !sheetUrl) setSheetUrl(parsed.sheetUrl);
    if (parsed.driveFolderUrl && !driveFolderUrl) setDriveFolderUrl(parsed.driveFolderUrl);

    // Auto-set campaign name if empty
    if (!name && parsed.projectName) {
      setName(parsed.projectName);
    }

    const fields = Object.keys(parsed).filter(k => parsed[k]);
    const extras = [];
    if (parsed.sheetId) extras.push('copy sheet URL');
    if (parsed.driveFolderId) extras.push('creative folder URL');

    setImportStatus(`Extracted: ${fields.join(', ')}${extras.length ? ` (also found: ${extras.join(', ')})` : ''}`);
    setImportMode(null);
  }

  function handleJsonImport(jsonText) {
    try {
      const json = JSON.parse(jsonText);
      const imported = importJsonToState(json);
      if (!imported) {
        setImportStatus('Could not parse JSON — unrecognized format');
        return;
      }
      setImportedState(imported);

      const p = imported.project;
      if (p.projectName && !projectName) setProjectName(p.projectName);
      if (p.name && !name) setName(p.name);
      if (p.developer && !developer) setDeveloper(p.developer);
      if (p.objective) setObjective(p.objective);
      if (p.budget && !budget) setBudget(p.budget);
      if (p.landingPage && !landingPage) setLandingPage(p.landingPage);
      if (p.languages?.length) setLanguages(p.languages);
      if (p.pageName && !pageName) setPageName(p.pageName);

      setImportStatus('JSON imported — copy data pre-loaded. Review and start writing.');
      setImportMode(null);
    } catch {
      setImportStatus('Invalid JSON — please check the format');
    }
  }

  function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => handleJsonImport(evt.target.result);
    reader.readAsText(file);
    e.target.value = '';
  }

  // ── Google Sheet fetch ──
  async function handleFetchSheet() {
    if (!sheetId) return;
    setSheetLoading(true);
    setSheetStatus('Connecting to Google...');
    try {
      await ensureGoogleAuth();
      const sheetData = await parseCopyFromSheet(sheetId, null, setSheetStatus);

      const groups = Object.keys(sheetData.meta_ads || {});
      if (groups.length === 0) {
        setSheetStatus('No Meta Ads copy found in sheet. Check the sheet format.');
        setSheetLoading(false);
        return;
      }

      // Convert to studio state
      const imported = importParsedSheetToState(sheetData);
      setImportedState(imported);

      // Auto-fill project info from sheet
      if (sheetData.project_name && !projectName) setProjectName(sheetData.project_name);
      if (sheetData.project_name && !name) setName(sheetData.project_name);
      if (imported.project.languages?.length) setLanguages(imported.project.languages);

      setSheetStatus(`Imported ${groups.length} ad group${groups.length !== 1 ? 's' : ''}: ${groups.join(', ')}`);
    } catch (err) {
      setSheetStatus(`Error: ${err.message}`);
    }
    setSheetLoading(false);
  }

  // ── Google Drive folder scan ──
  async function handleScanDrive() {
    if (!driveFolderId) return;
    setDriveLoading(true);
    setDriveStatus('Connecting to Google...');
    try {
      await ensureGoogleAuth();
      const fileMap = await buildFileIdMap(driveFolderId, setDriveStatus);
      const fileCount = Object.keys(fileMap).length;
      setDriveFiles(fileMap);
      setDriveStatus(`Found ${fileCount} creative file${fileCount !== 1 ? 's' : ''}`);
    } catch (err) {
      setDriveStatus(`Error: ${err.message}`);
    }
    setDriveLoading(false);
  }

  function handleCreate() {
    if (!canCreate) return;

    let state;
    if (importedState) {
      state = { ...importedState };
    } else {
      state = createInitialState();
    }

    state.project = {
      ...state.project,
      name,
      projectName: projectName || name,
      developer,
      objective,
      budget,
      languages,
      landingPage,
      housing,
      pageName: pageName || projectName || name,
      slug,
    };

    // Attach Drive creative files to state if scanned
    if (driveFiles && Object.keys(driveFiles).length > 0) {
      const files = Object.entries(driveFiles).map(([filename, meta]) => ({
        id: `drive-${meta.file_id}`,
        filename,
        type: meta.is_video ? 'video' : 'image',
        url: meta.image_url,
        source: 'drive',
        width: 0,
        height: 0,
        placement: 'unassigned',
        driveId: meta.file_id,
      }));
      state.creatives = { files };
    }

    localStorage.setItem(`studio:${slug}`, JSON.stringify(state));

    const raw = localStorage.getItem('studio:index');
    const index = raw ? JSON.parse(raw) : [];
    index.unshift({
      slug,
      name,
      projectName: projectName || name,
      developer,
      updatedAt: new Date().toISOString(),
    });
    localStorage.setItem('studio:index', JSON.stringify(index));

    navigate(`/studio/${slug}`);
  }

  return (
    <div className="builder-page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <Link to="/studio" style={{ textDecoration: 'none' }}>
          <div className="campaign-badge" style={{ width: 44, height: 44, fontSize: 16 }}>
            <span>CS</span>
          </div>
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            New Copy Project
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
            Set up campaign identity, then start writing copy
          </p>
        </div>
      </div>

      <div style={{ width: 60, height: 3, background: 'var(--periphery-gradient, var(--periphery))', borderRadius: 3, marginBottom: 32, marginTop: 12 }}></div>

      {/* ── Import Options ── */}
      <div className="builder-section">
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: 'var(--text-primary)' }}>
          Import Data
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
          Pre-fill from an AI-generated brief, agent output, or start blank
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <button
            className={`builder-chip${importMode === 'brief' ? ' selected' : ''}`}
            onClick={() => setImportMode(importMode === 'brief' ? null : 'brief')}
            style={{ padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle' }}>
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Paste Brief
          </button>
          <button
            className={`builder-chip${importMode === 'json' ? ' selected' : ''}`}
            onClick={() => setImportMode(importMode === 'json' ? null : 'json')}
            style={{ padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle' }}>
              <polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/>
            </svg>
            Import JSON
          </button>
          <button
            className="builder-chip"
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle' }}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Upload File
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileImport}
            />
          </button>
        </div>

        {/* Brief paste panel */}
        {importMode === 'brief' && (
          <div style={{ marginBottom: 16, animation: 'fadeIn .2s ease' }}>
            <textarea
              className="builder-input"
              rows={10}
              placeholder={`Paste the campaign brief here. Example:\n\nProject: The Edgemont Collection\nDeveloper: Intracorp Developments\nObjective: Lead Generation\nBudget: $5,000/mo\nLanguages: EN, ZH-S, ZH-T\nLanding Page: https://edgemont.ca\nPage Name: The Edgemont Collection\nCopy Sheet: https://docs.google.com/spreadsheets/d/1abc.../edit\nCreatives: https://drive.google.com/drive/folders/1xyz...`}
              value={briefText}
              onChange={e => setBriefText(e.target.value)}
              style={{ fontFamily: 'inherit', minHeight: 180 }}
            />
            <button
              className="builder-chip selected"
              onClick={handleParseBrief}
              disabled={!briefText.trim()}
              style={{ marginTop: 8, padding: '8px 20px', fontSize: 13, cursor: briefText.trim() ? 'pointer' : 'default' }}
            >
              Parse Brief
            </button>
          </div>
        )}

        {/* JSON import panel */}
        {importMode === 'json' && (
          <div style={{ marginBottom: 16, animation: 'fadeIn .2s ease' }}>
            <textarea
              className="builder-input"
              rows={8}
              placeholder={`Paste JSON from copy-generator agent output or data.json:\n\n{\n  "project": { "projectName": "..." },\n  "meta": { "single-image": { "text": { "en": "..." } } }\n}`}
              onChange={e => {
                if (e.target.value.trim().startsWith('{')) {
                  try {
                    JSON.parse(e.target.value);
                    handleJsonImport(e.target.value);
                  } catch { /* wait for complete JSON */ }
                }
              }}
              style={{ fontFamily: 'monospace', fontSize: 12, minHeight: 160 }}
            />
          </div>
        )}

        {/* Import status */}
        {importStatus && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: 16,
            background: importStatus.includes('Invalid') || importStatus.includes('Could not')
              ? '#fef2f2' : 'rgba(107, 45, 139, .06)',
            color: importStatus.includes('Invalid') || importStatus.includes('Could not')
              ? '#dc2626' : 'var(--periphery)',
            fontSize: 13, fontWeight: 500,
          }}>
            {importStatus}
          </div>
        )}
      </div>

      {/* ── Google Sources ── */}
      <div className="builder-section">
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: 'var(--text-primary)' }}>
          Google Drive Sources
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
          Link the copy sheet and creative folder — Studio will pull the data automatically
        </p>

        {/* Copy sheet URL */}
        <div className="builder-field">
          <label className="builder-label">Copy Sheet URL</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="builder-input builder-input--mono"
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetUrl}
              onChange={e => setSheetUrl(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              className="builder-chip selected"
              onClick={handleFetchSheet}
              disabled={!sheetId || sheetLoading}
              style={{
                padding: '8px 16px', fontSize: 13, whiteSpace: 'nowrap',
                cursor: sheetId && !sheetLoading ? 'pointer' : 'default',
                opacity: sheetId ? 1 : 0.5,
              }}
            >
              {sheetLoading ? 'Fetching...' : 'Fetch Copy'}
            </button>
          </div>
          {sheetStatus && (
            <div style={{
              fontSize: 12, marginTop: 6,
              color: sheetStatus.includes('Error') ? '#dc2626' : 'var(--periphery)',
            }}>
              {sheetStatus}
            </div>
          )}
          {!sheetId && sheetUrl && (
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              Paste a Google Sheets URL (docs.google.com/spreadsheets/d/...)
            </div>
          )}
        </div>

        {/* Creative folder URL */}
        <div className="builder-field">
          <label className="builder-label">Creative Assets Folder</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="builder-input builder-input--mono"
              type="url"
              placeholder="https://drive.google.com/drive/folders/..."
              value={driveFolderUrl}
              onChange={e => setDriveFolderUrl(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              className="builder-chip selected"
              onClick={handleScanDrive}
              disabled={!driveFolderId || driveLoading}
              style={{
                padding: '8px 16px', fontSize: 13, whiteSpace: 'nowrap',
                cursor: driveFolderId && !driveLoading ? 'pointer' : 'default',
                opacity: driveFolderId ? 1 : 0.5,
              }}
            >
              {driveLoading ? 'Scanning...' : 'Scan Folder'}
            </button>
          </div>
          {driveStatus && (
            <div style={{
              fontSize: 12, marginTop: 6,
              color: driveStatus.includes('Error') ? '#dc2626' : 'var(--periphery)',
            }}>
              {driveStatus}
            </div>
          )}
          {driveFiles && Object.keys(driveFiles).length > 0 && (
            <div style={{
              marginTop: 8, padding: '8px 12px', borderRadius: 8,
              background: 'var(--bg-subtle)', fontSize: 12, color: 'var(--text-secondary)',
              maxHeight: 120, overflowY: 'auto',
            }}>
              {Object.keys(driveFiles).map(f => (
                <div key={f} style={{ padding: '2px 0' }}>
                  {driveFiles[f].is_video ? '🎬' : '🖼️'} {f}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Campaign Identity */}
      <div className="builder-section">
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
          Campaign Identity
        </h2>

        <div className="builder-field">
          <label className="builder-label">Campaign Name *</label>
          <input
            className="builder-input"
            type="text"
            placeholder="e.g. Edgemont — March 2026"
            value={name}
            onChange={e => setName(e.target.value)}
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

        <div className="builder-field">
          <label className="builder-label">Facebook Page Name</label>
          <input
            className="builder-input"
            type="text"
            placeholder="e.g. The Edgemont Collection (shown in ad previews)"
            value={pageName}
            onChange={e => setPageName(e.target.value)}
          />
        </div>
      </div>

      {/* Settings */}
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
            {ALL_LANGUAGES.map(lang => (
              <button
                key={lang.key}
                className={`builder-chip${languages.includes(lang.key) ? ' selected' : ''}`}
                onClick={() => toggleLanguage(lang.key)}
              >
                {lang.label}
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
        </div>
      </div>

      {/* Create button */}
      <button
        className="builder-generate-btn"
        disabled={!canCreate}
        onClick={handleCreate}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        {importedState || driveFiles ? 'Start Writing (with imported data)' : 'Start Writing'}
      </button>

      {/* Back link */}
      <div style={{ textAlign: 'center', marginTop: 32, paddingBottom: 20 }}>
        <Link to="/studio" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          ← Back to Copy Studio
        </Link>
      </div>
    </div>
  );
}
