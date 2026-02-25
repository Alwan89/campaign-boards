import { useState, useEffect, useRef, useCallback } from 'react';
import { CampaignProvider } from '../context/CampaignContext';
import FeedCard from '../components/FeedCard';
import InstagramFeedCard from '../components/InstagramFeedCard';
import StoryCard from '../components/StoryCard';
import ReelCard from '../components/ReelCard';
import { SearchAdCard, DemandGenCard } from '../components/GoogleAdCards';

/* Platform icons for placement headers */
function FacebookIcon() {
  return (
    <svg className="placement-col__icon" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="10" fill="#1877f2"/>
      <path d="M13.5 10.6h-2.1V17h-2.8v-6.4H7V8.2h1.6V6.8c0-1.6.7-2.8 2.8-2.8h1.7v2.3h-1.1c-.8 0-.9.3-.9.9V8.2h2l-.6 2.4z" fill="#fff"/>
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg className="placement-col__icon" viewBox="0 0 20 20">
      <defs>
        <radialGradient id="ig-g" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497"/><stop offset="5%" stopColor="#fdf497"/>
          <stop offset="45%" stopColor="#fd5949"/><stop offset="60%" stopColor="#d6249f"/>
          <stop offset="90%" stopColor="#285AEB"/>
        </radialGradient>
      </defs>
      <rect width="20" height="20" rx="5" fill="url(#ig-g)"/>
      <rect x="3.5" y="3.5" width="13" height="13" rx="3.5" stroke="#fff" strokeWidth="1.5" fill="none"/>
      <circle cx="10" cy="10" r="3.2" stroke="#fff" strokeWidth="1.5" fill="none"/>
      <circle cx="14.2" cy="5.8" r="1" fill="#fff"/>
    </svg>
  );
}

/**
 * Client view — slide-based presentation with sticky left TOC.
 * Each ad variation is a full-width "slide" with a large centered preview.
 */
export default function ClientPreview({ data, adsState, adsByPlacement }) {
  const { campaign } = data;
  const [activeSlide, setActiveSlide] = useState(null);
  const slideRefs = useRef({});
  const observerRef = useRef(null);

  const gc = data.googleCopy || {};
  const gAds = data.googleAds || [];
  const searchCopy = gc['Search – Responsive Ad'];
  const calloutCopy = gc['Search Callout Extension'];
  const sitelinkCopy = gc['Structured Snippet Extension'];
  const demandGenSingle = gc['Demand Gen – Single Image Ad'];
  const demandGenImages = gAds.filter(g => g.type === 'Demand Gen');
  const searchImage = gAds.find(g => g.type === 'Search Image Extension') || gAds.find(g => g.type === 'Search');
  const logoAsset = gAds.find(g => g.type === 'Logo');
  const logoUrl = logoAsset?.imageUrl || '';

  const feedAds = adsByPlacement['Feed'] || [];
  const storyReelAds = adsByPlacement['StoryReel'] || [];

  // Build ordered slide list for TOC
  const slides = [];

  feedAds.forEach((ad, idx) => {
    slides.push({
      id: ad.id,
      section: 'Social Ads',
      label: ad.type === 'Carousel' ? 'Carousel' : `Single Image`,
      sublabel: ad.name,
      placement: 'Feed',
      type: 'feed',
      ad,
      adIndex: idx,
    });
  });

  storyReelAds.forEach((ad, idx) => {
    const subLabel = ad.subPlacements?.includes('Story') && ad.subPlacements?.includes('Reel')
      ? 'Story & Reel' : ad.subPlacements?.includes('Reel') ? 'Reel' : 'Story';
    slides.push({
      id: `sr-${ad.id}`,
      section: 'Social Ads',
      label: subLabel,
      sublabel: ad.name,
      placement: 'StoryReel',
      type: 'storyreel',
      ad,
      adIndex: idx,
    });
  });

  if (searchCopy) {
    slides.push({
      id: 'google-search',
      section: 'Google Ads',
      label: 'Search',
      sublabel: 'Responsive Search Ad',
      placement: 'Google',
      type: 'search',
    });
  }

  if (demandGenSingle && demandGenImages.length > 0) {
    slides.push({
      id: 'google-demandgen',
      section: 'Google Ads',
      label: 'Demand Gen',
      sublabel: 'Single Image Ad',
      placement: 'Google',
      type: 'demandgen',
    });
  }

  // IntersectionObserver to track active slide
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSlide(entry.target.dataset.slideId);
          }
        });
      },
      { rootMargin: '-30% 0px -50% 0px', threshold: 0 }
    );

    Object.values(slideRefs.current).forEach(el => {
      if (el) observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [slides.length]);

  const scrollToSlide = useCallback((slideId) => {
    const el = slideRefs.current[slideId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const registerRef = useCallback((slideId, el) => {
    if (el) slideRefs.current[slideId] = el;
  }, []);

  // Group slides by section for TOC
  const tocSections = [];
  let currentSection = null;
  slides.forEach(slide => {
    if (slide.section !== currentSection) {
      currentSection = slide.section;
      tocSections.push({ section: currentSection, items: [] });
    }
    tocSections[tocSections.length - 1].items.push(slide);
  });

  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <CampaignProvider campaign={campaign}>
      <div className="client-deck">
        {/* Sticky TOC Sidebar */}
        <nav className="client-toc">
          <div className="client-toc__header">
            <div className="client-toc__badge"><span>PD</span></div>
            <div>
              <div className="client-toc__project">{campaign.project}</div>
              <div className="client-toc__date">{dateStr}</div>
            </div>
          </div>

          <div className="client-toc__divider" />

          <div className="client-toc__nav">
            {tocSections.map(sec => (
              <div key={sec.section} className="client-toc__section">
                <div className="client-toc__section-label">{sec.section}</div>
                {sec.items.map((item, i) => (
                  <button
                    key={item.id}
                    className={`client-toc__item${activeSlide === item.id ? ' active' : ''}`}
                    onClick={() => scrollToSlide(item.id)}
                  >
                    <span className="client-toc__item-num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="client-toc__item-label">{item.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="client-toc__footer">
            <span className="client-toc__footer-brand">periphery</span>
            <span>Ad Preview</span>
          </div>
        </nav>

        {/* Slides */}
        <main className="client-slides">
          {/* Title slide */}
          <div className="client-slide client-slide--title" style={campaign.heroBackground ? {background:`url(${campaign.heroBackground}) center/cover no-repeat`} : undefined}>
            <div className="client-slide__hero-overlay" />
            <h1 className="client-slide__hero-title">{campaign.project}</h1>
            <p className="client-slide__hero-subtitle">Ad Preview</p>
            <p className="client-slide__hero-date">{dateStr}</p>
          </div>

          {/* Feed ad slides — multi-placement row */}
          {feedAds.map((ad, idx) => {
            const slideId = ad.id;
            return (
              <div
                key={slideId}
                className="client-slide"
                ref={el => registerRef(slideId, el)}
                data-slide-id={slideId}
              >
                <div className="client-slide__header">
                  <span className="client-slide__section">Social Ads</span>
                  <span className="client-slide__num">{String(idx + 1).padStart(2, '0')}</span>
                </div>
                <div className="client-slide__rule" />
                <h2 className="client-slide__title">
                  {ad.type === 'Carousel' ? 'Carousel' : 'Feed Placements'}
                </h2>
                <div className="client-slide__preview">
                  <div className="placement-row">
                    <div className="placement-col placement-col--feed">
                      <div className="placement-col__header">
                        <FacebookIcon /> <span className="placement-col__name">Facebook Feed</span> <span className="placement-col__dots">···</span>
                      </div>
                      <FeedCard ad={ad} adIndex={idx} isClient />
                    </div>
                    <div className="placement-col placement-col--feed">
                      <div className="placement-col__header">
                        <InstagramIcon /> <span className="placement-col__name">Instagram feed</span> <span className="placement-col__dots">···</span>
                      </div>
                      <InstagramFeedCard ad={ad} adIndex={idx} isClient />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Story/Reel ad slides — multi-placement row */}
          {storyReelAds.map((ad, idx) => {
            const slideId = `sr-${ad.id}`;
            return (
              <div
                key={slideId}
                className="client-slide"
                ref={el => registerRef(slideId, el)}
                data-slide-id={slideId}
              >
                <div className="client-slide__header">
                  <span className="client-slide__section">Social Ads</span>
                  <span className="client-slide__num">{String(feedAds.length + idx + 1).padStart(2, '0')}</span>
                </div>
                <div className="client-slide__rule" />
                <h2 className="client-slide__title">Stories, Status &amp; Reels</h2>
                <div className="client-slide__preview">
                  <div className="placement-row">
                    <div className="placement-col placement-col--story">
                      <div className="placement-col__header">
                        <InstagramIcon /> <span className="placement-col__name">Instagram Stories</span> <span className="placement-col__dots">···</span>
                      </div>
                      <StoryCard ad={ad} adIndex={idx} isClient />
                    </div>
                    <div className="placement-col placement-col--story">
                      <div className="placement-col__header">
                        <FacebookIcon /> <span className="placement-col__name">Facebook Stories</span> <span className="placement-col__dots">···</span>
                      </div>
                      <StoryCard ad={ad} adIndex={idx} isClient platform="facebook" />
                    </div>
                    <div className="placement-col placement-col--story">
                      <div className="placement-col__header">
                        <InstagramIcon /> <span className="placement-col__name">Instagram Reels</span> <span className="placement-col__dots">···</span>
                      </div>
                      <ReelCard ad={ad} adIndex={idx} isClient />
                    </div>
                    <div className="placement-col placement-col--story">
                      <div className="placement-col__header">
                        <FacebookIcon /> <span className="placement-col__name">Facebook Reels</span> <span className="placement-col__dots">···</span>
                      </div>
                      <ReelCard ad={ad} adIndex={idx} isClient platform="facebook" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Google Search slide */}
          {searchCopy && (
            <div
              className="client-slide"
              ref={el => registerRef('google-search', el)}
              data-slide-id="google-search"
            >
              <div className="client-slide__header">
                <span className="client-slide__section">Google Ads</span>
                <span className="client-slide__num">{String(feedAds.length + storyReelAds.length + 1).padStart(2, '0')}</span>
              </div>
              <div className="client-slide__rule" />
              <h2 className="client-slide__title">Google Search &amp; Image Extension</h2>
              <div className="client-slide__preview">
                <SearchAdCard
                  copy={searchCopy}
                  callouts={calloutCopy?.callouts}
                  sitelinks={sitelinkCopy?.sitelinks}
                  imageUrl={searchImage?.imageUrl}
                  amenities={sitelinkCopy?.amenities}
                />
              </div>
            </div>
          )}

          {/* Google Demand Gen slide */}
          {demandGenSingle && demandGenImages.length > 0 && (
            <div
              className="client-slide"
              ref={el => registerRef('google-demandgen', el)}
              data-slide-id="google-demandgen"
            >
              <div className="client-slide__header">
                <span className="client-slide__section">Google Ads</span>
                <span className="client-slide__num">
                  {String(feedAds.length + storyReelAds.length + (searchCopy ? 2 : 1)).padStart(2, '0')}
                </span>
              </div>
              <div className="client-slide__rule" />
              <h2 className="client-slide__title">Demand Gen &amp; Performance Max</h2>
              <div className="client-slide__preview">
                <DemandGenCard
                  copy={demandGenSingle}
                  imageUrl={(demandGenImages.find(g => g.dimensions === '1200x628') || demandGenImages[0])?.imageUrl}
                  dimensions={(demandGenImages.find(g => g.dimensions === '1200x628') || demandGenImages[0])?.dimensions}
                  logoUrl={logoUrl}
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="client-slide__footer">
            <span className="client-slide__footer-brand">periphery</span>
            <span>{campaign.project}</span>
            <span>Ad Preview</span>
          </div>
        </main>
      </div>
    </CampaignProvider>
  );
}
