import { createInitialState } from '../hooks/useStudioState';

/**
 * Parse a campaign brief text into studio state fields.
 * Extracts common patterns like project name, developer, objective, budget, URL, languages.
 * Returns a partial project object to merge into initial state.
 */
/**
 * Extract a Google Sheets spreadsheet ID from a URL.
 * Matches: docs.google.com/spreadsheets/d/{ID}/...
 */
export function extractSheetId(url) {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Extract a Google Drive folder ID from a URL.
 * Matches: drive.google.com/drive/folders/{ID} or drive.google.com/drive/u/0/folders/{ID}
 */
export function extractDriveFolderId(url) {
  const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export function parseBriefText(briefText) {
  const project = {};
  const lines = briefText.split('\n').map(l => l.trim()).filter(Boolean);

  // Try to extract key fields from the brief
  for (const line of lines) {
    const lower = line.toLowerCase();

    // Project / Campaign name
    if (/^(project|campaign|name)\s*[:–—-]\s*/i.test(line)) {
      project.projectName = line.replace(/^(project|campaign|name)\s*[:–—-]\s*/i, '').trim();
    }

    // Developer / Client
    if (/^(developer|client|brand)\s*[:–—-]\s*/i.test(line)) {
      project.developer = line.replace(/^(developer|client|brand)\s*[:–—-]\s*/i, '').trim();
    }

    // Objective
    if (/^(objective|goal|campaign objective)\s*[:–—-]\s*/i.test(line)) {
      const obj = line.replace(/^(objective|goal|campaign objective)\s*[:–—-]\s*/i, '').trim();
      const objectives = [
        'Lead Generation', 'Traffic', 'Conversions', 'Brand Awareness',
        'Engagement', 'App Installs', 'Video Views', 'Messages',
      ];
      const match = objectives.find(o => lower.includes(o.toLowerCase()));
      if (match) project.objective = match;
      else project.objective = obj;
    }

    // Budget
    if (/^(budget|spend|monthly budget)\s*[:–—-]\s*/i.test(line)) {
      project.budget = line.replace(/^(budget|spend|monthly budget)\s*[:–—-]\s*/i, '').trim();
    }

    // Landing page
    if (/^(url|landing\s*page|link|website)\s*[:–—-]\s*/i.test(line)) {
      const url = line.replace(/^(url|landing\s*page|link|website)\s*[:–—-]\s*/i, '').trim();
      if (url.startsWith('http')) project.landingPage = url;
    }

    // Copy sheet URL
    if (/^(copy\s*sheet|ad\s*copy|sheet|spreadsheet|copy\s*url|copy\s*doc)\s*[:–—-]\s*/i.test(line)) {
      const url = line.replace(/^(copy\s*sheet|ad\s*copy|sheet|spreadsheet|copy\s*url|copy\s*doc)\s*[:–—-]\s*/i, '').trim();
      const sheetId = extractSheetId(url);
      if (sheetId) {
        project.sheetUrl = url;
        project.sheetId = sheetId;
      }
    }

    // Creative / assets folder URL
    if (/^(creatives?|assets?|images?|creative\s*folder|assets?\s*folder|drive\s*folder|media)\s*[:–—-]\s*/i.test(line)) {
      const url = line.replace(/^(creatives?|assets?|images?|creative\s*folder|assets?\s*folder|drive\s*folder|media)\s*[:–—-]\s*/i, '').trim();
      const folderId = extractDriveFolderId(url);
      if (folderId) {
        project.driveFolderUrl = url;
        project.driveFolderId = folderId;
      }
    }

    // Languages
    if (/^(languages?|lang)\s*[:–—-]\s*/i.test(line)) {
      const langStr = line.replace(/^(languages?|lang)\s*[:–—-]\s*/i, '').toLowerCase();
      const langs = [];
      if (langStr.includes('en') || langStr.includes('english')) langs.push('en');
      if (langStr.includes('zh-s') || langStr.includes('simplified') || langStr.includes('zh_s')) langs.push('zh_s');
      if (langStr.includes('zh-t') || langStr.includes('traditional') || langStr.includes('zh_t')) langs.push('zh_t');
      if (langStr.includes('kr') || langStr.includes('korean')) langs.push('kr');
      if (langStr.includes('fa') || langStr.includes('farsi') || langStr.includes('persian')) langs.push('fa');
      if (langs.length > 0) project.languages = langs;
    }

    // Page name
    if (/^(page\s*name|facebook\s*page|fb\s*page)\s*[:–—-]\s*/i.test(line)) {
      project.pageName = line.replace(/^(page\s*name|facebook\s*page|fb\s*page)\s*[:–—-]\s*/i, '').trim();
    }

    // Auto-detect Google URLs from any line
    const allUrls = line.match(/https?:\/\/[^\s,)]+/g) || [];
    for (const url of allUrls) {
      if (!project.sheetId && extractSheetId(url)) {
        project.sheetUrl = url;
        project.sheetId = extractSheetId(url);
      } else if (!project.driveFolderId && extractDriveFolderId(url)) {
        project.driveFolderUrl = url;
        project.driveFolderId = extractDriveFolderId(url);
      } else if (!project.landingPage && !url.includes('google.com')) {
        project.landingPage = url;
      }
    }
  }

  // Fallback: first non-field line as project name
  if (!project.projectName) {
    const firstLine = lines.find(l => !/^(project|campaign|name|developer|client|brand|objective|goal|budget|spend|url|landing|link|website|languages?|lang|page\s*name|facebook|fb|copy\s*sheet|ad\s*copy|sheet|spreadsheet|creatives?|assets?|images?|drive|media)\s*[:–—-]/i.test(l));
    if (firstLine) project.projectName = firstLine;
  }

  return project;
}

/**
 * Convert parseCopyFromSheet() output (meta_ads format) into studio state.
 * meta_ads format: { "Group Name": { text: { en: '...' }, headline: { en: '...' }, ... }, ... }
 */
export function importParsedSheetToState(sheetData) {
  const state = createInitialState();
  const metaAds = sheetData.meta_ads || {};

  if (sheetData.project_name) {
    state.project.projectName = sheetData.project_name;
  }

  // Map sheet groups to studio ad types
  // Groups are named things like "Image 1 — Hero", "Video 1 — Walkthrough", "Carousel 1"
  const groups = Object.entries(metaAds);

  for (const [groupName, fields] of groups) {
    const lower = groupName.toLowerCase();
    let target;

    if (lower.includes('carousel')) {
      target = state.meta.carousel;
      // For carousel, headline/description might be per-card (headline_1, headline_2, etc.)
      if (fields.text) mergeMLField(target.text, fields.text);
      if (fields.cta) target.cta = firstLangValue(fields.cta) || target.cta;
      if (fields.link) target.link = firstLangValue(fields.link) || target.link;

      // Collect numbered headlines/descriptions as cards
      const cardHeadlines = {};
      const cardDescs = {};
      for (const [key, val] of Object.entries(fields)) {
        const hMatch = key.match(/^headline_(\d+)$/);
        const dMatch = key.match(/^description_(\d+)$/);
        if (hMatch) cardHeadlines[hMatch[1]] = val;
        if (dMatch) cardDescs[dMatch[1]] = val;
      }
      const cardNums = [...new Set([...Object.keys(cardHeadlines), ...Object.keys(cardDescs)])].sort();
      if (cardNums.length > 0) {
        target.cards = cardNums.map(n => ({
          headline: toMLField(cardHeadlines[n]),
          description: toMLField(cardDescs[n]),
        }));
        while (target.cards.length < 2) {
          target.cards.push({ headline: createMLField(), description: createMLField() });
        }
      }
    } else if (lower.includes('video')) {
      target = state.meta.video;
      if (fields.text) mergeMLField(target.text, fields.text);
      if (fields.headline) mergeMLField(target.headline, fields.headline);
      if (fields.description) mergeMLField(target.description, fields.description);
      if (fields.cta) target.cta = firstLangValue(fields.cta) || target.cta;
      if (fields.link) target.link = firstLangValue(fields.link) || target.link;
    } else {
      // Default: single image (most common — "Image 1", "Static 1", etc.)
      target = state.meta['single-image'];
      if (fields.text) mergeMLField(target.text, fields.text);
      if (fields.headline) mergeMLField(target.headline, fields.headline);
      if (fields.description) mergeMLField(target.description, fields.description);
      if (fields.cta) target.cta = firstLangValue(fields.cta) || target.cta;
      if (fields.link) target.link = firstLangValue(fields.link) || target.link;
    }
  }

  // Detect which languages have copy and set project.languages
  const activeLangs = [];
  for (const lang of ['en', 'zh_s', 'zh_t', 'kr', 'fa']) {
    const hasAny = [
      state.meta['single-image'].text[lang],
      state.meta.video.text[lang],
      state.meta.carousel.text[lang],
    ].some(v => v?.trim());
    if (hasAny) activeLangs.push(lang);
  }
  if (activeLangs.length > 0) state.project.languages = activeLangs;

  return state;
}

/** Merge a sheet's multilang object { en: '...', zh_s: '...' } into a studio mlField */
function mergeMLField(target, source) {
  for (const [lang, val] of Object.entries(source)) {
    if (val && target.hasOwnProperty(lang)) {
      target[lang] = val;
    }
  }
}

/** Convert a sheet multilang object to a full mlField (filling missing langs with '') */
function toMLField(source) {
  const field = createMLField();
  if (source) mergeMLField(field, source);
  return field;
}

/** Get the first non-empty value from a multilang object (for non-lang fields like CTA) */
function firstLangValue(mlObj) {
  if (typeof mlObj === 'string') return mlObj;
  for (const val of Object.values(mlObj || {})) {
    if (val?.trim()) return val.trim();
  }
  return '';
}

/**
 * Import a JSON object (from copy-generator agent output or data.json) into studio state.
 * Handles two formats:
 * 1. Agent output: { meta: { 'single-image': { text: { en: '...' } } }, project: { ... } }
 * 2. Board data.json: { campaign: { ... }, ads: [...] }
 */
export function importJsonToState(json) {
  // If it's already in studio state format, merge it
  if (json.meta && json.project) {
    const base = createInitialState();
    return deepMerge(base, json);
  }

  // If it's a board data.json format, convert back to studio state
  if (json.campaign && json.ads) {
    return importBoardDataToState(json);
  }

  // If it's a flat copy object from agent output
  // Expected format: { primaryText: '...', headline: '...', description: '...', ... }
  if (json.primaryText || json.primary_text || json.headline) {
    const state = createInitialState();
    const si = state.meta['single-image'];
    const lang = 'en';

    si.text[lang] = json.primaryText || json.primary_text || json.text || '';
    si.headline[lang] = json.headline || '';
    si.description[lang] = json.description || '';
    if (json.cta) si.cta = json.cta;
    if (json.link || json.url) si.link = json.link || json.url || '';

    if (json.project || json.projectName || json.campaign) {
      state.project.projectName = json.projectName || json.project || json.campaign || '';
    }
    if (json.developer || json.client) {
      state.project.developer = json.developer || json.client || '';
    }

    return state;
  }

  return null;
}

/**
 * Convert a board data.json back into studio state for editing.
 */
function importBoardDataToState(data) {
  const state = createInitialState();
  const campaign = data.campaign || {};

  state.project = {
    ...state.project,
    name: campaign.name || '',
    projectName: campaign.project || campaign.name || '',
    developer: campaign.developer || '',
    objective: campaign.objective || 'Lead Generation',
    budget: campaign.budget || '',
    languages: campaign.languages || ['en'],
    landingPage: campaign.landing_page || '',
    housing: campaign.housing_category ?? true,
    pageName: campaign.pageName || '',
    pageAvatar: campaign.pageAvatar || '',
    slug: data.meta?.slug || '',
  };

  // Import ads back into meta copy
  const lang = (campaign.languages || ['en'])[0];
  for (const ad of (data.ads || [])) {
    const copy = ad.copy || {};

    if (ad.type === 'Single Image' && ad.placement === 'Feed') {
      state.meta['single-image'].text[lang] = copy.primary || '';
      state.meta['single-image'].headline[lang] = copy.headline || '';
      state.meta['single-image'].description[lang] = copy.description || '';
      state.meta['single-image'].cta = copy.cta || 'Learn More';
      state.meta['single-image'].link = copy.link || '';
    }

    if (ad.type === 'Video' && ad.placement === 'Feed') {
      state.meta.video.text[lang] = copy.primary || '';
      state.meta.video.headline[lang] = copy.headline || '';
      state.meta.video.description[lang] = copy.description || '';
      state.meta.video.cta = copy.cta || 'Learn More';
      state.meta.video.link = copy.link || '';
    }

    if (ad.type === 'Carousel' && ad.carouselCards) {
      state.meta.carousel.text[lang] = copy.primary || '';
      state.meta.carousel.cta = copy.cta || 'Learn More';
      state.meta.carousel.link = copy.link || '';
      state.meta.carousel.cards = ad.carouselCards.map(card => ({
        headline: { ...createMLField(), [lang]: card.headline || '' },
        description: { ...createMLField(), [lang]: card.description || '' },
      }));
      // Ensure at least 2 cards
      while (state.meta.carousel.cards.length < 2) {
        state.meta.carousel.cards.push({
          headline: createMLField(),
          description: createMLField(),
        });
      }
    }
  }

  return state;
}

function createMLField(initial = '') {
  const obj = {};
  ['en', 'zh_s', 'zh_t', 'kr', 'fa'].forEach(l => { obj[l] = initial; });
  return obj;
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key]) {
      result[key] = deepMerge(target[key], source[key]);
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Parse Google Sheet copy data (from sheetsReader) into studio state.
 * Expected format: array of row objects with columns matching the ad copy template.
 */
export function importSheetRowsToState(rows, projectInfo = {}) {
  const state = createInitialState();
  const lang = projectInfo.language || 'en';

  // Merge project info
  if (projectInfo.name) state.project.name = projectInfo.name;
  if (projectInfo.projectName) state.project.projectName = projectInfo.projectName;
  if (projectInfo.developer) state.project.developer = projectInfo.developer;
  if (projectInfo.landingPage) state.project.landingPage = projectInfo.landingPage;
  if (projectInfo.languages) state.project.languages = projectInfo.languages;

  let carouselCards = [];

  for (const row of rows) {
    const adType = (row['Ad Type'] || row['ad_type'] || row['Type'] || '').trim();
    const primaryText = row['Primary Text'] || row['primary_text'] || row['Body'] || '';
    const headline = row['Headline'] || row['headline'] || '';
    const description = row['Description'] || row['description'] || '';
    const cta = row['CTA'] || row['cta'] || row['Call to Action'] || '';
    const link = row['Destination URL'] || row['url'] || row['Link'] || '';
    const lowerType = adType.toLowerCase();

    // Carousel cards (indented rows)
    if (lowerType.includes('card') || adType.startsWith('  ')) {
      carouselCards.push({
        headline: { ...createMLField(), [lang]: headline },
        description: { ...createMLField(), [lang]: description },
      });
      continue;
    }

    if (lowerType.includes('single') || lowerType.includes('image') || lowerType === '') {
      state.meta['single-image'].text[lang] = primaryText;
      state.meta['single-image'].headline[lang] = headline;
      state.meta['single-image'].description[lang] = description;
      if (cta) state.meta['single-image'].cta = cta;
      if (link) state.meta['single-image'].link = link;
    }

    if (lowerType.includes('video')) {
      state.meta.video.text[lang] = primaryText;
      state.meta.video.headline[lang] = headline;
      state.meta.video.description[lang] = description;
      if (cta) state.meta.video.cta = cta;
      if (link) state.meta.video.link = link;
    }

    if (lowerType.includes('carousel')) {
      state.meta.carousel.text[lang] = primaryText;
      if (cta) state.meta.carousel.cta = cta;
      if (link) state.meta.carousel.link = link;
      carouselCards = []; // Reset — cards follow this row
    }
  }

  // Apply carousel cards if any
  if (carouselCards.length > 0) {
    state.meta.carousel.cards = carouselCards;
    while (state.meta.carousel.cards.length < 2) {
      state.meta.carousel.cards.push({
        headline: createMLField(),
        description: createMLField(),
      });
    }
  }

  return state;
}
