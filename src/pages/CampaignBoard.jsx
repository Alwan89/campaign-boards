import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useCampaignData } from '../hooks/useCampaignData';
import { useAdState } from '../hooks/useAdState';
import { exportToXlsx } from '../utils/export';
import ClientPreview from './ClientPreview';
import InternalWorkspace from './InternalWorkspace';

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

/* ── Main board — thin wrapper ── */
function CampaignBoardInner() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  const [view, setView] = useState(viewParam === 'internal' ? 'internal' : 'client');
  const [activePlacement, setActivePlacement] = useState('all');
  const [devicePreview, setDevicePreview] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('cb-theme') || 'light');

  const { data, loading, error } = useCampaignData(slug);
  const { adsState, originalAds, updateAdCopy, updateCarouselCard, resetAd, modifiedCount, getOriginalAd } = useAdState(data);

  /* ── Theme persistence ── */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cb-theme', theme);
  }, [theme]);

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

  /* ── Helpers ── */
  const totalFiles = adsState.reduce((n, a) => n + a.files.length, 0);
  const handleExport = () => exportToXlsx(adsState, originalAds, campaign.name);

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

  /* ── Filter by active placement ── */
  const visiblePlacements = activePlacement === 'all'
    ? placements
    : placements.filter(p => p.key === activePlacement);

  /* ── Delegate to view ── */
  if (isClient) {
    return (
      <ClientPreview
        data={data}
        adsState={adsState}
        adsByPlacement={adsByPlacement}
      />
    );
  }

  return (
    <InternalWorkspace
      data={data}
      adsState={adsState}
      adSets={adSets}
      adsByPlacement={adsByPlacement}
      adTierMap={adTierMap}
      visiblePlacements={visiblePlacements}
      activePlacement={activePlacement}
      setActivePlacement={setActivePlacement}
      devicePreview={devicePreview}
      setDevicePreview={setDevicePreview}
      view={view}
      handleSetView={handleSetView}
      theme={theme}
      setTheme={setTheme}
      modifiedCount={modifiedCount}
      totalFiles={totalFiles}
      updateAdCopy={updateAdCopy}
      updateCarouselCard={updateCarouselCard}
      resetAd={resetAd}
      getOriginalAd={getOriginalAd}
      handleExport={handleExport}
    />
  );
}

/* Wrapper that forces remount on slug change */
export default function CampaignBoard() {
  const { slug } = useParams();
  return <CampaignBoardInner key={slug} />;
}
