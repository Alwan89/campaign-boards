import { useState } from 'react';
import { useCampaign } from '../context/CampaignContext';
import { PlayIcon, ReelHeartIcon, ReelCommentIcon, ReelShareIcon } from './icons/Icons';
import PlaceholderCreative from './PlaceholderCreative';

export default function ReelCard({ ad, adIndex = 0, isClient, platform = 'instagram' }) {
  const campaign = useCampaign();
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const text = ad.copy.primary;
  const truncLen = 80;
  const needsTrunc = text.length > truncLen && !captionExpanded;
  const pageName = campaign.pageName || campaign.developer || campaign.project;
  const isFB = platform === 'facebook';

  return (
    <div className="reel-card">
      {/* Background creative */}
      {ad.imageUrl?.includes('placehold.co') ? (
        <PlaceholderCreative concept={ad.concept} index={adIndex} style={{position:'absolute',inset:0,width:'100%',height:'100%'}} />
      ) : ad.isVideo && ad.videoUrl ? (
        <video className="reel-bg" src={ad.videoUrl} poster={ad.imageUrl} autoPlay loop muted playsInline />
      ) : (
        ad.imageUrl && <img className="reel-bg" src={ad.imageUrl} alt={ad.concept} />
      )}

      {/* Top header — IG "Reels" or FB page name */}
      <div style={{
        position:'absolute',top:0,left:0,right:0,zIndex:5,
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'3% 7.4% 0',
      }}>
        {isFB ? (
          <>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <div className="reel-avatar" style={{width:26,height:26}}>
                {campaign.pageAvatar
                  ? <img src={campaign.pageAvatar} alt={pageName} />
                  : <span style={{color:'#fff',fontWeight:700,fontSize:9}}>{pageName.charAt(0)}</span>
                }
              </div>
              <span style={{fontSize:13,fontWeight:600,color:'#fff',textShadow:'0 1px 4px rgba(0,0,0,.5)'}}>{pageName}</span>
            </div>
            <div style={{display:'flex',gap:8}}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="rgba(255,255,255,.8)">
                <circle cx="4" cy="10" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="16" cy="10" r="1.5"/>
              </svg>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
          </>
        ) : (
          <>
            <span style={{fontSize:16,fontWeight:700,color:'#fff',textShadow:'0 1px 4px rgba(0,0,0,.5)',letterSpacing:'-.2px'}}>
              Reels
            </span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{filter:'drop-shadow(0 1px 3px rgba(0,0,0,.4))'}}>
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </>
        )}
      </div>

      {/* Bottom gradient */}
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:'40%',background:'linear-gradient(transparent, rgba(0,0,0,.65))',pointerEvents:'none',zIndex:1}}></div>

      {/* Right-side icon stack */}
      <div className="reel-icon-stack">
        <div className="reel-icon-item">
          {isFB ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{filter:'drop-shadow(0 1px 3px rgba(0,0,0,.5))'}}>
              <path d="M14 9V5a3 3 0 00-6 0v.5"/><path d="M5 12h1a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1v-5a1 1 0 011-1z"/><path d="M9 18l1.5.9A2 2 0 0011.6 19H16a2 2 0 002-1.7l.7-5A2 2 0 0016.8 10H12V5.5"/>
            </svg>
          ) : <ReelHeartIcon />}
        </div>
        <div className="reel-icon-item">
          <ReelCommentIcon />
        </div>
        {!isFB && (
          <>
            <div className="reel-icon-item">
              <ReelShareIcon />
            </div>
            <div className="reel-icon-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{filter:'drop-shadow(0 1px 3px rgba(0,0,0,.5))'}}>
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
              </svg>
            </div>
            <div className="reel-icon-item">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="#fff" style={{filter:'drop-shadow(0 1px 3px rgba(0,0,0,.5))'}}>
                <circle cx="10" cy="4" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="10" cy="16" r="1.5"/>
              </svg>
            </div>
            <div style={{
              width:24,height:24,borderRadius:5,overflow:'hidden',
              border:'1.5px solid rgba(255,255,255,.4)',marginTop:4,
            }}>
              {ad.imageUrl && !ad.imageUrl.includes('placehold.co') ? (
                <img src={ad.imageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
              ) : (
                <div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)'}} />
              )}
            </div>
          </>
        )}
      </div>

      <div className="reel-overlay" style={{zIndex:2}}>
        {ad.isVideo && !ad.videoUrl && (
          <div className="video-badge" style={{position:'absolute',top:'38%',left:'50%',transform:'translate(-50%,-50%)'}}><PlayIcon /></div>
        )}

        <div className="reel-bottom">
          {isFB ? (
            /* Facebook Reels bottom — caption + CTA + Ad badge */
            <>
              <div style={{fontSize:13,fontWeight:600,color:'#fff',textShadow:'0 1px 3px rgba(0,0,0,.5)',marginBottom:4}}>
                {pageName}
              </div>
              <div className="reel-caption" style={captionExpanded ? {WebkitLineClamp:'unset',display:'block'} : {}}>
                {needsTrunc ? <>{text.slice(0, truncLen)}<span className="more-link" onClick={() => setCaptionExpanded(true)}>...more</span></> : text}
              </div>
              <div style={{
                display:'flex',alignItems:'center',justifyContent:'center',
                width:'100%',padding:'8px 14px',marginTop:6,
                background:'rgba(255,255,255,.95)',borderRadius:7,
                fontSize:13,fontWeight:600,color:'#000',cursor:'pointer',
                boxShadow:'0 1px 4px rgba(0,0,0,.2)',
              }}>
                {ad.copy.cta || 'Sign Up'}
              </div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:6}}>
                <span style={{fontSize:10,color:'rgba(255,255,255,.5)'}}>Ad</span>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="rgba(255,255,255,.5)">
                  <circle cx="4" cy="10" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="16" cy="10" r="1.5"/>
                </svg>
              </div>
            </>
          ) : (
            /* Instagram Reels bottom — page row + caption + audio + CTA */
            <>
              <div style={{marginBottom:6}}>
                <div className="reel-page-row" style={{marginBottom:2}}>
                  <div className="reel-avatar">
                    {campaign.pageAvatar
                      ? <img src={campaign.pageAvatar} alt={pageName} />
                      : <span style={{color:'#fff',fontWeight:700,fontSize:11}}>{pageName.charAt(0)}</span>
                    }
                  </div>
                  <span className="reel-page-name">{pageName}</span>
                  <span style={{
                    fontSize:11,fontWeight:600,color:'#fff',
                    border:'1px solid rgba(255,255,255,.6)',borderRadius:5,
                    padding:'2px 8px',marginLeft:4,
                  }}>Follow</span>
                </div>
                <div style={{fontSize:10,color:'rgba(255,255,255,.6)',paddingLeft:38,marginTop:1}}>
                  Sponsored
                </div>
              </div>

              <div className="reel-caption" style={captionExpanded ? {WebkitLineClamp:'unset',display:'block'} : {}}>
                {needsTrunc ? <>{text.slice(0, truncLen)}<span className="more-link" onClick={() => setCaptionExpanded(true)}>...more</span></> : text}
              </div>

              <div style={{
                display:'flex',alignItems:'center',gap:5,
                fontSize:10,color:'rgba(255,255,255,.7)',marginBottom:8,
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="rgba(255,255,255,.7)">
                  <path d="M9 18V5l12-2v13"/>
                  <circle cx="6" cy="18" r="3"/>
                  <circle cx="18" cy="16" r="3"/>
                </svg>
                <span>{pageName} · Original audio</span>
              </div>

              <div style={{
                display:'flex',alignItems:'center',justifyContent:'center',
                width:'100%',padding:'8px 14px',
                background:'rgba(255,255,255,.95)',borderRadius:7,
                fontSize:13,fontWeight:600,color:'#000',cursor:'pointer',
                boxShadow:'0 1px 4px rgba(0,0,0,.2)',
              }}>
                {ad.copy.cta || 'Sign Up'}
              </div>
            </>
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
