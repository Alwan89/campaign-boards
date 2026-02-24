/**
 * sheetsReader.js — Read ad copy from a Google Sheet via the Sheets API.
 *
 * Browser port of scripts/sheets_reader.py.
 * Uses fetch() with OAuth2 access token instead of service account.
 */
import { googleFetch } from './googleAuth';

// Language column mapping (same as Python)
const LANG_MAP = { 1: 'en', 2: 'zh_s', 3: 'zh_t', 4: 'kr', 5: 'fa' };

// Tabs to skip when auto-detecting the copy tab
const SKIP_TABS = new Set(['lead form', 'example mockups']);

/**
 * Get all tab/sheet names in a spreadsheet.
 */
async function getSheetTabs(spreadsheetId) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`;
  const data = await googleFetch(url);
  return (data.sheets || []).map(s => s.properties.title);
}

/**
 * Read a sheet tab as a 2D array of strings (padded to uniform width).
 */
async function readSheetAsGrid(spreadsheetId, tabName) {
  const encodedTab = encodeURIComponent(tabName);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedTab}`;
  const data = await googleFetch(url);
  const rows = data.values || [];

  if (rows.length === 0) return [];

  // Pad rows to uniform width (Sheets API omits trailing empty cells)
  const maxCols = Math.max(...rows.map(r => r.length));
  return rows.map(r => {
    const padded = [...r];
    while (padded.length < maxCols) padded.push('');
    return padded;
  });
}

/**
 * Extract multilingual copy from a row.
 */
function getCopy(grid, rowIdx) {
  const copy = {};
  for (const [colIdx, langKey] of Object.entries(LANG_MAP)) {
    const col = parseInt(colIdx);
    if (col < (grid[rowIdx]?.length || 0)) {
      const val = (grid[rowIdx][col] || '').trim();
      copy[langKey] = val;
    }
  }
  return copy;
}

/**
 * Find and extract the Meta Ads section from the ad copy sheet.
 * Ported from sheets_reader.py _extract_meta_ads_section().
 */
function extractMetaAdsSection(grid) {
  const metaAds = {};
  let inMeta = false;
  let currentGroup = null;
  let currentFields = {};

  for (let i = 0; i < grid.length; i++) {
    const label = (grid[i][0] || '').trim();
    const labelLower = label.toLowerCase();

    // Detect Meta Ads section start
    if (labelLower.includes('meta ads')) {
      inMeta = true;
      continue;
    }

    // Detect section exit
    if (inMeta && ['google ads', 'linkedin ads', 'wechat ads', 'priority #'].some(kw => labelLower.includes(kw))) {
      if (currentGroup && Object.keys(currentFields).length > 0) {
        metaAds[currentGroup] = currentFields;
      }
      inMeta = false;
      currentGroup = null;
      currentFields = {};
      continue;
    }

    if (!inMeta) continue;

    // Detect creative group headers (text in col 0, nothing in col 1)
    const copyFieldPrefixes = ['text', 'primary text', 'headline', 'description', 'button', 'link', 'cta'];
    if (label && !copyFieldPrefixes.some(kw => labelLower.startsWith(kw))) {
      const col1 = (grid[i][1] || '').trim();
      if (!col1) {
        if (currentGroup && Object.keys(currentFields).length > 0) {
          metaAds[currentGroup] = currentFields;
        }
        currentGroup = label;
        currentFields = {};
        continue;
      }
    }

    // Parse copy fields
    if (currentGroup) {
      if (labelLower.startsWith('text') || labelLower.startsWith('primary text')) {
        currentFields.text = getCopy(grid, i);
      } else if (labelLower.startsWith('headline')) {
        const numMatch = label.match(/(\d+)/);
        const key = numMatch ? `headline_${numMatch[1]}` : 'headline';
        currentFields[key] = getCopy(grid, i);
      } else if (labelLower.startsWith('description')) {
        const numMatch = label.match(/(\d+)/);
        const key = numMatch ? `description_${numMatch[1]}` : 'description';
        currentFields[key] = getCopy(grid, i);
      } else if (labelLower.startsWith('button') || labelLower.startsWith('cta')) {
        currentFields.cta = getCopy(grid, i);
      } else if (labelLower.startsWith('link')) {
        currentFields.link = getCopy(grid, i);
      }
    }
  }

  // Save last group
  if (currentGroup && Object.keys(currentFields).length > 0) {
    metaAds[currentGroup] = currentFields;
  }

  return metaAds;
}

/**
 * Extract lead form configuration.
 * Ported from sheets_reader.py _extract_lead_form().
 */
function extractLeadForm(grid) {
  const form = {};
  for (let i = 0; i < grid.length; i++) {
    const label = (grid[i][0] || '').trim();
    const labelLower = label.toLowerCase();

    if (labelLower.includes('headline') && !labelLower.includes('greeting')) {
      if (!form.headline) form.headline = getCopy(grid, i);
    } else if (labelLower.includes('description') && !labelLower.includes('prefill')) {
      if (!form.description) form.description = getCopy(grid, i);
    } else if (labelLower.includes('custom question') && !labelLower.includes('multiple')) {
      const qNum = label.match(/(\d+)/);
      const key = qNum ? `custom_question_${qNum[1]}` : 'custom_question';
      form[key] = getCopy(grid, i);
    } else if (labelLower.includes('privacy policy link')) {
      form.privacy_url = getCopy(grid, i);
    } else if (labelLower.includes('completion')) {
      if (i + 1 < grid.length) form.completion_headline = getCopy(grid, i + 1);
      if (i + 2 < grid.length) form.completion_description = getCopy(grid, i + 2);
    } else if (labelLower.includes('cta button')) {
      form.completion_cta = getCopy(grid, i);
    }
  }
  return form;
}

/**
 * Read ad copy from a Google Sheet and return structured copy data.
 *
 * Returns same structure as Python's parse_copy_from_sheet():
 * {
 *   project_name: "The Edgemont Collection",
 *   sheets: ["Jan 2026", "Lead Form"],
 *   meta_ads: { group_name: { field: { lang: text } } },
 *   lead_form: { ... },
 * }
 *
 * @param {string} spreadsheetId - Google Sheet ID
 * @param {string|null} tabName - Specific tab name (null = auto-detect)
 * @param {function} onProgress - Progress callback
 */
export async function parseCopyFromSheet(spreadsheetId, tabName = null, onProgress = null) {
  onProgress?.('Reading sheet tabs…');
  const tabs = await getSheetTabs(spreadsheetId);

  // Auto-detect copy tab if not specified
  if (!tabName) {
    for (const t of tabs) {
      if (!SKIP_TABS.has(t.toLowerCase())) {
        tabName = t;
        break;
      }
    }
  }

  const result = {
    project_name: '',
    sheets: tabs,
    meta_ads: {},
    lead_form: {},
  };

  if (!tabName) return result;

  onProgress?.(`Reading tab "${tabName}"…`);
  const grid = await readSheetAsGrid(spreadsheetId, tabName);

  if (grid.length === 0) return result;

  // Get project name from row 0
  if (grid[0][0]) {
    result.project_name = grid[0][0].trim();
  }

  // Extract Meta Ads copy
  onProgress?.('Parsing ad copy…');
  result.meta_ads = extractMetaAdsSection(grid);

  // Extract Lead Form if tab exists
  if (tabs.includes('Lead Form')) {
    onProgress?.('Reading Lead Form…');
    const lfGrid = await readSheetAsGrid(spreadsheetId, 'Lead Form');
    if (lfGrid.length > 0) {
      result.lead_form = extractLeadForm(lfGrid);
    }
  }

  return result;
}
