import { useState } from 'react';
import { useCampaign } from '../context/CampaignContext';
import { ChevronDownIcon } from './icons/Icons';

export default function StructureTree({ adSets }) {
  const campaign = useCampaign();
  const [isOpen, setIsOpen] = useState(true);
  const tierColor = (t) => t==='Broad'?'var(--tier-broad)':t==='Interest'?'var(--tier-interest)':'var(--tier-retarg)';

  return (
    <div className="structure-panel">
      <div className="structure-toggle" onClick={() => setIsOpen(!isOpen)}>
        <h2>Campaign Structure</h2>
        <div className={`structure-toggle-icon${isOpen ? ' open' : ''}`}>
          <ChevronDownIcon />
        </div>
      </div>

      <div className="structure-content" style={{
        maxHeight: isOpen ? `${adSets.length * 32 + 40}px` : '0px',
        opacity: isOpen ? 1 : 0,
        marginTop: isOpen ? 12 : 0,
      }}>
        <div style={{fontSize:13}}>
          <div style={{fontWeight:600,marginBottom:4,display:'flex',alignItems:'center',gap:6}}>
            <span>{"\uD83D\uDCC1"}</span>
            <span>{campaign.name}</span>
          </div>
          <div className="structure-line">
            {adSets.map(as => (
              <div key={as.id} className="structure-node">
                <span className="structure-dot" style={{background:tierColor(as.tier)}}></span>
                <span style={{color:'#374151'}}>{as.name}</span>
                <span className="structure-ad-count">{as.ads.length} ads</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
