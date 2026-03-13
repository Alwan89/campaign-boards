import { useState, useEffect } from 'react';
import FeedCard from '../FeedCard';
import StoryCard from '../StoryCard';
import ReelCard from '../ReelCard';
import { SearchAdCard, DemandGenCard } from '../GoogleAdCards';
import CopyInspector from './CopyInspector';

/**
 * Slide-over drawer from the right for ad detail inspection.
 * Shows full-size ad card, copy fields, and feedback panel.
 */
export default function AdDetailPanel({ ad, adIndex, type, onClose, landingPage, googleProps, feedback, onFeedback }) {
  const [status, setStatus] = useState(feedback?.status || null);
  const [comment, setComment] = useState('');
  const comments = feedback?.comments || [];

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
  const adId = ad?.id || type;

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    if (onFeedback) {
      onFeedback(adId, { status: newStatus, comments });
    }
  };

  const handleSubmitComment = () => {
    if (!comment.trim()) return;
    const newComment = {
      text: comment.trim(),
      status,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
    const updated = [...comments, newComment];
    setComment('');
    if (onFeedback) {
      onFeedback(adId, { status, comments: updated });
    }
  };

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

          {/* Feedback form */}
          <div className="feedback-form">
            <div className="feedback-form__header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              <span>Feedback</span>
            </div>
            <div className="feedback-form__body">
              {/* Status buttons */}
              <div className="feedback-status">
                <button
                  className={`feedback-status__btn feedback-status__btn--approved${status === 'approved' ? ' selected' : ''}`}
                  onClick={() => handleStatusChange('approved')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  Approved
                </button>
                <button
                  className={`feedback-status__btn feedback-status__btn--changes${status === 'changes' ? ' selected' : ''}`}
                  onClick={() => handleStatusChange('changes')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Request Changes
                </button>
              </div>

              {/* Comment textarea */}
              <div className="feedback-textarea-wrap">
                <textarea
                  className="feedback-textarea"
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  maxLength={500}
                />
                <span className="feedback-textarea-count">{comment.length}/500</span>
              </div>

              <button
                className="feedback-submit"
                disabled={!comment.trim()}
                onClick={handleSubmitComment}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/>
                </svg>
                Add Comment
              </button>

              {/* Comment list */}
              {comments.length > 0 && (
                <div className="feedback-comments">
                  {comments.map((c, i) => (
                    <div key={i} className="feedback-comment">
                      <div className="feedback-comment__meta">
                        <span className="feedback-comment__time">{c.time}</span>
                        {c.status && (
                          <span className={`feedback-comment__status feedback-comment__status--${c.status}`}>
                            {c.status === 'approved' ? 'Approved' : 'Changes Requested'}
                          </span>
                        )}
                      </div>
                      <div>{c.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
