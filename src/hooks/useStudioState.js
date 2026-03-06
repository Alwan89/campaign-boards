import { useReducer } from 'react';

const LANGUAGES = ['en', 'zh_s', 'zh_t', 'kr', 'fa'];

/** Create a multi-language field with empty strings */
function mlField(initial = '') {
  const obj = {};
  LANGUAGES.forEach(l => { obj[l] = initial; });
  return obj;
}

/** Default state for a new studio project */
function createInitialState() {
  return {
    // Project identity
    project: {
      name: '',
      projectName: '',
      developer: '',
      objective: 'Lead Generation',
      budget: '',
      languages: ['en'],
      landingPage: '',
      housing: true,
      pageName: '',
      pageAvatar: '',
      slug: '',
    },

    // Meta Ads copy
    meta: {
      'single-image': {
        text: mlField(),
        headline: mlField(),
        description: mlField(),
        cta: 'Learn More',
        link: '',
      },
      carousel: {
        text: mlField(),
        cards: [
          { headline: mlField(), description: mlField() },
          { headline: mlField(), description: mlField() },
          { headline: mlField(), description: mlField() },
        ],
        cta: 'Learn More',
        link: '',
      },
      video: {
        text: mlField(),
        headline: mlField(),
        description: mlField(),
        cta: 'Learn More',
        link: '',
      },
    },

    // Google Ads copy
    google: {
      rsa: {
        headlines: Array.from({ length: 15 }, () => mlField()),
        descriptions: Array.from({ length: 4 }, () => mlField()),
        link: '',
      },
      pmax: {
        businessName: mlField(),
        headlines: Array.from({ length: 5 }, () => mlField()),
        longHeadline: mlField(),
        descriptions: Array.from({ length: 5 }, () => mlField()),
        cta: 'Learn More',
        link: '',
      },
      demandGen: {
        headline: mlField(),
        description: mlField(),
        cta: 'Learn More',
        link: '',
      },
    },

    // Google Ads extensions
    extensions: {
      callouts: Array.from({ length: 6 }, () => mlField()),
      snippets: Array.from({ length: 6 }, () => mlField()),
      sitelinks: Array.from({ length: 4 }, () => ({
        title: mlField(),
        description: mlField(),
      })),
    },

    // LinkedIn copy
    linkedin: {
      text: mlField(),
      headline: mlField(),
      description: mlField(),
      cta: 'Learn More',
      link: '',
    },

    // Lead form
    leadForm: {
      greetingHeadline: mlField(),
      greetingDescription: mlField(),
      customQuestions: [],
      privacyUrl: '',
      completionHeadline: mlField(),
      completionDescription: mlField(),
      completionCta: mlField(),
    },

    // Creative assets
    creatives: {
      files: [],
    },

    // UI state
    ui: {
      activeLanguage: 'en',
      activePlatform: 'meta',
      activeAdType: 'single-image',
      previewPlacement: 'facebook-feed',
    },
  };
}

/** Reducer actions */
function studioReducer(state, action) {
  switch (action.type) {
    case 'LOAD_STATE':
      return { ...action.payload };

    case 'SET_PROJECT_FIELD':
      return {
        ...state,
        project: { ...state.project, [action.field]: action.value },
      };

    case 'SET_META_FIELD': {
      const { adType, field, lang, value } = action;
      const adTypeState = state.meta[adType];
      if (lang) {
        return {
          ...state,
          meta: {
            ...state.meta,
            [adType]: {
              ...adTypeState,
              [field]: { ...adTypeState[field], [lang]: value },
            },
          },
        };
      }
      return {
        ...state,
        meta: {
          ...state.meta,
          [adType]: { ...adTypeState, [field]: value },
        },
      };
    }

    case 'SET_META_CAROUSEL_CARD': {
      const { cardIndex, field, lang, value } = action;
      const cards = [...state.meta.carousel.cards];
      cards[cardIndex] = {
        ...cards[cardIndex],
        [field]: { ...cards[cardIndex][field], [lang]: value },
      };
      return {
        ...state,
        meta: {
          ...state.meta,
          carousel: { ...state.meta.carousel, cards },
        },
      };
    }

    case 'ADD_CAROUSEL_CARD': {
      const cards = [...state.meta.carousel.cards, {
        headline: mlField(),
        description: mlField(),
      }];
      return {
        ...state,
        meta: {
          ...state.meta,
          carousel: { ...state.meta.carousel, cards },
        },
      };
    }

    case 'REMOVE_CAROUSEL_CARD': {
      const cards = state.meta.carousel.cards.filter((_, i) => i !== action.index);
      return {
        ...state,
        meta: {
          ...state.meta,
          carousel: { ...state.meta.carousel, cards },
        },
      };
    }

    case 'SET_GOOGLE_FIELD': {
      const { adType, field, lang, value } = action;
      const adTypeState = state.google[adType];
      if (lang) {
        return {
          ...state,
          google: {
            ...state.google,
            [adType]: {
              ...adTypeState,
              [field]: { ...adTypeState[field], [lang]: value },
            },
          },
        };
      }
      return {
        ...state,
        google: {
          ...state.google,
          [adType]: { ...adTypeState, [field]: value },
        },
      };
    }

    case 'SET_GOOGLE_ARRAY_FIELD': {
      const { adType, field, index, lang, value } = action;
      const arr = [...state.google[adType][field]];
      arr[index] = { ...arr[index], [lang]: value };
      return {
        ...state,
        google: {
          ...state.google,
          [adType]: { ...state.google[adType], [field]: arr },
        },
      };
    }

    case 'SET_EXTENSION_FIELD': {
      const { extensionType, index, lang, value } = action;
      if (extensionType === 'sitelinks') {
        const sitelinks = [...state.extensions.sitelinks];
        sitelinks[index] = {
          ...sitelinks[index],
          [action.field]: { ...sitelinks[index][action.field], [lang]: value },
        };
        return {
          ...state,
          extensions: { ...state.extensions, sitelinks },
        };
      }
      const arr = [...state.extensions[extensionType]];
      arr[index] = { ...arr[index], [lang]: value };
      return {
        ...state,
        extensions: { ...state.extensions, [extensionType]: arr },
      };
    }

    case 'SET_LINKEDIN_FIELD': {
      const { field, lang, value } = action;
      if (lang) {
        return {
          ...state,
          linkedin: {
            ...state.linkedin,
            [field]: { ...state.linkedin[field], [lang]: value },
          },
        };
      }
      return {
        ...state,
        linkedin: { ...state.linkedin, [field]: value },
      };
    }

    case 'SET_LEAD_FORM_FIELD': {
      const { field, lang, value } = action;
      if (lang) {
        return {
          ...state,
          leadForm: {
            ...state.leadForm,
            [field]: { ...state.leadForm[field], [lang]: value },
          },
        };
      }
      return {
        ...state,
        leadForm: { ...state.leadForm, [field]: value },
      };
    }

    case 'ADD_CREATIVE': {
      return {
        ...state,
        creatives: {
          files: [...state.creatives.files, action.file],
        },
      };
    }

    case 'REMOVE_CREATIVE': {
      return {
        ...state,
        creatives: {
          files: state.creatives.files.filter(f => f.id !== action.id),
        },
      };
    }

    case 'UPDATE_CREATIVE': {
      return {
        ...state,
        creatives: {
          files: state.creatives.files.map(f =>
            f.id === action.id ? { ...f, ...action.updates } : f
          ),
        },
      };
    }

    case 'SET_UI': {
      return {
        ...state,
        ui: { ...state.ui, [action.field]: action.value },
      };
    }

    default:
      return state;
  }
}

/**
 * Main studio state hook — manages all copy project state via useReducer.
 * @param {object|null} savedState — restored state from localStorage
 */
export function useStudioState(savedState = null) {
  const [state, dispatch] = useReducer(
    studioReducer,
    savedState || createInitialState()
  );

  return { state, dispatch };
}

export { createInitialState };
