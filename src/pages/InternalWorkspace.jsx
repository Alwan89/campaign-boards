import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { CampaignProvider } from '../context/CampaignContext';
import AppShell from '../components/AppShell';
import Sidebar from '../components/Sidebar';
import DeviceFrame from '../components/DeviceFrame';
import FeedCard from '../components/FeedCard';
import StoryCard from '../components/StoryCard';
import ReelCard from '../components/ReelCard';
import EditPanel from '../components/EditPanel';

/**
 * Internal view — dashboard with sidebar, card grid, edit panels.
 * Extracted from CampaignBoard.jsx with zero visual changes.
 */
export default function InternalWorkspace({
  data,
  adsState,
  adSets,
  adsByPlacement,
  adTierMap,
  visiblePlacements,
  activePlacement,
  setActivePlacement,
  devicePreview,
  setDevicePreview,
  view,
  handleSetView,
  theme,
  setTheme,
  modifiedCount,
  totalFiles,
  updateAdCopy,
  updateCarouselCard,
  resetAd,
  getOriginalAd,
  handleExport,
}) {
  const { campaign } = data;

  const tierColor = (t) => t==='Broad'?'var(--tier-broad)':t==='Interest'?'var(--tier-interest)':'var(--tier-retarg)';

  const placementLabel = activePlacement === 'all' ? 'All Placements'
    : activePlacement === 'Feed' ? 'Feed Ads' : 'Stories & Reels';

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
            {/* Edit in Studio link (for studio-published boards) */}
            {data.sources?.studioSlug && (
              <Link
                to={`/studio/${data.sources.studioSlug}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 600, color: 'var(--periphery)',
                  textDecoration: 'none', padding: '5px 12px',
                  borderRadius: 6, border: '1px solid var(--periphery)',
                  marginRight: 8,
                }}
                title="Open this board in Copy Studio for editing"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit in Studio
              </Link>
            )}

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
                            {(!ad.subPlacements || ad.subPlacements.includes('Story')) && (
                              devicePreview ? (
                                <DeviceFrame variant="story">
                                  <StoryCard ad={ad} adIndex={idx} isClient={false} />
                                </DeviceFrame>
                              ) : (
                                <StoryCard ad={ad} adIndex={idx} isClient={false} />
                              )
                            )}
                            {(!ad.subPlacements || ad.subPlacements.includes('Reel')) && (
                              devicePreview ? (
                                <DeviceFrame variant="reel">
                                  <ReelCard ad={ad} adIndex={idx} isClient={false} />
                                </DeviceFrame>
                              ) : (
                                <ReelCard ad={ad} adIndex={idx} isClient={false} />
                              )
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
