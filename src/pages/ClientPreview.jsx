import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CampaignProvider } from '../context/CampaignContext';
import FeedCard from '../components/FeedCard';
import InstagramFeedCard from '../components/InstagramFeedCard';
import StoryCard from '../components/StoryCard';
import ReelCard from '../components/ReelCard';
import { SearchAdCard, DemandGenCard } from '../components/GoogleAdCards';
import AdDetailPanel from '../components/client/AdDetailPanel';

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

function formatMonthLabel(dateStr) {
  if (!dateStr) return 'View';
  const [y, m] = dateStr.split('-');
  const d = new Date(Number(y), Number(m) - 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Client view — slide-based presentation with sticky left TOC.
 * Each ad variation is a full-width "slide" with a large centered preview.
 */
export default function ClientPreview({ data, adsState, adsByPlacement, siblingMonths = [], currentSlug }) {
  const { campaign } = data;
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(null);
  const [detailAd, setDetailAd] = useState(null);
  const [adFeedback, setAdFeedback] = useState({});
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [overallStatus, setOverallStatus] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState(new Set());
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const slideRefs = useRef({});
  const observerRef = useRef(null);
  const monthDropdownRef = useRef(null);

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
      label: ad.type === 'Carousel' ? 'Carousel' : ad.isVideo ? 'Video' : 'Single Image',
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

  // All reviewable ad IDs
  const allAdIds = slides.map(s => s.ad?.id || s.id);
  const reviewedCount = allAdIds.filter(id => adFeedback[id]?.status).length;
  const totalAds = allAdIds.length;

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

  // Close month dropdown on click outside
  useEffect(() => {
    if (!showMonthDropdown) return;
    const handleClick = (e) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(e.target)) {
        setShowMonthDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMonthDropdown]);

  const scrollToSlide = useCallback((slideId) => {
    const el = slideRefs.current[slideId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const registerRef = useCallback((slideId, el) => {
    if (el) slideRefs.current[slideId] = el;
  }, []);

  // Feedback handler
  const handleFeedback = useCallback((adId, fb) => {
    setAdFeedback(prev => ({ ...prev, [adId]: fb }));
  }, []);

  // Open detail panel — skip if click was on an interactive child (button, toggle, tab)
  const openDetail = useCallback((e, ad, adIndex, type, googleProps) => {
    if (e.target.closest('button, a, [role="button"], [role="tab"], select, input')) return;
    setDetailAd({ ad, adIndex, type, googleProps });
  }, []);

  // Auto-expand collapsed section when scroll spy activates an item in it
  useEffect(() => {
    if (!activeSlide) return;
    const slideData = slides.find(s => s.id === activeSlide);
    if (!slideData) return;
    let key;
    if (slideData.type === 'feed') key = 'feed';
    else if (slideData.type === 'storyreel') key = 'storyreel';
    else if (slideData.placement === 'Google') key = 'google';
    if (key) {
      setCollapsedSections(prev => {
        if (!prev.has(key)) return prev;
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, [activeSlide, slides.length]);

  // Build collapsible TOC sub-sections
  const tocSubsections = [];
  const feedSlides = slides.filter(s => s.type === 'feed');
  const storyReelSlides = slides.filter(s => s.type === 'storyreel');
  const googleSlides = slides.filter(s => s.placement === 'Google');
  if (feedSlides.length > 0) tocSubsections.push({ key: 'feed', label: 'Feed', count: feedSlides.length, items: feedSlides });
  if (storyReelSlides.length > 0) tocSubsections.push({ key: 'storyreel', label: 'Stories & Reels', count: storyReelSlides.length, items: storyReelSlides });
  if (googleSlides.length > 0) tocSubsections.push({ key: 'google', label: 'Google Ads', count: googleSlides.length, items: googleSlides });

  const toggleSection = useCallback((key) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Google props builders
  const searchGoogleProps = searchCopy ? {
    label: 'Google Search Ad',
    copy: searchCopy,
    callouts: calloutCopy?.callouts,
    sitelinks: sitelinkCopy?.sitelinks,
    imageUrl: searchImage?.imageUrl,
    amenities: sitelinkCopy?.amenities,
  } : null;

  const demandGenGoogleProps = (demandGenSingle && demandGenImages.length > 0) ? {
    label: 'Demand Gen Ad',
    copy: demandGenSingle,
    imageUrl: (demandGenImages.find(g => g.dimensions === '1200x628') || demandGenImages[0])?.imageUrl,
    dimensions: (demandGenImages.find(g => g.dimensions === '1200x628') || demandGenImages[0])?.dimensions,
    logoUrl,
  } : null;

  // Helper: render review badge for an ad
  const renderReviewBadge = (adId) => {
    const fb = adFeedback[adId];
    if (!fb?.status) return null;
    return (
      <div className={`client-slide__review-badge client-slide__review-badge--${fb.status}`}>
        {fb.status === 'approved' ? 'Approved' : 'Changes'}
      </div>
    );
  };

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

          {siblingMonths.length > 1 && (
            <div className="client-toc__month-dropdown" ref={monthDropdownRef}>
              <button
                className="client-toc__month-trigger"
                onClick={() => setShowMonthDropdown(prev => !prev)}
              >
                <span>{formatMonthLabel(siblingMonths.find(s => s.slug === currentSlug)?.date)}</span>
                <span className="client-toc__month-count">{siblingMonths.length} months</span>
                <svg className={`client-toc__month-chevron${showMonthDropdown ? ' open' : ''}`} width="10" height="10" viewBox="0 0 24 24">
                  <polyline points="6,9 12,15 18,9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showMonthDropdown && (
                <div className="client-toc__month-list">
                  {siblingMonths.map(s => (
                    <button
                      key={s.slug}
                      className={`client-toc__month-list-item${s.slug === currentSlug ? ' active' : ''}`}
                      onClick={() => { navigate(`/${s.slug}?view=client`); setShowMonthDropdown(false); }}
                    >
                      {formatMonthLabel(s.date)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="client-toc__nav">
            {tocSubsections.map(sub => {
              const isCollapsed = collapsedSections.has(sub.key);
              return (
                <div key={sub.key} className="client-toc__subsection">
                  <button className="client-toc__subsection-header" onClick={() => toggleSection(sub.key)}>
                    <svg className={`client-toc__chevron${isCollapsed ? '' : ' open'}`} width="10" height="10" viewBox="0 0 24 24">
                      <polyline points="9,6 15,12 9,18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{sub.label}</span>
                    <span className="client-toc__subsection-count">{sub.count}</span>
                  </button>
                  {!isCollapsed && (
                    <div className="client-toc__subsection-items">
                      {sub.items.map(item => {
                        const globalIdx = slides.indexOf(item) + 1;
                        const adId = item.ad?.id || item.id;
                        const fbStatus = adFeedback[adId]?.status;
                        return (
                          <button
                            key={item.id}
                            className={`client-toc__item${activeSlide === item.id ? ' active' : ''}`}
                            onClick={() => scrollToSlide(item.id)}
                          >
                            <span className="client-toc__item-num">{String(globalIdx).padStart(2, '0')}</span>
                            <span className="client-toc__item-label">{item.label}</span>
                            {fbStatus && <span className={`client-toc__item-status client-toc__item-status--${fbStatus}`} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
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
                  {ad.type === 'Carousel' ? 'Carousel' : ad.isVideo ? 'Video' : 'Feed Placements'}
                </h2>
                <div
                  className="client-slide__preview client-slide__ad-clickable"
                  onClick={(e) => openDetail(e, ad, idx, 'feed')}
                >
                  {renderReviewBadge(ad.id)}
                  <span className="client-slide__click-hint">Click to review</span>
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
                <div
                  className="client-slide__preview client-slide__ad-clickable"
                  onClick={(e) => openDetail(e, ad, idx, ad.subPlacements?.includes('Story') ? 'story' : 'reel')}
                >
                  {renderReviewBadge(ad.id)}
                  <span className="client-slide__click-hint">Click to review</span>
                  <div className="placement-row">
                    {(!ad.subPlacements || ad.subPlacements.includes('Story')) && (
                      <>
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
                      </>
                    )}
                    {(!ad.subPlacements || ad.subPlacements.includes('Reel')) && (
                      <>
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
                      </>
                    )}
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
              <div
                className="client-slide__preview client-slide__ad-clickable"
                onClick={(e) => openDetail(e, null, 0, 'search', searchGoogleProps)}
              >
                {renderReviewBadge('google-search')}
                <span className="client-slide__click-hint">Click to review</span>
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
              <div
                className="client-slide__preview client-slide__ad-clickable"
                onClick={(e) => openDetail(e, null, 0, 'demandgen', demandGenGoogleProps)}
              >
                {renderReviewBadge('google-demandgen')}
                <span className="client-slide__click-hint">Click to review</span>
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

          {/* Approval footer bar */}
          <div className="approval-footer">
            <div className="approval-footer__progress">
              <span>{reviewedCount} of {totalAds} reviewed</span>
              <div className="approval-footer__bar">
                <div
                  className="approval-footer__bar-fill"
                  style={{ width: totalAds > 0 ? `${(reviewedCount / totalAds) * 100}%` : '0%' }}
                />
              </div>
            </div>
            <div className="approval-footer__actions">
              <button
                className="approval-footer__btn approval-footer__btn--changes"
                onClick={() => { setOverallStatus('changes'); setShowApprovalModal(true); }}
              >
                Request Changes
              </button>
              <button
                className="approval-footer__btn approval-footer__btn--approve"
                onClick={() => { setOverallStatus('approved'); setShowApprovalModal(true); }}
              >
                Approve All
              </button>
            </div>
          </div>
        </main>

        {/* Ad Detail Panel */}
        {detailAd && (
          <AdDetailPanel
            ad={detailAd.ad}
            adIndex={detailAd.adIndex}
            type={detailAd.type}
            onClose={() => setDetailAd(null)}
            landingPage={campaign.landingPage}
            googleProps={detailAd.googleProps}
            feedback={adFeedback[detailAd.ad?.id || detailAd.type]}
            onFeedback={handleFeedback}
          />
        )}

        {/* Approval Summary Modal */}
        {showApprovalModal && (
          <div className="approval-modal__backdrop" onClick={() => setShowApprovalModal(false)}>
            <div className="approval-modal" onClick={e => e.stopPropagation()}>
              <div className="approval-modal__header">
                <h3 className="approval-modal__title">
                  {overallStatus === 'approved' ? 'Approve All Ads' : 'Request Changes'}
                </h3>
                <button className="detail-panel__close" onClick={() => setShowApprovalModal(false)} aria-label="Close">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="approval-modal__body">
                {slides.map(slide => {
                  const adId = slide.ad?.id || slide.id;
                  const fb = adFeedback[adId];
                  const st = fb?.status || 'pending';
                  return (
                    <div key={slide.id} className="approval-modal__item">
                      <div className={`approval-modal__dot approval-modal__dot--${st}`} />
                      <span style={{flex:1}}>{slide.ad?.name || slide.sublabel || slide.label}</span>
                      <span style={{fontSize:11,color:'var(--text-tertiary)',textTransform:'capitalize'}}>{st}</span>
                    </div>
                  );
                })}
              </div>
              <div className="approval-modal__footer">
                <button
                  className="feedback-submit"
                  onClick={() => setShowApprovalModal(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CampaignProvider>
  );
}
