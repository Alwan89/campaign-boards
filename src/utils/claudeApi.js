/**
 * Browser-direct Claude API integration for Copy Studio.
 * Uses anthropic-dangerous-direct-browser-access header for client-side calls.
 */

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const API_KEY_KEY = 'studio:anthropic-api-key';

export function getApiKey() {
  return localStorage.getItem(API_KEY_KEY) || '';
}

export function setApiKey(key) {
  localStorage.setItem(API_KEY_KEY, key);
}

export function hasApiKey() {
  return !!getApiKey();
}

/**
 * Generate copy variations for a specific field.
 *
 * @param {object} params
 * @param {string} params.fieldType - 'primary_text' | 'headline' | 'description'
 * @param {string} params.currentValue - Current field value (may be empty)
 * @param {string} params.platform - 'meta' | 'google' | 'linkedin'
 * @param {number} params.charLimit - Character limit for this field
 * @param {string} params.projectName - Project name for context
 * @param {string} params.developer - Developer/client name
 * @param {string} params.objective - Campaign objective
 * @param {string} params.language - Language code (en, zh_s, etc.)
 * @param {number} params.count - Number of variations (default 3)
 * @returns {Promise<string[]>} Array of variation strings
 */
export async function generateVariations({
  fieldType,
  currentValue,
  platform = 'meta',
  charLimit,
  projectName,
  developer,
  objective,
  language = 'en',
  count = 3,
}) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('No API key set');

  const langNames = {
    en: 'English', zh_s: 'Simplified Chinese', zh_t: 'Traditional Chinese',
    kr: 'Korean', fa: 'Farsi/Persian',
  };

  const fieldDescriptions = {
    primary_text: 'primary text (the main body copy that appears above the image)',
    headline: 'headline (bold text below the image — short, punchy, attention-grabbing)',
    description: 'description (secondary text next to the headline — supporting detail)',
  };

  const prompt = `You are an expert real estate digital ad copywriter. Generate exactly ${count} variations for the ${fieldDescriptions[fieldType] || fieldType} of a ${platform} ad.

Context:
- Project: ${projectName || 'Real estate development'}
- Developer: ${developer || 'Premium developer'}
- Campaign Objective: ${objective || 'Lead Generation'}
- Language: ${langNames[language] || 'English'}
${charLimit ? `- Character limit: ${charLimit} characters (STRICT — do not exceed)` : ''}
${currentValue ? `- Current copy: "${currentValue}"` : '- No existing copy — write from scratch'}

Requirements:
- Write in ${langNames[language] || 'English'}
- Each variation should take a different angle or tone
- For real estate: focus on lifestyle, location, value, exclusivity, or urgency
- Keep it natural and conversational, not salesy
- If there's a character limit, respect it strictly
${platform === 'meta' ? '- Optimize for Facebook/Instagram ad format' : ''}

Return ONLY the ${count} variations, one per line, numbered 1-${count}. No explanations, no labels, no quotes.`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 401) throw new Error('Invalid API key');
    throw new Error(err.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';

  // Parse numbered lines: "1. ...", "2. ...", "3. ..."
  const variations = text
    .split('\n')
    .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter(line => line.length > 0)
    .slice(0, count);

  return variations;
}

/**
 * Generate all copy fields for an ad type at once.
 */
export async function generateAllCopy({
  adType = 'single-image',
  projectName,
  developer,
  objective,
  landingPage,
  language = 'en',
}) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('No API key set');

  const langNames = {
    en: 'English', zh_s: 'Simplified Chinese', zh_t: 'Traditional Chinese',
    kr: 'Korean', fa: 'Farsi/Persian',
  };

  const prompt = `You are an expert real estate digital ad copywriter. Generate a complete Meta Ads copy set for a ${adType} ad.

Context:
- Project: ${projectName || 'Real estate development'}
- Developer: ${developer || 'Premium developer'}
- Campaign Objective: ${objective || 'Lead Generation'}
- Language: ${langNames[language] || 'English'}
${landingPage ? `- Landing Page: ${landingPage}` : ''}

Write the following fields. Respect character limits STRICTLY:
1. Primary Text (max 125 chars) — main body copy above the image
2. Headline (max 40 chars) — bold text below the image
3. Description (max 30 chars) — supporting text next to headline

Requirements:
- Write in ${langNames[language] || 'English'}
- Real estate focus: lifestyle, location, value, exclusivity, or urgency
- Natural and conversational tone
- Each field on its own line

Return in this exact format (no extra text):
PRIMARY: [primary text here]
HEADLINE: [headline here]
DESCRIPTION: [description here]`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';

  const result = {};
  const primaryMatch = text.match(/PRIMARY:\s*(.+)/i);
  const headlineMatch = text.match(/HEADLINE:\s*(.+)/i);
  const descMatch = text.match(/DESCRIPTION:\s*(.+)/i);

  if (primaryMatch) result.text = primaryMatch[1].trim();
  if (headlineMatch) result.headline = headlineMatch[1].trim();
  if (descMatch) result.description = descMatch[1].trim();

  return result;
}

/**
 * Translate copy from one language to another.
 */
export async function translateCopy({
  text,
  fromLang = 'en',
  toLang,
  fieldType = 'primary_text',
  charLimit,
}) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('No API key set');

  const langNames = {
    en: 'English', zh_s: 'Simplified Chinese', zh_t: 'Traditional Chinese',
    kr: 'Korean', fa: 'Farsi/Persian',
  };

  const prompt = `Translate the following real estate ad copy from ${langNames[fromLang]} to ${langNames[toLang]}.

Original (${langNames[fromLang]}):
"${text}"

Requirements:
- This is for a ${fieldType.replace(/_/g, ' ')} field in a digital ad
${charLimit ? `- STRICT character limit: ${charLimit} characters` : ''}
- Use real estate terminology appropriate for ${langNames[toLang]}
- Keep the tone and marketing intent intact
- Do NOT transliterate brand/project names — keep them in their original form

Return ONLY the translated text, nothing else.`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return (data.content?.[0]?.text || '').trim();
}
