import { useState, useRef, useEffect, Fragment } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { CampaignProvider } from '../context/CampaignContext';
import { useCampaignData } from '../hooks/useCampaignData';
import AppShell from '../components/AppShell';
import Sidebar from '../components/Sidebar';
import DeviceFrame from '../components/DeviceFrame';
import FeedCard from '../components/FeedCard';
import StoryCard from '../components/StoryCard';
import ReelCard from '../components/ReelCard';
import EditPanel from '../components/EditPanel';
import { exportToXlsx } from '../utils/export';

/* ── Skeleton placeholders ── */
function SkeletonFeed() {
  return (
    <div className="skeleton-feed">
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'14px 16px'}}>
        <div className="skeleton" style={{width:40,height:40,borderRadius:'50%'}}></div>
        <div style={{flex:1}}>
          <div className="skeleton" style={{width:'50%',height:12,borderRadius:6,marginBottom:6}}></div>
          <div className="skeleton" style={{width:'30%',height:10,borderRadius:6}}></div>
        </div>
      </div>
      <div style={{padding:'0 16px 12px'}}>
        <div className="skeleton" style={{width:'90%',height:10,borderRadius:6,marginBottom:6}}></div>
        <div className="skeleton" style={{width:'60%',height:10,borderRadius:6}}></div>
      </div>
      <div className="skeleton" style={{width:'100%',height:260,borderRadius:0}}></div>
      <div style={{padding:16}}>
        <div className="skeleton" style={{width:'70%',height:10,borderRadius:6,marginBottom:8}}></div>
        <div className="skeleton" style={{width:'40%',height:32,borderRadius:6}}></div>
      </div>
    </div>
  );
}

function SkeletonStory() {
  return (
    <div className="skeleton-story">
      <div style={{position:'absolute',top:12,left:12,right:12,display:'flex',gap:4}}>
        <div className="skeleton" style={{flex:1,height:3,borderRadius:2,opacity:.5}}></div>
        <div className="skeleton" style={{flex:1,height:3,borderRadius:2,opacity:.3}}></div>
        <div className="skeleton" style={{flex:1,height:3,borderRadius:2,opacity:.3}}></div>
      </div>
      <div style={{position:'absolute',top:24,left:12,display:'flex',alignItems:'center',gap:8}}>
        <div className="skeleton" style={{width:32,height:32,borderRadius:'50%',opacity:.5}}></div>
        <div className="skeleton" style={{width:80,height:10,borderRadius:6,opacity:.5}}></div>
      </div>
      <div style={{position:'absolute',bottom:20,left:'50%',transform:'translateX(-50%)'}}>
        <div className="skeleton" style={{width:120,height:32,borderRadius:20,opacity:.5}}></div>
      </div>
    </div>
  );
}

function SkeletonReel() {
  return (
    <div className="skeleton-reel">
      <div style={{position:'absolute',bottom:80,right:12,display:'flex',flexDirection:'column',gap:16,alignItems:'center'}}>
        {[28,28,24,24,24].map((s,i) => (
          <div key={i} className="skeleton" style={{width:s,height:s,borderRadius:'50%',opacity:.4}}></div>
        ))}
      </div>
      <div style={{position:'absolute',bottom:60,left:12,display:'flex',alignItems:'center',gap:8}}>
        <div className="skeleton" style={{width:28,height:28,borderRadius:'50%',opacity:.5}}></div>
        <div className="skeleton" style={{width:100,height:10,borderRadius:6,opacity:.5}}></div>
      </div>
      <div style={{position:'absolute',bottom:16,left:12,right:12}}>
        <div className="skeleton" style={{width:'100%',height:36,borderRadius:8,opacity:.4}}></div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{maxWidth:1400,margin:'0 auto',padding:'24px 16px',animation:'fadeIn .4s ease'}}>
      <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:24}}>
        <div className="skeleton" style={{width:48,height:48,borderRadius:12}}></div>
        <div style={{flex:1}}>
          <div className="skeleton" style={{width:280,height:18,borderRadius:8,marginBottom:8}}></div>
          <div className="skeleton" style={{width:200,height:12,borderRadius:6}}></div>
        </div>
      </div>
      <div style={{display:'flex',gap:12,marginBottom:32}}>
        {[1,2,3].map(i => (
          <div key={i} className="skeleton" style={{width:120,height:64,borderRadius:12}}></div>
        ))}
      </div>
      <div className="skeleton" style={{width:140,height:14,borderRadius:6,marginBottom:20}}></div>
      <div style={{display:'flex',flexWrap:'wrap',gap:32}}>
        <SkeletonFeed /><SkeletonFeed />
      </div>
      <div className="skeleton" style={{width:180,height:14,borderRadius:6,margin:'40px 0 20px'}}></div>
      <div style={{display:'flex',flexWrap:'wrap',gap:32}}>
        <SkeletonStory /><SkeletonReel />
      </div>
    </div>
  );
}

/* ── Main board ── */
function CampaignBoardInner() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  const [view, setView] = useState(viewParam === 'internal' ? 'internal' : 'client');
  const [activePlacement, setActivePlacement] = useState('all');
  const [devicePreview, setDevicePreview] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('cb-theme') || 'light');

  const { data, loading, error } = useCampaignData(slug);

  /* ── Theme persistence ── */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cb-theme', theme);
  }, [theme]);

  /* ── Editable ad copy state ── */
  const [adsState, setAdsState] = useState(null);
  const originalAdsRef = useRef(null);

  useEffect(() => {
    if (data) {
      setAdsState(data.ads.map(a => ({
        ...a,
        copy: { ...a.copy },
        carouselCards: a.carouselCards ? a.carouselCards.map(c => ({ ...c })) : undefined
      })));
      originalAdsRef.current = data.ads.map(a => ({
        id: a.id, name: a.name, type: a.type, concept: a.concept, placement: a.placement,
        copy: { ...a.copy },
        carouselCards: a.carouselCards ? a.carouselCards.map(c => ({ ...c })) : undefined
      }));
    }
  }, [data]);

  /* ── View toggle syncs to URL ── */
  const handleSetView = (newView) => {
    setView(newView);
    setSearchParams({ view: newView });
  };

  /* ── Document title ── */
  useEffect(() => {
    if (data) {
      document.title = view === 'client'
        ? `${data.campaign.project} — Ad Preview`
        : `${data.campaign.name} — Campaign Board`;
    }
    return () => { document.title = 'Campaign Boards — Periphery Digital'; };
  }, [data, view]);

  /* ── Loading / Error states ── */
  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'60vh',animation:'fadeIn .3s ease'}}>
        <div style={{textAlign:'center',color:'#dc2626'}}>
          <div style={{width:56,height:56,borderRadius:'var(--radius-lg)',background:'#fef2f2',display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:16}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <p style={{fontSize:16,fontWeight:600,marginBottom:4}}>Campaign not found</p>
          <p style={{fontSize:14,color:'var(--text-secondary)'}}>{error}</p>
        </div>
      </div>
    );
  }

  if (!adsState) return null;

  const { campaign, adSets } = data;
  const isClient = view === 'client';

  /* ── Copy update functions ── */
  const updateAdCopy = (adId, field, value) => {
    setAdsState(prev => prev.map(ad =>
      ad.id === adId ? { ...ad, copy: { ...ad.copy, [field]: value } } : ad
    ));
  };

  const updateCarouselCard = (adId, cardIndex, field, value) => {
    setAdsState(prev => prev.map(ad => {
      if (ad.id !== adId || !ad.carouselCards) return ad;
      const newCards = ad.carouselCards.map((c, i) => i === cardIndex ? { ...c, [field]: value } : c);
      return { ...ad, carouselCards: newCards };
    }));
  };

  const resetAd = (adId) => {
    const orig = originalAdsRef.current.find(a => a.id === adId);
    if (!orig) return;
    setAdsState(prev => prev.map(ad =>
      ad.id === adId ? {
        ...ad,
        copy: { ...orig.copy },
        carouselCards: orig.carouselCards ? orig.carouselCards.map(c => ({ ...c })) : ad.carouselCards
      } : ad
    ));
  };

  const modifiedCount = adsState.filter((ad, i) => {
    const orig = originalAdsRef.current[i];
    return JSON.stringify(ad.copy) !== JSON.stringify(orig.copy) ||
      (ad.carouselCards && orig.carouselCards && JSON.stringify(ad.carouselCards) !== JSON.stringify(orig.carouselCards));
  }).length;

  const handleExport = () => exportToXlsx(adsState, originalAdsRef.current, campaign.name);

  /* ── Helpers ── */
  const tierColor = (t) => t==='Broad'?'var(--tier-broad)':t==='Interest'?'var(--tier-interest)':'var(--tier-retarg)';
  const tierClass = (t) => t==='Broad'?'tier-broad':t==='Interest'?'tier-interest':'tier-retarg';
  const totalFiles = adsState.reduce((n, a) => n + a.files.length, 0);

  /* ── Deduplicate: group unique ads by placement, collect tiers ── */
  const adTierMap = {};
  adSets.forEach(as => {
    as.ads.forEach(adId => {
      if (!adTierMap[adId]) adTierMap[adId] = [];
      adTierMap[adId].push({ tier: as.tier, adSetName: as.name, targeting: as.targeting });
    });
  });

  const placements = [
    { key: "Feed", label: "Feed Ads", clientLabel: "Feed Ads", icon: "📰", variant: "feed" },
    { key: "StoryReel", label: "Story & Reel Ads", clientLabel: "Story & Reel Ads", icon: "🎬", variant: "story" },
  ];

  const adsByPlacement = {};
  placements.forEach(p => { adsByPlacement[p.key] = []; });
  const seen = new Set();
  adsState.forEach(ad => {
    const pl = ad.placement || "Feed";
    if (!seen.has(ad.id)) {
      seen.add(ad.id);
      if (adsByPlacement[pl]) adsByPlacement[pl].push(ad);
    }
  });

  const getOriginalAd = (adId) => originalAdsRef.current.find(a => a.id === adId) || {};

  /* ── Filter by active placement ── */
  const visiblePlacements = activePlacement === 'all'
    ? placements
    : placements.filter(p => p.key === activePlacement);

  /* ── Breadcrumb label ── */
  const placementLabel = activePlacement === 'all' ? 'All Placements'
    : activePlacement === 'Feed' ? 'Feed Ads' : 'Stories & Reels';

  /* ── Client view: no sidebar, centered ── */
  if (isClient) {
    return (
      <CampaignProvider campaign={campaign}>
        <div className="board-container" style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '32px 20px',
          animation: 'fadeIn .4s ease',
        }}>
          {/* Simple client header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:32}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <div className="campaign-badge" style={{width:44,height:44,fontSize:16}}>
                <span>PD</span>
              </div>
              <div>
                <h1 style={{fontSize:20,fontWeight:700,margin:0,color:'var(--text-primary)'}}>
                  {campaign.project} — Ad Preview
                </h1>
                <p style={{fontSize:13,color:'var(--text-secondary)',margin:'2px 0 0'}}>
                  {campaign.objective} · {campaign.languages.join(', ')}
                </p>
              </div>
            </div>
            <div className="view-toggle">
              <button onClick={() => handleSetView("internal")}>Internal</button>
              <button className="active">Client</button>
            </div>
          </div>

          {/* Cards without device frame for client */}
          {placements.map(pl => {
            const ads = adsByPlacement[pl.key];
            if (!ads || ads.length === 0) return null;
            const isFeed = pl.key === "Feed";

            return (
              <div key={pl.key} style={{marginTop:24}}>
                <div className="section-label">
                  <span>{pl.icon}</span>
                  <span>{pl.clientLabel}</span>
                  <span className="section-count">{ads.length} ad{ads.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="card-grid" style={{marginTop:16}}>
                  {ads.map((ad, idx) => {
                    const uniqueTiers = [...new Set((adTierMap[ad.id] || []).map(t => t.tier))];
                    return (
                      <div key={ad.id} className="card-grid__item" style={{animation:'fadeIn .3s ease'}}>
                        {uniqueTiers.length > 1 && (
                          <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:10,fontSize:12,color:'var(--text-secondary)'}}>
                            Runs in:
                            {uniqueTiers.map(t => (
                              <span key={t} className={`tier-badge ${tierClass(t)}`} style={{fontSize:10,padding:'1px 7px'}}>{t}</span>
                            ))}
                          </div>
                        )}
                        <div style={{display:'flex',flexWrap:'wrap',gap:24,justifyContent:'center'}}>
                          {isFeed ? (
                            <FeedCard ad={ad} adIndex={idx} isClient />
                          ) : (
                            <Fragment>
                              <StoryCard ad={ad} adIndex={idx} isClient />
                              <ReelCard ad={ad} adIndex={idx} isClient />
                            </Fragment>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div style={{textAlign:'center',fontSize:12,color:'var(--text-secondary)',marginTop:48,paddingBottom:20,opacity:.6}}>
            {campaign.project} · Ad Preview · Periphery Digital
          </div>
        </div>
      </CampaignProvider>
    );
  }

  /* ── Internal view: AppShell with Sidebar ── */
  const sidebarEl = (
    <Sidebar
      campaign={campaign}
      adSets={adSets}
      ads={adsState}
      totalFiles={totalFiles}
      activePlacement={activePlacement}
      setActivePlacement={setActivePlacement}
      view={view}
      setView={handleSetView}
      theme={theme}
      setTheme={setTheme}
      modifiedCount={modifiedCount}
      onExport={handleExport}
    />
  );

  return (
    <CampaignProvider campaign={campaign}>
      <AppShell sidebar={sidebarEl}>
        {/* Toolbar */}
        <div className="toolbar">
          <div className="toolbar__breadcrumbs">
            <Link to="/" style={{color:'var(--text-secondary)',textDecoration:'none',fontSize:13}}>Campaigns</Link>
            <span style={{color:'var(--text-secondary)',fontSize:11}}>›</span>
            <span style={{color:'var(--text-primary)',fontWeight:600,fontSize:13}}>{campaign.project}</span>
            <span style={{color:'var(--text-secondary)',fontSize:11}}>›</span>
            <span style={{color:'var(--text-secondary)',fontSize:13}}>{placementLabel}</span>
          </div>
          <div className="toolbar__actions">
            {/* Device preview toggle */}
            <div className="preview-toggle">
              <button
                className={`preview-toggle__btn${devicePreview ? ' active' : ''}`}
                onClick={() => setDevicePreview(true)}
                title="Device frame preview"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12" y2="18"/>
                </svg>
              </button>
              <button
                className={`preview-toggle__btn${!devicePreview ? ' active' : ''}`}
                onClick={() => setDevicePreview(false)}
                title="Card view"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                </svg>
              </button>
            </div>

            {/* View toggle */}
            <div className="view-toggle">
              <button className="active">Internal</button>
              <button onClick={() => handleSetView('client')}>Client</button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="campaign-stats-row" style={{marginBottom:24}}>
          <div className="stat-card">
            <div>
              <div className="stat-card-number">{adSets.length}</div>
              <div className="stat-card-label">Ad Sets</div>
            </div>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-card-number">{adsState.length}</div>
              <div className="stat-card-label">Unique Ads</div>
            </div>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-card-number">{totalFiles}</div>
              <div className="stat-card-label">Creative Files</div>
            </div>
          </div>
          {modifiedCount > 0 && (
            <div className="stat-card modified">
              <div>
                <div className="stat-card-number">{modifiedCount}</div>
                <div className="stat-card-label">Modified</div>
              </div>
            </div>
          )}
          <div style={{marginLeft:'auto',display:'flex',gap:14,alignItems:'center'}}>
            {["Broad","Interest","Retargeting"].map(t => (
              <span key={t} style={{display:'flex',alignItems:'center',gap:5,fontSize:12,color:'var(--text-secondary)'}}>
                <span className="structure-dot" style={{background:tierColor(t),width:10,height:10}}></span>{t}
              </span>
            ))}
          </div>
        </div>

        {/* Placement groups */}
        {visiblePlacements.map(pl => {
          const ads = adsByPlacement[pl.key];
          if (!ads || ads.length === 0) return null;
          const isFeed = pl.key === "Feed";

          return (
            <div key={pl.key} style={{marginTop:8,marginBottom:40}}>
              <div className="section-label">
                <span>{pl.icon}</span>
                <span>{pl.label}</span>
                <span className="section-count">{ads.length} ad{ads.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="card-grid" style={{marginTop:20}}>
                {ads.map((ad, idx) => {
                  const tiers = adTierMap[ad.id] || [];

                  return (
                    <div key={ad.id} className="card-grid__item" style={{animation:'fadeIn .3s ease'}}>
                      {/* Ad set membership */}
                      {tiers.length > 0 && (
                        <div style={{
                          display:'flex',alignItems:'center',gap:6,marginBottom:12,
                          fontSize:12,color:'var(--text-secondary)',
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{opacity:.6}}>
                            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                          </svg>
                          <span style={{fontWeight:600,color:'var(--text-primary)'}}>Ad Sets:</span>
                          {tiers.map((t,i) => (
                            <span key={i} style={{
                              display:'inline-flex',alignItems:'center',gap:4,
                              padding:'2px 10px',background:'var(--bg-subtle)',
                              borderRadius:20,fontSize:11,border:'1px solid var(--border-light)',
                            }}>
                              <span className="structure-dot" style={{background:tierColor(t.tier),width:6,height:6}}></span>
                              {t.adSetName}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Card + edit panel row */}
                      <div style={{display:'flex',flexWrap:'wrap',gap:24,alignItems:'flex-start'}}>
                        {isFeed ? (
                          devicePreview ? (
                            <DeviceFrame variant="feed">
                              <FeedCard ad={ad} adIndex={idx} isClient={false} />
                            </DeviceFrame>
                          ) : (
                            <FeedCard ad={ad} adIndex={idx} isClient={false} />
                          )
                        ) : (
                          <Fragment>
                            {devicePreview ? (
                              <DeviceFrame variant="story">
                                <StoryCard ad={ad} adIndex={idx} isClient={false} />
                              </DeviceFrame>
                            ) : (
                              <StoryCard ad={ad} adIndex={idx} isClient={false} />
                            )}
                            {devicePreview ? (
                              <DeviceFrame variant="reel">
                                <ReelCard ad={ad} adIndex={idx} isClient={false} />
                              </DeviceFrame>
                            ) : (
                              <ReelCard ad={ad} adIndex={idx} isClient={false} />
                            )}
                          </Fragment>
                        )}
                        <EditPanel
                          ad={ad}
                          originalAd={getOriginalAd(ad.id)}
                          onUpdateCopy={updateAdCopy}
                          onUpdateCarousel={updateCarouselCard}
                          onReset={resetAd}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Footer */}
        <div style={{textAlign:'center',fontSize:12,color:'var(--text-secondary)',marginTop:32,paddingBottom:20,opacity:.6}}>
          periphery-meta-ads v0.4.0 · {adSets.length} ad sets · {adsState.length} ads · {totalFiles} files
        </div>
      </AppShell>
    </CampaignProvider>
  );
}

/* Wrapper that forces remount on slug change */
export default function CampaignBoard() {
  const { slug } = useParams();
  return <CampaignBoardInner key={slug} />;
}
