import { useCampaign } from '../context/CampaignContext';
import { PlayIcon, LinkIcon } from './icons/Icons';
import PlaceholderCreative from './PlaceholderCreative';

export default function StoryCard({ ad, adIndex = 0, isClient }) {
  const campaign = useCampaign();

  return (
    <div className="story-card">
      {ad.imageUrl?.includes('placehold.co') ? (
        <PlaceholderCreative concept={ad.concept} index={adIndex} style={{position:'absolute',inset:0,width:'100%',height:'100%'}} />
      ) : ad.isVideo && ad.videoUrl ? (
        <video className="story-bg" src={ad.videoUrl} poster={ad.imageUrl} autoPlay loop muted playsInline />
      ) : (
        ad.imageUrl && <img className="story-bg" src={ad.imageUrl} alt={ad.concept} />
      )}
      <div className="story-overlay">
        <div className="story-top">
          {/* Progress bars — rounded, 3px height */}
          <div className="story-progress">
            <div className="story-progress-bar active"></div>
            <div className="story-progress-bar"></div>
            <div className="story-progress-bar"></div>
          </div>
          {/* Header: avatar, name · Sponsored, close */}
          <div className="story-header-row">
            <div className="story-avatar">
              <span style={{color:'#fff',fontWeight:700,fontSize:11}}>{campaign.project.charAt(0)}</span>
            </div>
            <div className="story-name-wrap">
              <div className="story-page-name">
                {campaign.developer || campaign.project}
                <span style={{fontWeight:400,opacity:.65,fontSize:11}}> · Sponsored</span>
              </div>
            </div>
            <span className="story-close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </span>
          </div>
        </div>

        {ad.isVideo && !ad.videoUrl && (
          <div className="video-badge" style={{position:'absolute',top:'42%',left:'50%',transform:'translate(-50%,-50%)'}}><PlayIcon /></div>
        )}

        {ad.subPlacements && ad.subPlacements.length > 1 && (
          <div className="multi-badge">{ad.subPlacements.join(" + ")}</div>
        )}

        {/* Bottom: CTA pill only (no swipe-up — removed in 2021) */}
        <div className="story-bottom">
          <div className="story-cta-pill">
            <LinkIcon />
            {ad.copy.cta}
          </div>
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
