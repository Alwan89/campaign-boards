import { useEffect } from 'react';
import FeedCard from '../FeedCard';
import StoryCard from '../StoryCard';
import ReelCard from '../ReelCard';
import { SearchAdCard, DemandGenCard } from '../GoogleAdCards';
import CopyInspector from './CopyInspector';

/**
 * Slide-over drawer from the right for ad detail inspection.
 * Shows full-size ad card, copy fields, and (future) feedback panel.
 */
export default function AdDetailPanel({ ad, adIndex, type, onClose, landingPage, googleProps }) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const renderCard = () => {
    if (type === 'feed') return <FeedCard ad={ad} adIndex={adIndex} isClient />;
    if (type === 'story') return <StoryCard ad={ad} adIndex={adIndex} isClient />;
    if (type === 'reel') return <ReelCard ad={ad} adIndex={adIndex} isClient />;
    if (type === 'search' && googleProps) return <SearchAdCard {...googleProps} />;
    if (type === 'demandgen' && googleProps) return <DemandGenCard {...googleProps} />;
    return null;
  };

  const isGoogleAd = type === 'search' || type === 'demandgen';

  return (
    <>
      {/* Backdrop */}
      <div className="detail-panel__backdrop" onClick={onClose} />

      {/* Panel */}
      <div className="detail-panel">
        {/* Header */}
        <div className="detail-panel__header">
          <div>
            <h3 className="detail-panel__title">{ad?.name || googleProps?.label || 'Ad Detail'}</h3>
            {ad?.type && <span className="detail-panel__subtitle">{ad.type} &middot; {ad.concept || ad.placement}</span>}
          </div>
          <button className="detail-panel__close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="detail-panel__content">
          {/* Full-size ad card */}
          <div className={`detail-panel__card detail-panel__card--${type}`}>
            {renderCard()}
          </div>

          {/* Copy inspector (Meta ads only) */}
          {!isGoogleAd && ad && (
            <CopyInspector ad={ad} landingPage={landingPage} />
          )}

          {/* Feedback placeholder — Phase 3 */}
          <div className="detail-panel__feedback-placeholder">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            <span>Feedback &amp; approval coming soon</span>
          </div>
        </div>
      </div>
    </>
  );
}
