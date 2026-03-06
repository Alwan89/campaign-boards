/**
 * Convert studio state → data.json format compatible with CampaignBoard.
 * Generates ad sets and ads from the copy + creatives entered in studio.
 */
export function publishStudioAsBoard(state) {
  const lang = state.ui.activeLanguage;
  const project = state.project;
  const files = state.creatives.files;

  const campaign = {
    name: project.name,
    project: project.projectName || project.name,
    developer: project.developer,
    objective: project.objective,
    budget: project.budget,
    languages: project.languages,
    housing_category: project.housing,
    landing_page: project.landingPage,
    pageName: project.pageName || project.projectName || project.developer || 'Page Name',
    pageAvatar: project.pageAvatar || '',
  };

  const ads = [];
  const adSets = [];
  let adId = 1;
  let asId = 1;

  const feedFile = files.find(f => f.placement === 'feed');
  const storyFile = files.find(f => f.placement === 'story');

  // Generate ads from each Meta ad type that has copy
  const adTypes = ['single-image', 'video', 'carousel'];

  for (const adType of adTypes) {
    const copy = state.meta[adType];
    const primaryText = copy.text[lang] || '';

    // Skip ad types with no copy entered
    if (!primaryText && adType !== 'carousel') continue;
    if (adType === 'carousel' && !copy.cards.some(c => c.headline[lang])) continue;

    const isCarousel = adType === 'carousel';
    const typeName = adType === 'single-image' ? 'Single Image' : adType === 'video' ? 'Video' : 'Carousel';

    // Feed ad
    const feedAd = {
      id: `ad${adId++}`,
      name: `${typeName}_Feed_${lang.toUpperCase()}`,
      type: typeName,
      placement: 'Feed',
      concept: 'Studio',
      files: feedFile ? [feedFile.filename] : [],
      imageUrl: feedFile?.url || '',
      isVideo: adType === 'video' || feedFile?.type === 'video',
      videoUrl: '',
      copy: {
        primary: primaryText,
        headline: isCarousel ? '' : (copy.headline?.[lang] || ''),
        description: isCarousel ? '' : (copy.description?.[lang] || ''),
        cta: copy.cta || 'Learn More',
        link: copy.link || project.landingPage || '',
      },
    };

    if (isCarousel) {
      feedAd.carouselCards = copy.cards.map((card, i) => {
        const cardFile = files.find(f => f.placement === `carousel-${i + 1}`);
        return {
          imageUrl: cardFile?.url || '',
          headline: card.headline[lang] || '',
          description: card.description[lang] || '',
        };
      }).filter(c => c.headline || c.imageUrl);
    }

    ads.push(feedAd);

    // Story/Reel ad (skip for carousel)
    if (!isCarousel) {
      const storyAd = {
        id: `ad${adId++}`,
        name: `${typeName}_StoryReel_${lang.toUpperCase()}`,
        type: typeName,
        placement: 'StoryReel',
        concept: 'Studio',
        files: storyFile ? [storyFile.filename] : feedFile ? [feedFile.filename] : [],
        imageUrl: storyFile?.url || feedFile?.url || '',
        isVideo: adType === 'video' || storyFile?.type === 'video',
        videoUrl: '',
        subPlacements: ['Story', 'Reel'],
        copy: { ...feedAd.copy },
      };
      ads.push(storyAd);
    }
  }

  // If no ads were generated from copy, create a placeholder from single-image
  if (ads.length === 0) {
    const copy = state.meta['single-image'];
    ads.push({
      id: `ad${adId++}`,
      name: `SingleImage_Feed_${lang.toUpperCase()}`,
      type: 'Single Image',
      placement: 'Feed',
      concept: 'Studio',
      files: feedFile ? [feedFile.filename] : [],
      imageUrl: feedFile?.url || '',
      isVideo: false,
      videoUrl: '',
      copy: {
        primary: copy.text[lang] || '',
        headline: copy.headline?.[lang] || '',
        description: copy.description?.[lang] || '',
        cta: copy.cta || 'Learn More',
        link: copy.link || project.landingPage || '',
      },
    });
  }

  // Create ad sets grouping by placement
  const feedAds = ads.filter(a => a.placement === 'Feed').map(a => a.id);
  const storyAds = ads.filter(a => a.placement === 'StoryReel').map(a => a.id);

  if (feedAds.length) {
    adSets.push({
      id: `as${asId++}`,
      name: `${project.objective?.replace(/\s+/g, '')}_${lang.toUpperCase()}_Feed`,
      tier: 'Broad',
      placement: 'Feed',
      targeting: 'Location only — Advantage+ ON',
      ads: feedAds,
    });
  }

  if (storyAds.length) {
    adSets.push({
      id: `as${asId++}`,
      name: `${project.objective?.replace(/\s+/g, '')}_${lang.toUpperCase()}_StoryReel`,
      tier: 'Broad',
      placement: 'StoryReel',
      targeting: 'Location only — Advantage+ ON',
      ads: storyAds,
    });
  }

  return {
    campaign,
    adSets,
    ads,
    sources: { studio: true, studioSlug: project.slug },
    meta: {
      generatedAt: new Date().toISOString(),
      generatedBy: 'copy-studio',
      boardVersion: '2.0',
      slug: project.slug,
      studioSlug: project.slug,
    },
  };
}

/**
 * Save published board to localStorage and update campaign index.
 */
export function saveBoardToLocalStorage(data, slug, project) {
  localStorage.setItem(`campaign:${slug}`, JSON.stringify(data));

  const indexRaw = localStorage.getItem('campaigns:index');
  const localIndex = indexRaw ? JSON.parse(indexRaw) : [];
  const existing = localIndex.findIndex(c => c.slug === slug);
  const indexEntry = {
    slug,
    name: project.name,
    project: project.projectName || project.name,
    client: project.developer,
    date: new Date().toISOString().slice(0, 7),
    status: 'draft',
    source: 'studio',
  };
  if (existing >= 0) {
    localIndex[existing] = indexEntry;
  } else {
    localIndex.unshift(indexEntry);
  }
  localStorage.setItem('campaigns:index', JSON.stringify(localIndex));
}
