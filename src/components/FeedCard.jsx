import { useState } from 'react';
import { useCampaign } from '../context/CampaignContext';
import { GlobeIcon, EllipsisIcon, LikeReactionIcon, LoveReactionIcon, ThumbIcon, CommentIcon, ShareIcon } from './icons/Icons';
import CarouselCreative from './CarouselCreative';
import PlaceholderCreative from './PlaceholderCreative';

export default function FeedCard({ ad, adIndex = 0, isClient }) {
  const campaign = useCampaign();
  const [expanded, setExpanded] = useState(false);
  const text = ad.copy.primary;
  const truncLen = 125;
  const needsTrunc = text.length > truncLen && !expanded;

  return (
    <div className="fb-card">
      {/* Header — avatar, page name, Sponsored · globe, three-dot menu only */}
      <div className="fb-card-header">
        <div className="fb-avatar">
          <span style={{color:'var(--periphery)',fontWeight:700,fontSize:17}}>{campaign.project.charAt(0)}</span>
        </div>
        <div className="fb-page-info">
          <div className="fb-page-name">{campaign.developer || campaign.project}</div>
          <div className="fb-sponsored">
            Sponsored · <GlobeIcon />
          </div>
        </div>
        <div className="fb-header-actions">
          <span className="fb-header-btn" title="More options">
            <EllipsisIcon />
          </span>
        </div>
      </div>

      {/* Primary text */}
      <div className="fb-primary-text">
        {needsTrunc ? (
          <>{text.slice(0, truncLen)}... <span className="see-more" onClick={() => setExpanded(true)}>See more</span></>
        ) : text}
      </div>

      {/* Creative */}
      {ad.type === "Carousel" ? (
        <CarouselCreative ad={ad} />
      ) : (
        <div className="fb-creative" style={{position:'relative'}}>
          {ad.imageUrl?.includes('placehold.co') ? (
            <PlaceholderCreative concept={ad.concept} index={adIndex} style={{width:'100%',aspectRatio:'1.91/1'}} />
          ) : ad.isVideo && ad.videoUrl ? (
            <video src={ad.videoUrl} poster={ad.imageUrl} autoPlay loop muted playsInline style={{width:'100%',display:'block'}} />
          ) : (
            <>
              <img src={ad.imageUrl} alt={ad.concept} />
              {ad.isVideo && !ad.videoUrl && <div className="video-badge"><svg viewBox="0 0 24 24"><polygon points="6,3 20,12 6,21"/></svg></div>}
            </>
          )}
        </div>
      )}

      {/* Link bar (single image / video) */}
      {ad.type !== "Carousel" && (
        <div className="fb-link-bar">
          <div className="fb-link-left">
            <div className="fb-link-domain">{campaign.landing_page}</div>
            <div className="fb-link-headline">{ad.copy.headline}</div>
            {ad.copy.description && <div className="fb-link-desc">{ad.copy.description}</div>}
          </div>
          <button className="fb-cta-button">{ad.copy.cta}</button>
        </div>
      )}

      {/* Engagement row — realistic Facebook layout */}
      <div className="fb-engagement-wrap">
        <div className="fb-reactions-row">
          <div className="fb-reactions-left">
            <span className="fb-reactions-icons">
              <span className="r-icon" style={{zIndex:2}}>
                <LikeReactionIcon />
              </span>
              <span className="r-icon" style={{zIndex:1}}>
                <LoveReactionIcon />
              </span>
            </span>
            <span>128</span>
          </div>
          <div className="fb-reactions-right">24 Comments · 8 Shares</div>
        </div>
        <div className="fb-actions-row">
          <button className="fb-action-btn"><ThumbIcon /> Like</button>
          <button className="fb-action-btn"><CommentIcon /> Comment</button>
          <button className="fb-action-btn"><ShareIcon /> Share</button>
        </div>
      </div>

      {/* Internal details */}
      {!isClient && (
        <div className="internal-bar">
          <div className="ad-name">{ad.name}</div>
          <div className="meta-row">
            <span>{ad.type}</span><span>·</span>
            <span>{ad.files.length} file{ad.files.length>1?"s":""}</span><span>·</span>
            <span>Concept: {ad.concept}</span>
          </div>
          <div>{ad.files.map((f,i) => <span key={i} className="file-tag">{f}</span>)}</div>
        </div>
      )}
    </div>
  );
}
