import { useCampaign } from '../context/CampaignContext';
import ExportButton from './ExportButton';

export default function CampaignHeader({ adSets, ads, totalFiles, modifiedCount, isClient, view, setView, onExport }) {
  const campaign = useCampaign();

  const tierColor = (t) => t==='Broad'?'var(--tier-broad)':t==='Interest'?'var(--tier-interest)':'var(--tier-retarg)';

  return (
    <div className="campaign-header">
      <div className="campaign-header-top">
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div className="campaign-badge">
            <span>PD</span>
          </div>
          <div>
            <h1 style={{fontSize:20,fontWeight:700,margin:0,color:'var(--text-primary)'}}>
              {isClient ? campaign.project + " \u2014 Ad Preview" : campaign.name}
            </h1>
            <p style={{fontSize:14,color:'var(--text-secondary)',margin:'2px 0 0',display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
              <span>{campaign.objective}</span>
              <span style={{opacity:.4}}>·</span>
              <span>{campaign.languages.join(", ")}</span>
              <span style={{opacity:.4}}>·</span>
              <span>{campaign.budget}</span>
              {!isClient && campaign.housing_category && (
                <span style={{padding:'2px 8px',background:'#fef3c7',color:'#92400e',fontSize:11,borderRadius:10,fontWeight:500}}>Housing Category</span>
              )}
            </p>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          {!isClient && <ExportButton onClick={onExport} modifiedCount={modifiedCount} />}
          <div className="view-toggle">
            <button className={view==="internal"?"active":""} onClick={() => setView("internal")}>Internal</button>
            <button className={view==="client"?"active":""} onClick={() => setView("client")}>Client</button>
          </div>
        </div>
      </div>

      {!isClient && (
        <div className="campaign-stats-row">
          <div className="stat-card">
            <div>
              <div className="stat-card-number">{adSets.length}</div>
              <div className="stat-card-label">Ad Sets</div>
            </div>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-card-number">{ads.length}</div>
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
      )}
    </div>
  );
}
