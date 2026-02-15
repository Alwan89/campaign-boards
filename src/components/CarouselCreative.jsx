import { useState } from 'react';

export default function CarouselCreative({ ad }) {
  const [offset, setOffset] = useState(0);
  const cards = ad.carouselCards;
  const cardW = 260;
  const visible = 1.9;
  const maxOff = Math.max(0, cards.length - Math.floor(visible));

  return (
    <div>
      <div className="fb-carousel-wrap" style={{position:'relative'}}>
        <div className="fb-carousel-track" style={{transform:`translateX(-${offset * cardW}px)`}}>
          {cards.map((card, i) => (
            <div key={i} className="fb-carousel-card">
              <img src={card.imageUrl} alt={card.headline} />
              <div className="fb-carousel-card-info">
                <div className="fb-carousel-card-headline">{card.headline}</div>
                <div className="fb-carousel-card-desc">{card.description}</div>
                <button className="fb-carousel-card-cta">{ad.copy.cta}</button>
              </div>
            </div>
          ))}
        </div>
        {offset > 0 && <button className="carousel-nav left" onClick={() => setOffset(o => o-1)}>&#8249;</button>}
        {offset < maxOff && <button className="carousel-nav right" onClick={() => setOffset(o => o+1)}>&#8250;</button>}
      </div>
      {/* Dot indicators */}
      {cards.length > 1 && (
        <div className="carousel-dots">
          {cards.map((_, i) => (
            <span
              key={i}
              className={`carousel-dot${i === offset ? ' active' : ''}`}
              onClick={() => setOffset(Math.min(i, maxOff))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
