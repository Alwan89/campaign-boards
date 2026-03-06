import { useState } from 'react';
import { generateAllCopy, translateCopy, hasApiKey } from '../../utils/claudeApi';
import { META_LIMITS } from '../../utils/charLimits';

const LANGUAGE_LABELS = {
  en: 'EN',
  zh_s: 'ZH-S',
  zh_t: 'ZH-T',
  kr: 'KR',
  fa: 'FA',
};

export default function StudioSidebar({ state, dispatch, onExport, onPublish, collapsed, onToggleCollapse, onNeedApiKey }) {
  const project = state.project;
  const activeLang = state.ui.activeLanguage;
  const languages = project.languages || ['en'];
  const adType = state.ui.activeAdType || 'single-image';

  const [generating, setGenerating] = useState(false);
  const [translating, setTranslating] = useState(false);

  // Calculate language progress (how many languages have copy entered)
  const meta = state.meta['single-image'];
  const filledLangs = languages.filter(l => meta.text[l]?.trim()).length;

  async function handleGenerateAll() {
    if (!hasApiKey()) {
      onNeedApiKey?.();
      return;
    }
    setGenerating(true);
    try {
      const result = await generateAllCopy({
        adType,
        projectName: project.projectName || project.name,
        developer: project.developer,
        objective: project.objective,
        landingPage: project.landingPage,
        language: activeLang,
      });
      if (result.text) dispatch({ type: 'SET_META_FIELD', adType, field: 'text', lang: activeLang, value: result.text });
      if (result.headline) dispatch({ type: 'SET_META_FIELD', adType, field: 'headline', lang: activeLang, value: result.headline });
      if (result.description) dispatch({ type: 'SET_META_FIELD', adType, field: 'description', lang: activeLang, value: result.description });
    } catch (err) {
      console.error('Generate all copy failed:', err);
    }
    setGenerating(false);
  }

  async function handleTranslate() {
    if (!hasApiKey()) {
      onNeedApiKey?.();
      return;
    }
    // Translate from EN to all other active languages
    const sourceLang = 'en';
    const copy = state.meta[adType];
    const sourceText = copy.text?.[sourceLang];
    const sourceHeadline = copy.headline?.[sourceLang];
    const sourceDesc = copy.description?.[sourceLang];

    if (!sourceText && !sourceHeadline) {
      return; // Nothing to translate
    }

    setTranslating(true);
    const limits = META_LIMITS[adType] || META_LIMITS['single-image'];
    const targetLangs = languages.filter(l => l !== sourceLang);

    try {
      for (const toLang of targetLangs) {
        if (sourceText) {
          const translated = await translateCopy({
            text: sourceText, fromLang: sourceLang, toLang,
            fieldType: 'primary_text', charLimit: limits.text,
          });
          dispatch({ type: 'SET_META_FIELD', adType, field: 'text', lang: toLang, value: translated });
        }
        if (sourceHeadline) {
          const translated = await translateCopy({
            text: sourceHeadline, fromLang: sourceLang, toLang,
            fieldType: 'headline', charLimit: limits.headline,
          });
          dispatch({ type: 'SET_META_FIELD', adType, field: 'headline', lang: toLang, value: translated });
        }
        if (sourceDesc) {
          const translated = await translateCopy({
            text: sourceDesc, fromLang: sourceLang, toLang,
            fieldType: 'description', charLimit: limits.description,
          });
          dispatch({ type: 'SET_META_FIELD', adType, field: 'description', lang: toLang, value: translated });
        }
      }
    } catch (err) {
      console.error('Translation failed:', err);
    }
    setTranslating(false);
  }

  return (
    <div className={`studio-sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Collapse toggle */}
      <button
        className="studio-sidebar__toggle"
        onClick={onToggleCollapse}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {collapsed ? (
            <polyline points="9,18 15,12 9,6" />
          ) : (
            <polyline points="15,18 9,12 15,6" />
          )}
        </svg>
      </button>

      {/* Project info */}
      <div className="studio-sidebar__project">
        <div className="studio-sidebar__avatar" style={{
          background: `hsl(${(project.name || 'S').charCodeAt(0) * 37 % 360}, 55%, 50%)`,
        }}>
          {(project.projectName || project.name || 'S').charAt(0).toUpperCase()}
        </div>
        <div className="studio-sidebar__name">
          {project.projectName || project.name || 'Untitled'}
        </div>
        {project.developer && (
          <div className="studio-sidebar__developer">{project.developer}</div>
        )}
      </div>

      {/* Language selector */}
      <div className="studio-sidebar__section">
        <div className="studio-sidebar__section-label">Language</div>
        <div className="studio-sidebar__langs">
          {languages.map(lang => (
            <button
              key={lang}
              className={`studio-lang-btn${activeLang === lang ? ' active' : ''}`}
              onClick={() => dispatch({ type: 'SET_UI', field: 'activeLanguage', value: lang })}
            >
              {LANGUAGE_LABELS[lang] || lang.toUpperCase()}
            </button>
          ))}
        </div>
        {languages.length > 1 && (
          <div className="studio-sidebar__progress">
            {filledLangs}/{languages.length} languages
            <div className="studio-sidebar__progress-bar">
              <div
                className="studio-sidebar__progress-fill"
                style={{ width: `${(filledLangs / languages.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* AI section */}
      <div className="studio-sidebar__section">
        <div className="studio-sidebar__section-label">AI Assist</div>
        <button
          className="studio-action-btn"
          onClick={handleGenerateAll}
          disabled={generating}
          title="Generate all copy fields with AI"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v1m0 16v1m-7.07-2.93l.7-.7M5.64 5.64l-.7-.7M3 12h1m16 0h1m-2.93 7.07l-.7-.7M18.36 5.64l.7-.7"/>
            <circle cx="12" cy="12" r="4"/>
          </svg>
          {generating ? 'Generating...' : 'Generate All Copy'}
        </button>
        {languages.length > 1 && (
          <button
            className="studio-action-btn"
            onClick={handleTranslate}
            disabled={translating}
            title="Translate EN copy to all other languages"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/>
              <path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/>
            </svg>
            {translating ? 'Translating...' : 'Translate EN → All'}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="studio-sidebar__actions">
        {onExport && (
          <button className="studio-action-btn" onClick={onExport} title="Export XLSX">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export XLSX
          </button>
        )}
        {onPublish && (
          <button className="studio-action-btn studio-action-btn--primary" onClick={onPublish} title="Publish Board">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
            Publish Board
          </button>
        )}
      </div>
    </div>
  );
}
