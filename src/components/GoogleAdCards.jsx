/**
 * GoogleAdCards — Pixel-accurate Google Search + Demand Gen ad mockups.
 * Search: Desktop (browser chrome) + Mobile (phone frame) with toggle
 * Demand Gen: Gmail promo placement with advertiser logo
 */

import { useState } from 'react';

/* ── Google multi-color logo ── */
function GoogleLogo({ width = 74 }) {
  return (
    <svg viewBox="0 0 272 92" width={width} height={Math.round(width * 92/272)} style={{display:'block'}}>
      <path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#EA4335"/>
      <path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#FBBC05"/>
      <path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z" fill="#4285F4"/>
      <path d="M225 3v65h-9.5V3h9.5z" fill="#34A853"/>
      <path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z" fill="#EA4335"/>
      <path d="M35.29 41.19V32H67.2c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.5.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.69-.01z" fill="#4285F4"/>
    </svg>
  );
}

/* Shared SERP style tokens */
const S = {
  font: "'Google Sans', arial, sans-serif",
  fontSerp: "arial, sans-serif",
  blue: '#1a0dab',
  black: '#202124',
  gray: '#4d5156',
  lightGray: '#70757a',
  border: '#dadce0',
  bg: '#fff',
};


/* ── Desktop SERP ──────────────────────────────────────────────── */
function DesktopSerp({ copy, callouts, sitelinks, imageUrl, amenities, variationHeadlines, variationDescriptions }) {
  const headlines = variationHeadlines || (copy.headlines || []).slice(0, 3);
  const desc1 = (variationDescriptions || copy.descriptions || [])[0] || '';
  const desc2 = (variationDescriptions || copy.descriptions || [])[1] || '';
  const url = copy.link || 'example.com';
  const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const domain = displayUrl.split('/')[0];

  return (
    <div className="browser-mockup">
      {/* Browser chrome bar */}
      <div className="browser-mockup__chrome">
        <div className="browser-mockup__dots">
          <div className="browser-mockup__dot browser-mockup__dot--red" />
          <div className="browser-mockup__dot browser-mockup__dot--yellow" />
          <div className="browser-mockup__dot browser-mockup__dot--green" />
        </div>
        <div className="browser-mockup__url">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" style={{flexShrink:0,marginRight:6}}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          google.com/search
        </div>
      </div>

      {/* SERP body */}
      <div style={{padding:'14px 20px 20px',background:S.bg,fontFamily:S.fontSerp}}>

        {/* Google logo + search bar row */}
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:0}}>
          <GoogleLogo width={92} />
          <div style={{
            flex:1,display:'flex',alignItems:'center',gap:8,
            padding:'9px 16px',border:`1px solid ${S.border}`,borderRadius:24,
            background:'#fff',boxShadow:'0 1px 6px rgba(32,33,36,.12)',
          }}>
            <span style={{fontSize:14,color:S.black,flex:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
              {domain.replace(/\.com$/, '')}
            </span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4285f4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
        </div>

        {/* Tabs row */}
        <div style={{
          display:'flex',alignItems:'center',gap:0,
          borderBottom:`1px solid ${S.border}`,marginBottom:14,paddingTop:8,
        }}>
          {['All','Images','Maps','Shopping','News','More'].map((tab, i) => (
            <span key={tab} style={{
              fontSize:13,padding:'8px 14px',color: i === 0 ? '#1a73e8' : S.lightGray,
              fontWeight: i === 0 ? 500 : 400,
              borderBottom: i === 0 ? '3px solid #1a73e8' : '3px solid transparent',
              cursor:'pointer',whiteSpace:'nowrap',
            }}>{tab}</span>
          ))}
          <span style={{marginLeft:'auto',fontSize:13,color:S.lightGray,padding:'8px 14px',cursor:'pointer'}}>Tools</span>
        </div>

        {/* Results count */}
        <div style={{fontSize:12,color:S.lightGray,marginBottom:14}}>
          About 1,240,000 results (0.42 seconds)
        </div>

        {/* Sponsored label */}
        <div style={{fontSize:12,color:S.lightGray,marginBottom:10}}>
          Sponsored
        </div>

        {/* Main sponsored result with image extension on right */}
        <div style={{display:'flex',gap:16,marginBottom:16}}>
          {/* Left: ad content */}
          <div style={{flex:1,minWidth:0}}>
            {/* Favicon + domain row */}
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
              <div style={{
                width:26,height:26,borderRadius:'50%',
                background:'#fff',border:`1px solid ${S.border}`,
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:12,fontWeight:500,color:S.lightGray,flexShrink:0,
              }}>
                {domain.charAt(0).toUpperCase()}
              </div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:14,color:S.black,lineHeight:'20px'}}>{domain}</div>
                <div style={{fontSize:12,color:S.lightGray,lineHeight:'16px',display:'flex',alignItems:'center',gap:4}}>
                  <span style={{
                    display:'inline-block',fontSize:11,fontWeight:700,
                    color:'#202124',background:'transparent',
                    border:'1px solid #202124',borderRadius:3,
                    padding:'0 3px',lineHeight:'15px',
                  }}>Ad</span>
                  {displayUrl}
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill={S.lightGray} style={{flexShrink:0,cursor:'pointer',marginLeft:'auto'}}>
                <circle cx="8" cy="3" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="8" cy="13" r="1.2"/>
              </svg>
            </div>

            {/* Blue headline */}
            <div style={{
              fontSize:20,lineHeight:'26px',color:S.blue,
              fontFamily:S.font,marginBottom:4,cursor:'pointer',
            }}>
              {headlines.join(' | ')}
            </div>

            {/* Description */}
            <div style={{fontSize:14,lineHeight:'22px',color:S.gray}}>
              {desc1}{desc2 ? ` ${desc2}` : ''}
            </div>

            {/* Callout extensions */}
            {callouts && callouts.length > 0 && (
              <div style={{fontSize:13,lineHeight:'20px',color:S.gray,marginTop:4}}>
                {callouts.slice(0, 4).map((c, i) => (
                  <span key={i}>
                    {i > 0 && <span style={{margin:'0 5px',color:S.border}}>&middot;</span>}
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right: image extension */}
          {imageUrl && (
            <img src={imageUrl} alt=""
              style={{width:100,height:100,objectFit:'cover',borderRadius:8,border:`1px solid ${S.border}`,flexShrink:0,alignSelf:'flex-start',marginTop:4}}
              onError={e => { e.target.style.display='none'; }}
            />
          )}
        </div>

        {/* Sitelinks — 2x2 grid with descriptions */}
        {sitelinks && sitelinks.length > 0 && (
          <div style={{
            display:'grid',gridTemplateColumns:'1fr 1fr',
            gap:'6px 24px',marginBottom:16,
            borderTop:`1px solid ${S.border}`,paddingTop:10,
          }}>
            {sitelinks.slice(0, 4).map((sl, i) => (
              <div key={i} style={{padding:'4px 0'}}>
                <div style={{fontSize:16,color:S.blue,lineHeight:'22px',cursor:'pointer',fontFamily:S.font}}>
                  {sl.title}
                </div>
                {sl.desc1 && (
                  <div style={{fontSize:12,color:S.gray,lineHeight:'18px',marginTop:2}}>
                    {sl.desc1}{sl.desc2 ? ` ${sl.desc2}` : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Structured snippets / amenities */}
        {amenities && amenities.length > 0 && (
          <div style={{fontSize:13,color:S.gray,lineHeight:'20px',marginBottom:12}}>
            <span style={{fontWeight:500,color:S.black}}>Amenities: </span>
            {amenities.join(', ')}
          </div>
        )}

        {/* ── Divider: organic results ── */}
        <div style={{borderTop:`1px solid ${S.border}`,paddingTop:14}}>
          <div style={{marginBottom:16,opacity:.5}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
              <div style={{width:22,height:22,borderRadius:'50%',background:'#e8eaed'}} />
              <div>
                <div style={{width:110,height:9,background:'#e8eaed',borderRadius:3,marginBottom:3}} />
                <div style={{width:70,height:7,background:'#e8eaed',borderRadius:3}} />
              </div>
            </div>
            <div style={{width:220,height:11,background:'#c8cfd8',borderRadius:3,marginBottom:5}} />
            <div style={{width:'85%',height:9,background:'#e8eaed',borderRadius:3,marginBottom:3}} />
            <div style={{width:'65%',height:9,background:'#e8eaed',borderRadius:3}} />
          </div>
          <div style={{opacity:.3}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
              <div style={{width:22,height:22,borderRadius:'50%',background:'#e8eaed'}} />
              <div>
                <div style={{width:130,height:9,background:'#e8eaed',borderRadius:3,marginBottom:3}} />
                <div style={{width:80,height:7,background:'#e8eaed',borderRadius:3}} />
              </div>
            </div>
            <div style={{width:180,height:11,background:'#d8dce3',borderRadius:3,marginBottom:5}} />
            <div style={{width:'75%',height:9,background:'#e8eaed',borderRadius:3}} />
          </div>
        </div>
      </div>
    </div>
  );
}


/* ── Mobile SERP ───────────────────────────────────────────────── */
function MobileSerp({ copy, callouts, sitelinks, imageUrl, amenities, variationHeadlines, variationDescriptions }) {
  const headlines = variationHeadlines || (copy.headlines || []).slice(0, 3);
  const desc1 = (variationDescriptions || copy.descriptions || [])[0] || '';
  const desc2 = (variationDescriptions || copy.descriptions || [])[1] || '';
  const url = copy.link || 'example.com';
  const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const domain = displayUrl.split('/')[0];

  return (
    <div style={{
      width:360,borderRadius:16,overflow:'hidden',
      boxShadow:'0 2px 16px rgba(0,0,0,.15)',background:S.bg,fontFamily:S.fontSerp,
      border:'1px solid #e0e0e0',
    }}>
      {/* Phone status bar */}
      <div style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'6px 16px',background:'#fff',fontSize:11,fontWeight:600,color:S.black,
      }}>
        <span>9:41</span>
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          {/* Signal bars */}
          <svg width="14" height="10" viewBox="0 0 14 10" fill={S.black}>
            <rect x="0" y="7" width="2.5" height="3" rx=".5"/><rect x="3.5" y="5" width="2.5" height="5" rx=".5"/><rect x="7" y="2.5" width="2.5" height="7.5" rx=".5"/><rect x="10.5" y="0" width="2.5" height="10" rx=".5"/>
          </svg>
          {/* WiFi */}
          <svg width="12" height="10" viewBox="0 0 24 18" fill="none" stroke={S.black} strokeWidth="2" strokeLinecap="round">
            <path d="M1 5c5.5-5 16.5-5 22 0"/><path d="M5 9c3.5-3.5 10.5-3.5 14 0"/><path d="M9 13c1.7-1.7 5.3-1.7 7 0"/>
            <circle cx="12" cy="16.5" r="1" fill={S.black} stroke="none"/>
          </svg>
          {/* Battery */}
          <svg width="20" height="10" viewBox="0 0 28 12" fill="none">
            <rect x=".5" y=".5" width="23" height="11" rx="2" stroke={S.black} strokeWidth="1"/>
            <rect x="2" y="2" width="18" height="8" rx="1" fill={S.black}/>
            <rect x="25" y="3.5" width="2" height="5" rx="1" fill={S.black}/>
          </svg>
        </div>
      </div>

      {/* Google header with hamburger + logo + avatar */}
      <div style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'6px 14px 8px',
      }}>
        {/* Hamburger */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={S.black} strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
        <GoogleLogo width={80} />
        {/* User avatar circle */}
        <div style={{width:28,height:28,borderRadius:'50%',background:'#1a73e8',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <span style={{fontSize:13,fontWeight:600,color:'#fff'}}>A</span>
        </div>
      </div>

      {/* Search bar — rounded pill */}
      <div style={{padding:'0 14px 8px'}}>
        <div style={{
          display:'flex',alignItems:'center',gap:8,
          padding:'10px 14px',background:'#f1f3f4',borderRadius:24,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={S.lightGray} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span style={{fontSize:14,color:S.black,flex:1}}>{domain.replace(/\.com$/, '')}</span>
          {/* Mic icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={S.lightGray} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        </div>
      </div>

      {/* Tab row */}
      <div style={{
        display:'flex',alignItems:'center',gap:0,
        borderBottom:`1px solid ${S.border}`,padding:'0 8px',
        overflowX:'auto',
      }}>
        {['All','Images','Videos','Shopping','News'].map((tab, i) => (
          <span key={tab} style={{
            fontSize:13,padding:'8px 12px',color: i === 0 ? '#1a73e8' : S.lightGray,
            fontWeight: i === 0 ? 500 : 400,
            borderBottom: i === 0 ? '3px solid #1a73e8' : '3px solid transparent',
            cursor:'pointer',whiteSpace:'nowrap',
          }}>{tab}</span>
        ))}
      </div>

      {/* SERP content */}
      <div style={{padding:'12px 16px 16px'}}>

        {/* Sponsored result */}
        <div style={{marginBottom:14}}>
          {/* "Ad" label + domain */}
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
            <span style={{
              fontSize:11,fontWeight:700,color:'#202124',
              border:'1px solid #202124',borderRadius:3,
              padding:'0 3px',lineHeight:'15px',
            }}>Ad</span>
            <span style={{fontSize:13,color:S.lightGray}}>{displayUrl}</span>
            {/* Info icon */}
            <svg width="14" height="14" viewBox="0 0 20 20" fill={S.lightGray} style={{flexShrink:0}}>
              <path d="M10 0a10 10 0 100 20 10 10 0 000-20zm1 15H9V9h2v6zm0-8H9V5h2v2z"/>
            </svg>
          </div>

          {/* Headline + image row */}
          <div style={{display:'flex',gap:12}}>
            <div style={{flex:1,minWidth:0}}>
              {/* Blue headline — larger on mobile */}
              <div style={{
                fontSize:18,lineHeight:'24px',color:S.blue,
                fontFamily:S.font,marginBottom:4,cursor:'pointer',
              }}>
                {headlines.join(' | ')}
              </div>

              {/* Description */}
              <div style={{fontSize:13,lineHeight:'20px',color:S.gray}}>
                {desc1}{desc2 ? ` ${desc2}` : ''}
              </div>
            </div>

            {/* Image extension on right — smaller on mobile */}
            {imageUrl && (
              <img src={imageUrl} alt=""
                style={{width:72,height:72,objectFit:'cover',borderRadius:8,flexShrink:0,alignSelf:'flex-start'}}
                onError={e => { e.target.style.display='none'; }}
              />
            )}
          </div>

          {/* Callout extensions */}
          {callouts && callouts.length > 0 && (
            <div style={{fontSize:12,lineHeight:'18px',color:S.gray,marginTop:6}}>
              {callouts.slice(0, 3).map((c, i) => (
                <span key={i}>
                  {i > 0 && <span style={{margin:'0 4px',color:S.border}}>&middot;</span>}
                  {c}
                </span>
              ))}
            </div>
          )}

          {/* Sitelinks — vertical list on mobile */}
          {sitelinks && sitelinks.length > 0 && (
            <div style={{marginTop:10,display:'flex',flexDirection:'column',gap:6}}>
              {sitelinks.slice(0, 4).map((sl, i) => (
                <div key={i} style={{
                  fontSize:14,color:S.blue,lineHeight:'20px',cursor:'pointer',
                  paddingLeft:2,
                }}>
                  {sl.title}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Structured snippets / amenities */}
        {amenities && amenities.length > 0 && (
          <div style={{fontSize:12,color:S.gray,lineHeight:'18px',marginBottom:10,borderTop:`1px solid ${S.border}`,paddingTop:8}}>
            <span style={{fontWeight:500,color:S.black}}>Amenities: </span>
            {amenities.slice(0, 4).join(', ')}
          </div>
        )}

        {/* Organic placeholder */}
        <div style={{borderTop:`1px solid ${S.border}`,paddingTop:12}}>
          <div style={{opacity:.45}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
              <div style={{width:20,height:20,borderRadius:'50%',background:'#e8eaed'}} />
              <div>
                <div style={{width:100,height:8,background:'#e8eaed',borderRadius:3,marginBottom:3}} />
                <div style={{width:60,height:6,background:'#e8eaed',borderRadius:3}} />
              </div>
            </div>
            <div style={{width:200,height:10,background:'#c8cfd8',borderRadius:3,marginBottom:4}} />
            <div style={{width:'80%',height:8,background:'#e8eaed',borderRadius:3,marginBottom:3}} />
            <div style={{width:'55%',height:8,background:'#e8eaed',borderRadius:3}} />
          </div>
        </div>
      </div>
    </div>
  );
}


/* ── Generate text variations from headlines + descriptions ──── */
function generateVariations(headlines, descriptions) {
  if (!headlines || headlines.length < 3) return [{ headlines: headlines || [], descriptions: descriptions || [] }];
  const variations = [];
  const descs = descriptions || [];
  // Generate combos: pick 3 headlines at a time, rotate descriptions
  for (let i = 0; i <= headlines.length - 3 && variations.length < 6; i += 2) {
    const h = headlines.slice(i, i + 3);
    if (h.length < 3) break;
    const dIdx = variations.length % Math.max(descs.length, 1);
    const d = descs.length > 0 ? [descs[dIdx], descs[(dIdx + 1) % descs.length]] : [];
    variations.push({ headlines: h, descriptions: d });
  }
  // Ensure at least the default if nothing generated
  if (variations.length === 0) {
    variations.push({ headlines: headlines.slice(0, 3), descriptions: descs.slice(0, 2) });
  }
  return variations;
}

/* ── Carousel arrow button ── */
function CarouselArrow({ direction, onClick }) {
  return (
    <button onClick={onClick} style={{
      width:32,height:32,borderRadius:'50%',border:'1px solid #dadce0',
      background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
      boxShadow:'0 1px 4px rgba(0,0,0,.1)',flexShrink:0,
      transition:'background .15s',
    }}
      onMouseEnter={e => e.currentTarget.style.background='#f1f3f4'}
      onMouseLeave={e => e.currentTarget.style.background='#fff'}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {direction === 'left'
          ? <polyline points="15,18 9,12 15,6" />
          : <polyline points="9,6 15,12 9,18" />
        }
      </svg>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SearchAdCard — Wrapper with Desktop / Mobile toggle + text variation carousel
   ══════════════════════════════════════════════════════════════════ */
export function SearchAdCard({ copy, callouts, sitelinks, imageUrl, amenities }) {
  const [mode, setMode] = useState('desktop');
  const variations = generateVariations(copy.headlines, copy.descriptions);
  const [varIdx, setVarIdx] = useState(0);
  const current = variations[varIdx];
  const hasPrev = varIdx > 0;
  const hasNext = varIdx < variations.length - 1;

  return (
    <div>
      {/* Controls row: device toggle + variation carousel */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:10}}>
        {/* Device toggle */}
        <div style={{
          display:'inline-flex',borderRadius:8,overflow:'hidden',
          border:'1px solid #dadce0',
        }}>
          <button
            onClick={() => setMode('desktop')}
            style={{
              padding:'6px 16px',fontSize:12,fontWeight:mode==='desktop'?600:400,
              background:mode==='desktop'?'#1a73e8':'#fff',
              color:mode==='desktop'?'#fff':'#5f6368',
              border:'none',cursor:'pointer',
              display:'flex',alignItems:'center',gap:5,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            Desktop
          </button>
          <button
            onClick={() => setMode('mobile')}
            style={{
              padding:'6px 16px',fontSize:12,fontWeight:mode==='mobile'?600:400,
              background:mode==='mobile'?'#1a73e8':'#fff',
              color:mode==='mobile'?'#fff':'#5f6368',
              border:'none',borderLeft:'1px solid #dadce0',cursor:'pointer',
              display:'flex',alignItems:'center',gap:5,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18"/>
            </svg>
            Mobile
          </button>
        </div>

        {/* Variation carousel controls */}
        {variations.length > 1 && (
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <CarouselArrow direction="left" onClick={() => setVarIdx(i => Math.max(0, i - 1))} />
            <span style={{fontSize:12,fontWeight:500,color:'#5f6368',minWidth:80,textAlign:'center'}}>
              Variation {varIdx + 1} of {variations.length}
            </span>
            <CarouselArrow direction="right" onClick={() => setVarIdx(i => Math.min(variations.length - 1, i + 1))} />
          </div>
        )}
      </div>

      {mode === 'desktop'
        ? <DesktopSerp copy={copy} callouts={callouts} sitelinks={sitelinks} imageUrl={imageUrl} amenities={amenities} variationHeadlines={current.headlines} variationDescriptions={current.descriptions} />
        : <MobileSerp copy={copy} callouts={callouts} sitelinks={sitelinks} imageUrl={imageUrl} amenities={amenities} variationHeadlines={current.headlines} variationDescriptions={current.descriptions} />
      }
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════
   Google Demand Gen — YouTube + Gmail placements
   Matches actual Google Ads preview tool: tabs + mobile/desktop toggle
   ══════════════════════════════════════════════════════════════════ */

/* YouTube logo SVG */
function YouTubeLogo({ width = 90 }) {
  return (
    <svg viewBox="0 0 90 20" width={width} height={Math.round(width * 20/90)} style={{display:'block'}}>
      <path d="M27.97 17.77c-.38.82-.93 1.42-1.65 1.8-.72.39-1.58.58-2.57.58-1.18 0-2.12-.27-2.82-.82-.7-.55-1.14-1.32-1.32-2.32l1.96-.31c.1.56.33 1 .7 1.3.37.3.84.46 1.4.46.64 0 1.14-.2 1.5-.6.36-.4.54-1.02.54-1.86v-.94h-.04c-.54.88-1.38 1.32-2.52 1.32-.98 0-1.78-.4-2.4-1.2-.62-.8-.93-1.84-.93-3.12s.33-2.36.99-3.18c.66-.82 1.5-1.23 2.52-1.23 1.08 0 1.88.46 2.4 1.38h.04V7.85h1.86v8.16c0 1.24-.35 2.2-1.06 2.88zM24.5 14c.42.56.98.84 1.68.84.7 0 1.26-.28 1.68-.84.42-.56.63-1.28.63-2.16 0-.88-.21-1.6-.63-2.16-.42-.56-.98-.84-1.68-.84-.7 0-1.26.28-1.68.84-.42.56-.63 1.28-.63 2.16 0 .88.21 1.6.63 2.16z" fill="#282828"/>
      <rect x="0" y="3" width="20" height="14" rx="3" fill="#FF0000"/>
      <polygon points="8,6.5 14,10 8,13.5" fill="#fff"/>
    </svg>
  );
}

/* Placeholder gray bars for organic content */
function GrayBars({ rows = 3, style }) {
  return (
    <div style={{opacity:.4,...style}}>
      {Array.from({length:rows}).map((_,i) => (
        <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
          <div style={{width:20+Math.random()*16,height:20+Math.random()*16,borderRadius:'50%',background:'#e0e0e0',flexShrink:0}} />
          <div style={{flex:1}}>
            <div style={{width:`${50+Math.random()*40}%`,height:8,background:'#e0e0e0',borderRadius:3,marginBottom:3}} />
            <div style={{width:`${30+Math.random()*30}%`,height:6,background:'#eeeeee',borderRadius:3}} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── YouTube Mobile Home Feed ── */
function YouTubeMobile({ copy, imageUrl, logoUrl }) {
  const headline = (copy.headlines || [])[0] || '';
  const description = (copy.descriptions || [])[0] || '';
  const businessName = copy.businessName || '';
  const cta = copy.cta || 'Learn more';

  const LogoSquare = ({ size = 36 }) => (
    <div style={{width:size,height:size,borderRadius:size*0.15,overflow:'hidden',background:'#fff',border:'1px solid #e0e0e0',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
      {logoUrl ? <img src={logoUrl} alt={businessName} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : <span style={{fontSize:size*0.4,fontWeight:500,color:'#606060'}}>{businessName.charAt(0)}</span>}
    </div>
  );

  return (
    <div style={{width:340,borderRadius:20,overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,.12)',background:'#fff',fontFamily:'Roboto, Arial, sans-serif',border:'1px solid #e0e0e0'}}>
      {/* Status bar */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 16px',fontSize:11,fontWeight:600,color:'#202124'}}>
        <span>9:41</span>
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          <svg width="14" height="10" viewBox="0 0 14 10" fill="#202124"><rect x="0" y="7" width="2.5" height="3" rx=".5"/><rect x="3.5" y="5" width="2.5" height="5" rx=".5"/><rect x="7" y="2.5" width="2.5" height="7.5" rx=".5"/><rect x="10.5" y="0" width="2.5" height="10" rx=".5"/></svg>
          <svg width="20" height="10" viewBox="0 0 28 12" fill="none"><rect x=".5" y=".5" width="23" height="11" rx="2" stroke="#202124" strokeWidth="1"/><rect x="2" y="2" width="18" height="8" rx="1" fill="#202124"/><rect x="25" y="3.5" width="2" height="5" rx="1" fill="#202124"/></svg>
        </div>
      </div>
      {/* YouTube header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 14px 10px'}}>
        <YouTubeLogo width={82} />
        <div style={{width:28,height:28,borderRadius:'50%',background:'#1a73e8',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <span style={{fontSize:12,fontWeight:600,color:'#fff'}}>A</span>
        </div>
      </div>
      {/* Organic placeholder */}
      <div style={{padding:'0 14px 8px'}}>
        <div style={{height:52,background:'#f2f2f2',borderRadius:8,marginBottom:8}} />
        <GrayBars rows={1} />
      </div>
      {/* Ad: image */}
      <div style={{position:'relative'}}>
        <img src={imageUrl} alt={headline} style={{width:'100%',display:'block',aspectRatio:'1.91/1',objectFit:'cover'}} onError={e => { e.target.style.display='none'; }} />
        {/* Ad badge on image */}
        <div style={{position:'absolute',top:8,right:8,background:'rgba(0,0,0,.7)',borderRadius:3,padding:'2px 5px'}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="rgba(255,255,255,.8)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
        </div>
      </div>
      {/* CTA link below image */}
      <div style={{padding:'8px 14px 0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontSize:13,fontWeight:500,color:'#1a73e8',display:'flex',alignItems:'center',gap:3}}>
          {cta}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </span>
      </div>
      {/* Ad info row */}
      <div style={{padding:'10px 14px 14px',display:'flex',gap:10}}>
        <LogoSquare size={36} />
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:500,color:'#0f0f0f',lineHeight:'18px',marginBottom:2,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>
            {headline}
          </div>
          <div style={{fontSize:12,color:'#606060',lineHeight:'16px',marginBottom:2,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
            {description}
          </div>
          <div style={{fontSize:12,color:'#606060'}}>
            Sponsored · {businessName}
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="#606060" style={{flexShrink:0,cursor:'pointer',marginTop:2}}>
          <circle cx="8" cy="3" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="8" cy="13" r="1.2"/>
        </svg>
      </div>
    </div>
  );
}

/* ── YouTube Desktop Home Feed ── */
function YouTubeDesktop({ copy, imageUrl, logoUrl }) {
  const headline = (copy.headlines || [])[0] || '';
  const description = (copy.descriptions || [])[0] || '';
  const businessName = copy.businessName || '';

  const LogoSquare = ({ size = 36 }) => (
    <div style={{width:size,height:size,borderRadius:size*0.15,overflow:'hidden',background:'#fff',border:'1px solid #e0e0e0',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
      {logoUrl ? <img src={logoUrl} alt={businessName} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : <span style={{fontSize:size*0.4,fontWeight:500,color:'#606060'}}>{businessName.charAt(0)}</span>}
    </div>
  );

  /* Placeholder video card */
  const PlaceholderCard = () => (
    <div style={{minWidth:0}}>
      <div style={{aspectRatio:'16/9',background:'#e8e8e8',borderRadius:8,marginBottom:8}} />
      <div style={{display:'flex',gap:8}}>
        <div style={{width:28,height:28,borderRadius:'50%',background:'#e0e0e0',flexShrink:0}} />
        <div style={{flex:1}}>
          <div style={{width:'80%',height:8,background:'#e0e0e0',borderRadius:3,marginBottom:4}} />
          <div style={{width:'50%',height:7,background:'#eeeeee',borderRadius:3}} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="browser-mockup" style={{width:560}}>
      <div className="browser-mockup__chrome">
        <div className="browser-mockup__dots">
          <div className="browser-mockup__dot browser-mockup__dot--red" />
          <div className="browser-mockup__dot browser-mockup__dot--yellow" />
          <div className="browser-mockup__dot browser-mockup__dot--green" />
        </div>
        <div className="browser-mockup__url">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" style={{flexShrink:0,marginRight:6}}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          youtube.com
        </div>
      </div>
      <div style={{background:'#fff',fontFamily:'Roboto, Arial, sans-serif',padding:0}}>
        {/* YT header */}
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'8px 16px',borderBottom:'1px solid #e8e8e8'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#606060" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          <YouTubeLogo width={82} />
          <div style={{flex:1}} />
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'5px 12px',background:'#f8f8f8',borderRadius:20,border:'1px solid #e0e0e0',flex:'0 1 200px'}}>
            <span style={{fontSize:13,color:'#888',flex:1}}>Search</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#606060" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <div style={{width:26,height:26,borderRadius:'50%',background:'#1a73e8',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{fontSize:11,fontWeight:600,color:'#fff'}}>A</span>
          </div>
        </div>
        {/* Video grid */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,padding:16}}>
          {/* Ad card — first position */}
          <div>
            <div style={{position:'relative',marginBottom:8}}>
              <img src={imageUrl} alt={headline} style={{width:'100%',display:'block',aspectRatio:'16/9',objectFit:'cover',borderRadius:8}} onError={e => { e.target.style.display='none'; }} />
            </div>
            <div style={{display:'flex',gap:8}}>
              <LogoSquare size={28} />
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500,color:'#0f0f0f',lineHeight:'18px',marginBottom:2,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
                  {headline}
                </div>
                <div style={{fontSize:11,color:'#606060',lineHeight:'15px',marginBottom:1,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>
                  {description}
                </div>
                <div style={{fontSize:11,color:'#606060'}}>
                  Sponsored · {businessName}
                </div>
              </div>
            </div>
          </div>
          {/* Placeholder cards */}
          <PlaceholderCard /><PlaceholderCard />
          <PlaceholderCard /><PlaceholderCard /><PlaceholderCard />
        </div>
      </div>
    </div>
  );
}

/* ── Gmail Mobile Expanded ── */
function GmailMobile({ copy, imageUrl, logoUrl }) {
  const headline = (copy.headlines || [])[0] || '';
  const description = (copy.descriptions || [])[0] || '';
  const businessName = copy.businessName || '';
  const cta = copy.cta || 'Learn more';

  const LogoSquare = ({ size = 36 }) => (
    <div style={{width:size,height:size,borderRadius:size*0.15,overflow:'hidden',background:'#fff',border:'1px solid #e0e0e0',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
      {logoUrl ? <img src={logoUrl} alt={businessName} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : <span style={{fontSize:size*0.4,fontWeight:500,color:'#606060'}}>{businessName.charAt(0)}</span>}
    </div>
  );

  return (
    <div style={{width:340,borderRadius:20,overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,.12)',background:'#fff',fontFamily:'Roboto, Arial, sans-serif',border:'1px solid #e0e0e0'}}>
      {/* Status bar */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 16px',fontSize:11,fontWeight:600,color:'#202124'}}>
        <span>9:41</span>
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          <svg width="14" height="10" viewBox="0 0 14 10" fill="#202124"><rect x="0" y="7" width="2.5" height="3" rx=".5"/><rect x="3.5" y="5" width="2.5" height="5" rx=".5"/><rect x="7" y="2.5" width="2.5" height="7.5" rx=".5"/><rect x="10.5" y="0" width="2.5" height="10" rx=".5"/></svg>
          <svg width="20" height="10" viewBox="0 0 28 12" fill="none"><rect x=".5" y=".5" width="23" height="11" rx="2" stroke="#202124" strokeWidth="1"/><rect x="2" y="2" width="18" height="8" rx="1" fill="#202124"/><rect x="25" y="3.5" width="2" height="5" rx="1" fill="#202124"/></svg>
        </div>
      </div>
      {/* Action bar: back, star, delete, more */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 14px',borderBottom:'1px solid #e8eaed'}}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
        <div style={{display:'flex',gap:20,alignItems:'center'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="1.5"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="#5f6368"><circle cx="10" cy="4" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="10" cy="16" r="1.5"/></svg>
        </div>
      </div>
      {/* Sender row */}
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px 8px'}}>
        <LogoSquare size={36} />
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:500,color:'#202124'}}>{businessName}</div>
          <div style={{fontSize:12,color:'#5f6368'}}>to me</div>
        </div>
      </div>
      {/* Image */}
      <div style={{padding:'4px 14px 0'}}>
        <img src={imageUrl} alt={headline} style={{width:'100%',display:'block',borderRadius:8,aspectRatio:'1.91/1',objectFit:'cover'}} onError={e => { e.target.style.display='none'; }} />
      </div>
      {/* Headline + description + CTA */}
      <div style={{padding:'14px 14px 18px'}}>
        <div style={{fontSize:18,fontWeight:400,color:'#202124',lineHeight:'24px',marginBottom:6}}>
          {headline}
        </div>
        {description && (
          <div style={{fontSize:14,color:'#5f6368',lineHeight:'20px',marginBottom:16}}>
            {description}
          </div>
        )}
        <button style={{
          background:'#1a73e8',color:'#fff',border:'none',borderRadius:100,
          padding:'10px 24px',fontSize:14,fontWeight:500,cursor:'pointer',
          width:'100%',fontFamily:"'Google Sans', Roboto, Arial, sans-serif",
        }}>
          {cta}
        </button>
      </div>
    </div>
  );
}

/* ── Gmail Desktop Expanded ── */
function GmailDesktop({ copy, imageUrl, logoUrl }) {
  const headline = (copy.headlines || [])[0] || '';
  const businessName = copy.businessName || '';
  const cta = copy.cta || 'Learn more';

  const LogoSquare = ({ size = 36 }) => (
    <div style={{width:size,height:size,borderRadius:size*0.15,overflow:'hidden',background:'#fff',border:'1px solid #e0e0e0',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
      {logoUrl ? <img src={logoUrl} alt={businessName} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : <span style={{fontSize:size*0.4,fontWeight:500,color:'#606060'}}>{businessName.charAt(0)}</span>}
    </div>
  );

  return (
    <div className="browser-mockup" style={{width:560}}>
      <div className="browser-mockup__chrome">
        <div className="browser-mockup__dots">
          <div className="browser-mockup__dot browser-mockup__dot--red" />
          <div className="browser-mockup__dot browser-mockup__dot--yellow" />
          <div className="browser-mockup__dot browser-mockup__dot--green" />
        </div>
        <div className="browser-mockup__url">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" style={{flexShrink:0,marginRight:6}}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          mail.google.com
        </div>
      </div>
      <div style={{background:'#fff',fontFamily:'Roboto, Arial, sans-serif',display:'flex',minHeight:320}}>
        {/* Gmail sidebar icons */}
        <div style={{width:56,background:'#f6f8fc',borderRight:'1px solid #e8eaed',padding:'12px 0',display:'flex',flexDirection:'column',alignItems:'center',gap:16,flexShrink:0}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          {/* Gmail M */}
          <svg width="22" height="16" viewBox="0 0 24 18"><path d="M2 0h20c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H2c-1.1 0-2-.9-2-2V2C0 .9.9 0 2 0z" fill="#fff" stroke="#dadce0" strokeWidth=".8"/><path d="M2 0l10 9L22 0" fill="none" stroke="#EA4335" strokeWidth="1.2"/><path d="M0 2l10 9" fill="none" stroke="#4285F4" strokeWidth="1.2"/><path d="M24 2l-10 9" fill="none" stroke="#34A853" strokeWidth="1.2"/></svg>
          {/* Inbox nav items */}
          {[0,1,2,3].map(i => <div key={i} style={{width:20,height:20,borderRadius:4,background:i===0?'#d3e3fd':'#e8eaed'}} />)}
        </div>
        {/* Main content */}
        <div style={{flex:1,minWidth:0,padding:0}}>
          {/* Gmail top bar: search */}
          <div style={{padding:'8px 14px',display:'flex',alignItems:'center',gap:10}}>
            <div style={{display:'flex',alignItems:'center',gap:6,flex:1,padding:'6px 12px',background:'#eaf1fb',borderRadius:20}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span style={{fontSize:13,color:'#5f6368'}}>Search in mail</span>
            </div>
          </div>
          {/* Toolbar row */}
          <div style={{display:'flex',alignItems:'center',gap:12,padding:'4px 14px 8px',fontSize:12,color:'#5f6368'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="1.5"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
            <span style={{fontSize:12,color:'#5f6368'}}>Save to Inbox</span>
          </div>
          {/* Sender row */}
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'6px 14px 10px'}}>
            <LogoSquare size={32} />
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:500,color:'#202124'}}>{businessName}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="#5f6368"><circle cx="10" cy="4" r="1.2"/><circle cx="10" cy="10" r="1.2"/><circle cx="10" cy="16" r="1.2"/></svg>
          </div>
          {/* Image + headline */}
          <div style={{padding:'0 14px 14px',display:'flex',flexDirection:'column',alignItems:'center'}}>
            <img src={imageUrl} alt={headline} style={{width:'85%',display:'block',borderRadius:8,aspectRatio:'1.91/1',objectFit:'cover',marginBottom:12}} onError={e => { e.target.style.display='none'; }} />
            <div style={{fontSize:16,fontWeight:400,color:'#202124',lineHeight:'22px',textAlign:'center'}}>
              {headline}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════
   DemandGenCard — Combined preview with YouTube | Gmail tabs
   + mobile/desktop toggle, matching Google Ads preview tool
   ══════════════════════════════════════════════════════════════════ */
export function DemandGenCard({ copy, imageUrl, dimensions, logoUrl, variant }) {
  const [tab, setTab] = useState('youtube');
  const [device, setDevice] = useState('mobile');

  /* YouTube icon */
  const YTIcon = () => (
    <svg width="20" height="14" viewBox="0 0 24 17" style={{display:'block'}}>
      <rect width="24" height="17" rx="4" fill={tab==='youtube'?'#FF0000':'#909090'}/>
      <polygon points="10,4 10,13 17,8.5" fill="#fff"/>
    </svg>
  );

  /* Gmail icon */
  const GmailIcon = () => (
    <svg width="18" height="14" viewBox="0 0 24 18" style={{display:'block'}}>
      <path d="M2 0h20c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H2c-1.1 0-2-.9-2-2V2C0 .9.9 0 2 0z" fill={tab==='gmail'?'#fff':'#e8eaed'} stroke={tab==='gmail'?'#dadce0':'#c0c0c0'} strokeWidth="1"/>
      <path d="M2 0l10 9L22 0" fill="none" stroke={tab==='gmail'?'#EA4335':'#909090'} strokeWidth="1.5"/>
      <path d="M0 2l10 9" fill="none" stroke={tab==='gmail'?'#4285F4':'#b0b0b0'} strokeWidth="1.5"/>
      <path d="M24 2l-10 9" fill="none" stroke={tab==='gmail'?'#34A853':'#b0b0b0'} strokeWidth="1.5"/>
    </svg>
  );

  const renderPreview = () => {
    if (tab === 'youtube' && device === 'mobile') return <YouTubeMobile copy={copy} imageUrl={imageUrl} logoUrl={logoUrl} />;
    if (tab === 'youtube' && device === 'desktop') return <YouTubeDesktop copy={copy} imageUrl={imageUrl} logoUrl={logoUrl} />;
    if (tab === 'gmail' && device === 'mobile') return <GmailMobile copy={copy} imageUrl={imageUrl} logoUrl={logoUrl} />;
    if (tab === 'gmail' && device === 'desktop') return <GmailDesktop copy={copy} imageUrl={imageUrl} logoUrl={logoUrl} />;
    return null;
  };

  return (
    <div>
      {/* Tab bar + device toggle */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:24,marginBottom:16}}>
        {/* Tab: YouTube */}
        <button onClick={() => setTab('youtube')} style={{
          display:'flex',flexDirection:'column',alignItems:'center',gap:4,
          padding:'6px 16px',border:'none',background:'transparent',cursor:'pointer',
          borderBottom:tab==='youtube'?'2px solid #202124':'2px solid transparent',
        }}>
          <YTIcon />
          <span style={{fontSize:12,fontWeight:tab==='youtube'?600:400,color:tab==='youtube'?'#202124':'#5f6368'}}>YouTube</span>
        </button>
        {/* Tab: Gmail */}
        <button onClick={() => setTab('gmail')} style={{
          display:'flex',flexDirection:'column',alignItems:'center',gap:4,
          padding:'6px 16px',border:'none',background:'transparent',cursor:'pointer',
          borderBottom:tab==='gmail'?'2px solid #202124':'2px solid transparent',
        }}>
          <GmailIcon />
          <span style={{fontSize:12,fontWeight:tab==='gmail'?600:400,color:tab==='gmail'?'#202124':'#5f6368'}}>Gmail</span>
        </button>

        {/* Device toggle */}
        <div style={{display:'flex',gap:0,marginLeft:8}}>
          <button onClick={() => setDevice('mobile')} style={{
            padding:'5px 10px',border:'1px solid #dadce0',borderRight:'none',borderRadius:'6px 0 0 6px',
            background:device==='mobile'?'#e8f0fe':'#fff',cursor:'pointer',display:'flex',alignItems:'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={device==='mobile'?'#1a73e8':'#5f6368'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18"/>
            </svg>
          </button>
          <button onClick={() => setDevice('desktop')} style={{
            padding:'5px 10px',border:'1px solid #dadce0',borderRadius:'0 6px 6px 0',
            background:device==='desktop'?'#e8f0fe':'#fff',cursor:'pointer',display:'flex',alignItems:'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={device==='desktop'?'#1a73e8':'#5f6368'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Preview */}
      <div style={{display:'flex',justifyContent:'center'}}>
        {renderPreview()}
      </div>
    </div>
  );
}
