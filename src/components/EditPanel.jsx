import CopyField from './studio/CopyField';

export default function EditPanel({ ad, originalAd, onUpdateCopy, onUpdateCarousel, onReset }) {
  const isMod = (field) => ad.copy[field] !== originalAd.copy[field];
  const anyMod = JSON.stringify(ad.copy) !== JSON.stringify(originalAd.copy) ||
    (ad.carouselCards && JSON.stringify(ad.carouselCards) !== JSON.stringify(originalAd.carouselCards));

  return (
    <div className="edit-panel">
      <div className="edit-panel-header">
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--periphery)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          <span style={{fontWeight:600,fontSize:13,color:'var(--text-primary)'}}>Ad Copy</span>
          {anyMod && <span className="edit-modified-dot" title="Modified"></span>}
        </div>
        {anyMod && <button className="edit-reset-btn" onClick={() => onReset(ad.id)}>Reset</button>}
      </div>

      <CopyField
        label={<>Primary Text {isMod('primary') && <span className="edit-modified-dot"></span>}</>}
        value={ad.copy.primary}
        onChange={v => onUpdateCopy(ad.id, 'primary', v)}
        limit={125}
        multiline
      />

      <CopyField
        label={<>Headline {isMod('headline') && <span className="edit-modified-dot"></span>}</>}
        value={ad.copy.headline || ''}
        onChange={v => onUpdateCopy(ad.id, 'headline', v)}
        limit={40}
      />

      <CopyField
        label={<>Description {isMod('description') && <span className="edit-modified-dot"></span>}</>}
        value={ad.copy.description || ''}
        onChange={v => onUpdateCopy(ad.id, 'description', v)}
        limit={30}
      />

      <CopyField
        label={<>CTA {isMod('cta') && <span className="edit-modified-dot"></span>}</>}
        value={ad.copy.cta}
        onChange={v => onUpdateCopy(ad.id, 'cta', v)}
      />

      {/* Carousel card editors */}
      {ad.type === "Carousel" && ad.carouselCards && (
        <div style={{borderTop:'1px solid var(--border-subtle)',paddingTop:12,marginTop:4}}>
          <div className="edit-label" style={{marginBottom:8,fontSize:11}}>Carousel Cards</div>
          {ad.carouselCards.map((card, ci) => {
            const origCard = originalAd.carouselCards && originalAd.carouselCards[ci];
            const cardMod = origCard && (card.headline !== origCard.headline || card.description !== origCard.description);
            return (
              <div key={ci} className="carousel-edit-card">
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                  <span style={{fontSize:11,fontWeight:600,color:'var(--text-secondary)'}}>Card {ci+1}</span>
                  {cardMod && <span className="edit-modified-dot"></span>}
                </div>
                <CopyField
                  label="Headline"
                  value={card.headline}
                  onChange={v => onUpdateCarousel(ad.id, ci, 'headline', v)}
                  limit={40}
                  placeholder="Headline"
                />
                <CopyField
                  label="Description"
                  value={card.description || ''}
                  onChange={v => onUpdateCarousel(ad.id, ci, 'description', v)}
                  limit={25}
                  placeholder="Description"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
