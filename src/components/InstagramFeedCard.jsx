import { useState } from 'react';
import { useCampaign } from '../context/CampaignContext';
import PlaceholderCreative from './PlaceholderCreative';

export default function InstagramFeedCard({ ad, adIndex = 0, isClient }) {
  const campaign = useCampaign();
  const pageName = campaign.pageName || campaign.developer || campaign.project;
  const handle = pageName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const isCarousel = ad.type === 'Carousel' && ad.carouselCards?.length > 1;
  const [cardIdx, setCardIdx] = useState(0);

  return (
    <div className="ig-card">
      {/* Instagram header bar */}
      <div className="ig-card__topbar">
        <span className="ig-card__topbar-title">Instagram</span>
      </div>

      {/* User row */}
      <div className="ig-card__user-row">
        <div className="ig-card__avatar">
          {campaign.pageAvatar
            ? <img src={campaign.pageAvatar} alt={pageName} />
            : <span>{pageName.charAt(0)}</span>
          }
        </div>
        <div className="ig-card__user-info">
          <span className="ig-card__username">{handle}</span>
          <span className="ig-card__ad-badge">Ad</span>
        </div>
        <svg className="ig-card__menu" width="16" height="16" viewBox="0 0 20 20" fill="#262626">
          <circle cx="4" cy="10" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="16" cy="10" r="1.5"/>
        </svg>
      </div>

      {/* Creative image / carousel */}
      <div className="ig-card__creative" style={{position:'relative'}}>
        {isCarousel ? (
          <>
            <img src={ad.carouselCards[cardIdx].imageUrl} alt={ad.carouselCards[cardIdx].headline} />
            {cardIdx > 0 && (
              <button className="ig-carousel-nav left" onClick={() => setCardIdx(i => i - 1)}>&#8249;</button>
            )}
            {cardIdx < ad.carouselCards.length - 1 && (
              <button className="ig-carousel-nav right" onClick={() => setCardIdx(i => i + 1)}>&#8250;</button>
            )}
            <div className="ig-carousel-dots">
              {ad.carouselCards.map((_, i) => (
                <span key={i} className={`ig-carousel-dot${i === cardIdx ? ' active' : ''}`} onClick={() => setCardIdx(i)} />
              ))}
            </div>
          </>
        ) : ad.imageUrl?.includes('placehold.co') ? (
          <PlaceholderCreative concept={ad.concept} index={adIndex} style={{width:'100%',aspectRatio:'1/1'}} />
        ) : ad.isVideo && ad.videoUrl ? (
          <video src={ad.videoUrl} poster={ad.imageUrl} autoPlay loop muted playsInline style={{width:'100%',display:'block'}} />
        ) : (
          <img src={ad.imageUrl} alt={ad.concept} />
        )}
      </div>

      {/* CTA row */}
      <div className="ig-card__cta-row">
        {isCarousel ? (
          <span className="ig-card__cta-text">{ad.carouselCards[cardIdx].headline}</span>
        ) : (
          <span className="ig-card__cta-text">{ad.copy.cta || 'Sign up'}</span>
        )}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0095f6" strokeWidth="3">
          <polyline points="9,6 15,12 9,18"/>
        </svg>
      </div>

      {/* Action icons */}
      <div className="ig-card__actions">
        <div className="ig-card__actions-left">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.5">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.5">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/>
          </svg>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.5">
          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
        </svg>
      </div>

      {/* Caption */}
      <div className="ig-card__caption">
        <span className="ig-card__caption-user">{handle}</span>
        {' '}{ad.copy.primary?.slice(0, 60)}
        {ad.copy.primary?.length > 60 && <span className="ig-card__caption-more"> ...more</span>}
      </div>
    </div>
  );
}
