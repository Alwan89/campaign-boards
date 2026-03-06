import { useMemo } from 'react';

/**
 * Transforms studio state into ad object props that existing
 * FeedCard / StoryCard / ReelCard / InstagramFeedCard components consume.
 *
 * Picks the correct creative for each preview placement.
 */
export function useLivePreview(state) {
  const lang = state.ui.activeLanguage;
  const adType = state.ui.activeAdType || 'single-image';
  const metaCopy = state.meta[adType];
  const previewPlacement = state.ui.previewPlacement;
  const files = state.creatives.files;

  // Map preview placement → creative placement key
  const creativePlacement = useMemo(() => {
    const map = {
      'facebook-feed': 'feed',
      'instagram-feed': 'feed',
      'instagram-story': 'story',
      'facebook-story': 'story',
      'instagram-reel': 'story',   // story/reel share the same 9:16 asset
      'facebook-reel': 'story',
    };
    return map[previewPlacement] || 'feed';
  }, [previewPlacement]);

  const assignedCreative = useMemo(() => {
    return files.find(f => f.placement === creativePlacement) || null;
  }, [files, creativePlacement]);

  const imageUrl = assignedCreative?.url || '';

  // Build the ad object that card components expect
  const previewAd = useMemo(() => {
    const isCarousel = adType === 'carousel';
    const copy = {
      primary: metaCopy.text[lang] || '',
      headline: isCarousel ? '' : (metaCopy.headline?.[lang] || ''),
      description: isCarousel ? '' : (metaCopy.description?.[lang] || ''),
      cta: metaCopy.cta || 'Learn More',
      link: metaCopy.link || state.project.landingPage || '',
    };

    const ad = {
      id: 'studio-preview',
      name: 'Studio Preview',
      type: isCarousel ? 'Carousel' : 'Single Image',
      placement: 'Feed',
      concept: 'Preview',
      files: assignedCreative ? [assignedCreative.filename] : [],
      imageUrl,
      isVideo: assignedCreative?.type === 'video',
      videoUrl: '',
      copy,
    };

    if (isCarousel) {
      ad.carouselCards = metaCopy.cards.map((card, i) => {
        const cardCreative = files.find(f => f.placement === `carousel-${i + 1}`);
        return {
          imageUrl: cardCreative?.url || '',
          headline: card.headline[lang] || '',
          description: card.description[lang] || '',
        };
      });
    }

    return ad;
  }, [metaCopy, lang, adType, imageUrl, assignedCreative, files, state.project.landingPage]);

  // Build campaign context that card components read via useCampaign()
  const campaignContext = useMemo(() => ({
    name: state.project.name || 'Campaign Preview',
    project: state.project.projectName || state.project.name || '',
    developer: state.project.developer || '',
    objective: state.project.objective || 'Lead Generation',
    budget: state.project.budget || '',
    languages: state.project.languages || ['en'],
    housing_category: state.project.housing,
    landing_page: state.project.landingPage || '',
    pageName: state.project.pageName || state.project.projectName || state.project.developer || 'Page Name',
    pageAvatar: state.project.pageAvatar || '',
  }), [state.project]);

  return { previewAd, campaignContext };
}
