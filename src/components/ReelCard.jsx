import { useState } from 'react';
import { useCampaign } from '../context/CampaignContext';
import { PlayIcon, ReelHeartIcon, ReelCommentIcon, ReelShareIcon, ReelRepostIcon } from './icons/Icons';
import PlaceholderCreative from './PlaceholderCreative';

export default function ReelCard({ ad, adIndex = 0, isClient }) {
  const campaign = useCampaign();
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const text = ad.copy.primary;
  const truncLen = 60;
  const needsTrunc = text.length > truncLen && !captionExpanded;

  return (
    <div className="reel-card">
      {ad.imageUrl?.includes('placehold.co') ? (
        <PlaceholderCreative concept={ad.concept} index={adIndex} style={{position:'absolute',inset:0,width:'100%',height:'100%'}} />
      ) : ad.isVideo && ad.videoUrl ? (
        <video className="reel-bg" src={ad.videoUrl} poster={ad.imageUrl} autoPlay loop muted playsInline />
      ) : (
        ad.imageUrl && <img className="reel-bg" src={ad.imageUrl} alt={ad.concept} />
      )}
      {/* Gradient at bottom */}
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:'55%',background:'linear-gradient(transparent, rgba(0,0,0,.75))',pointerEvents:'none',zIndex:1}}></div>

      {/* Right-side icon stack — matches real Reels */}
      <div className="reel-icon-stack">
        <div className="reel-icon-item">
          <ReelHeartIcon />
          <span className="reel-icon-count">1.2K</span>
        </div>
        <div className="reel-icon-item">
          <ReelCommentIcon />
          <span className="reel-icon-count">48</span>
        </div>
        <div className="reel-icon-item">
          <ReelShareIcon />
        </div>
        <div className="reel-icon-item">
          <ReelRepostIcon />
        </div>
        {/* Spinning music disc */}
        <div className="reel-music-disc" title="Original audio"></div>
      </div>

      <div className="reel-overlay" style={{zIndex:2}}>
        {ad.isVideo && !ad.videoUrl && (
          <div className="video-badge" style={{position:'absolute',top:'38%',left:'50%',transform:'translate(-50%,-50%)'}}><PlayIcon /></div>
        )}

        {ad.subPlacements && ad.subPlacements.length > 1 && (
          <div className="multi-badge" style={{top:12}}>{ad.subPlacements.join(" + ")}</div>
        )}

        <div className="reel-bottom">
          {/* Page name row with Sponsored + Follow */}
          <div className="reel-page-row">
            <div className="reel-avatar">
              <span style={{color:'#fff',fontWeight:700,fontSize:10}}>{campaign.project.charAt(0)}</span>
            </div>
            <span className="reel-page-name">{campaign.developer || campaign.project}</span>
            <span className="reel-sponsored-inline">· Sponsored</span>
            <button className="reel-follow-btn">Follow</button>
          </div>
          {/* Caption — click "...more" to expand */}
          <div className="reel-caption" style={captionExpanded ? {WebkitLineClamp:'unset',display:'block'} : {}}>
            {needsTrunc ? <>{text.slice(0, truncLen)}<span className="more-link" onClick={() => setCaptionExpanded(true)}>...more</span></> : text}
          </div>
          {/* Full-width CTA */}
          <button className="reel-cta-btn">{ad.copy.cta}</button>
        </div>
      </div>

      {!isClient && (
        <div className="internal-bar-dark">
          <div className="ad-name">{ad.name}</div>
          <div>{ad.files.length} file{ad.files.length>1?"s":""} · {ad.concept}</div>
        </div>
      )}
    </div>
  );
}
