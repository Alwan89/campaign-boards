import { useState, useRef, useEffect } from 'react';

/**
 * Manages editable ad copy state with modification tracking.
 * Extracted from CampaignBoardInner for reuse across views.
 */
export function useAdState(data) {
  const [adsState, setAdsState] = useState(null);
  const originalAdsRef = useRef(null);

  useEffect(() => {
    if (data) {
      setAdsState(data.ads.map(a => ({
        ...a,
        copy: { ...a.copy },
        carouselCards: a.carouselCards ? a.carouselCards.map(c => ({ ...c })) : undefined
      })));
      originalAdsRef.current = data.ads.map(a => ({
        id: a.id, name: a.name, type: a.type, concept: a.concept, placement: a.placement,
        copy: { ...a.copy },
        carouselCards: a.carouselCards ? a.carouselCards.map(c => ({ ...c })) : undefined
      }));
    }
  }, [data]);

  const updateAdCopy = (adId, field, value) => {
    setAdsState(prev => prev.map(ad =>
      ad.id === adId ? { ...ad, copy: { ...ad.copy, [field]: value } } : ad
    ));
  };

  const updateCarouselCard = (adId, cardIndex, field, value) => {
    setAdsState(prev => prev.map(ad => {
      if (ad.id !== adId || !ad.carouselCards) return ad;
      const newCards = ad.carouselCards.map((c, i) => i === cardIndex ? { ...c, [field]: value } : c);
      return { ...ad, carouselCards: newCards };
    }));
  };

  const resetAd = (adId) => {
    const orig = originalAdsRef.current.find(a => a.id === adId);
    if (!orig) return;
    setAdsState(prev => prev.map(ad =>
      ad.id === adId ? {
        ...ad,
        copy: { ...orig.copy },
        carouselCards: orig.carouselCards ? orig.carouselCards.map(c => ({ ...c })) : ad.carouselCards
      } : ad
    ));
  };

  const modifiedCount = adsState && originalAdsRef.current
    ? adsState.filter((ad, i) => {
        const orig = originalAdsRef.current[i];
        return JSON.stringify(ad.copy) !== JSON.stringify(orig.copy) ||
          (ad.carouselCards && orig.carouselCards && JSON.stringify(ad.carouselCards) !== JSON.stringify(orig.carouselCards));
      }).length
    : 0;

  const getOriginalAd = (adId) => (originalAdsRef.current || []).find(a => a.id === adId) || {};

  return {
    adsState,
    originalAds: originalAdsRef.current,
    updateAdCopy,
    updateCarouselCard,
    resetAd,
    modifiedCount,
    getOriginalAd,
  };
}
