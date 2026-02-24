import { useCampaign } from '../context/CampaignContext';
import { PlayIcon } from './icons/Icons';
import PlaceholderCreative from './PlaceholderCreative';

export default function StoryCard({ ad, adIndex = 0, isClient, platform = 'instagram' }) {
  const campaign = useCampaign();
  const pageName = campaign.pageName || campaign.developer || campaign.project;
  const isFB = platform === 'facebook';

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
          {!isFB && (
            <div className="story-progress">
              <div className="story-progress-bar active"></div>
              <div className="story-progress-bar"></div>
              <div className="story-progress-bar"></div>
            </div>
          )}
          <div className="story-header-row">
            <div className="story-avatar">
              {campaign.pageAvatar
                ? <img src={campaign.pageAvatar} alt={pageName} />
                : <span style={{color:'#fff',fontWeight:700,fontSize:11}}>{pageName.charAt(0)}</span>
              }
            </div>
            <div className="story-name-wrap">
              <div className="story-page-name">
                {pageName}
                {isFB
                  ? <><br/><span style={{fontWeight:400,opacity:.65,fontSize:10}}>Ad</span></>
                  : <span style={{fontWeight:400,opacity:.65,fontSize:11}}> · Sponsored</span>
                }
              </div>
            </div>
            <span className="story-close" style={{marginRight:2}}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="rgba(255,255,255,.8)">
                <circle cx="4" cy="10" r="1.5"/>
                <circle cx="10" cy="10" r="1.5"/>
                <circle cx="16" cy="10" r="1.5"/>
              </svg>
            </span>
            <span className="story-close">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </span>
          </div>
        </div>

        {ad.isVideo && !ad.videoUrl && (
          <div className="video-badge" style={{position:'absolute',top:'42%',left:'50%',transform:'translate(-50%,-50%)'}}><PlayIcon /></div>
        )}

        {ad.subPlacements && ad.subPlacements.length > 1 && (
          <div className="multi-badge">{ad.subPlacements.join(" + ")}</div>
        )}

        <div className="story-bottom">
          {isFB ? (
            <div className="story-cta-pill">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{marginRight:4}}>
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              {ad.copy.cta || 'Sign up'}
            </div>
          ) : (
            <div className="story-cta-pill">
              {ad.copy.cta || 'Learn More'}
            </div>
          )}
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
