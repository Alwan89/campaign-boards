/**
 * Character limits for all ad platforms.
 * Keys match the field names used in useStudioState.
 */

export const META_LIMITS = {
  'single-image': {
    text: 125,       // Primary text (recommended; max 2200)
    headline: 40,
    description: 30,
  },
  carousel: {
    text: 125,
    headline: 40,    // Per card
    description: 25, // Per card
  },
  video: {
    text: 125,
    headline: 40,
    description: 30,
  },
};

export const GOOGLE_LIMITS = {
  rsa: {
    headline: 30,      // Up to 15 headlines
    description: 90,   // Up to 4 descriptions
  },
  pmax: {
    businessName: 25,
    headline: 30,       // Up to 5 headlines
    longHeadline: 90,
    description: 90,    // Up to 5 descriptions
  },
  demandGen: {
    headline: 40,
    description: 90,
  },
};

export const LINKEDIN_LIMITS = {
  text: 150,         // Intro text (recommended; max 600)
  headline: 70,
  description: 100,
};

export const EXTENSION_LIMITS = {
  callout: 25,
  snippet: 25,
  sitelinkTitle: 25,
  sitelinkDescription: 35,
};

export const LEAD_FORM_LIMITS = {
  greetingHeadline: 60,
  greetingDescription: 160,
  completionHeadline: 60,
  completionDescription: 200,
  completionCta: 25,
};

/**
 * Get color class for character count
 * @returns 'ok' | 'warn' | 'over'
 */
export function getCharStatus(length, limit) {
  if (length > limit) return 'over';
  if (length >= limit * 0.8) return 'warn';
  return 'ok';
}
