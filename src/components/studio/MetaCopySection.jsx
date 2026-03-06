import CopyField from './CopyField';
import CreativeSlot from './CreativeSlot';
import { META_LIMITS } from '../../utils/charLimits';

const AD_TYPES = [
  { key: 'single-image', label: 'Single Image' },
  { key: 'carousel', label: 'Carousel' },
  { key: 'video', label: 'Video' },
];

const CTA_OPTIONS = [
  'Learn More', 'Sign Up', 'Book Now', 'Contact Us', 'Get Offer',
  'Get Quote', 'Apply Now', 'Download', 'Shop Now', 'Subscribe',
  'Watch More', 'Send Message', 'Get Directions', 'See Menu',
];

export default function MetaCopySection({ state, dispatch, onNeedApiKey }) {
  const lang = state.ui.activeLanguage;
  const adType = state.ui.activeAdType || 'single-image';
  const copy = state.meta[adType];
  const limits = META_LIMITS[adType] || META_LIMITS['single-image'];
  const files = state.creatives.files;
  const project = state.project;

  // AI context shared by all fields in this section
  const aiBase = {
    projectName: project.projectName || project.name,
    developer: project.developer,
    objective: project.objective,
    language: lang,
    platform: 'meta',
  };

  function setField(field, value) {
    dispatch({ type: 'SET_META_FIELD', adType, field, lang, value });
  }

  function setNonLangField(field, value) {
    dispatch({ type: 'SET_META_FIELD', adType, field, value });
  }

  function setCarouselCard(cardIndex, field, value) {
    dispatch({ type: 'SET_META_CAROUSEL_CARD', cardIndex, field, lang, value });
  }

  function addCreative(file) {
    dispatch({ type: 'ADD_CREATIVE', file });
  }

  function removeCreative(id) {
    dispatch({ type: 'REMOVE_CREATIVE', id });
  }

  function getFileForPlacement(placement) {
    return files.find(f => f.placement === placement) || null;
  }

  return (
    <div className="studio-section">
      {/* Ad type sub-tabs */}
      <div className="studio-subtabs">
        {AD_TYPES.map(t => (
          <button
            key={t.key}
            className={`studio-subtab${adType === t.key ? ' active' : ''}`}
            onClick={() => dispatch({ type: 'SET_UI', field: 'activeAdType', value: t.key })}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Creative Assets Section ── */}
      <div className="studio-form__section-title">Creative Assets</div>

      {adType === 'carousel' ? (
        <div className="studio-copy-field">
          <div className="studio-copy-field__header">
            <label className="studio-copy-field__label">Carousel Card Images</label>
          </div>
          <div className="studio-copy-field__description">Upload a 1:1 image for each carousel card</div>
          <div className="studio-slot-row">
            {copy.cards.map((_, i) => (
              <CreativeSlot
                key={i}
                label={`Card ${i + 1}`}
                placement={`carousel-${i + 1}`}
                aspectHint="1:1"
                file={getFileForPlacement(`carousel-${i + 1}`)}
                onAdd={addCreative}
                onRemove={removeCreative}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="studio-copy-field">
          <div className="studio-copy-field__header">
            <label className="studio-copy-field__label">Creative Assets</label>
          </div>
          <div className="studio-copy-field__description">Upload separate creatives for feed and story/reel placements</div>
          <div className="studio-slot-row">
            <CreativeSlot
              label="Feed"
              placement="feed"
              aspectHint="1.91:1"
              file={getFileForPlacement('feed')}
              onAdd={addCreative}
              onRemove={removeCreative}
            />
            <CreativeSlot
              label="Story / Reel"
              placement="story"
              aspectHint="9:16"
              file={getFileForPlacement('story')}
              onAdd={addCreative}
              onRemove={removeCreative}
            />
          </div>
        </div>
      )}

      {/* ── Ad Copy Section ── */}
      <div className="studio-form__section-title">Ad Copy</div>

      {/* Primary text */}
      <CopyField
        label="Primary Text"
        description="Shows above the image in feed. Truncated at 125 characters with 'See more'."
        value={copy.text[lang] || ''}
        onChange={v => setField('text', v)}
        limit={limits.text}
        multiline
        placeholder="Write your ad copy here..."
        aiContext={{ ...aiBase, fieldType: 'primary_text' }}
        onNeedApiKey={onNeedApiKey}
      />

      {adType === 'carousel' ? (
        /* Carousel card fields */
        <div className="studio-carousel-cards">
          {copy.cards.map((card, i) => (
            <div key={i} className="studio-carousel-card">
              <div className="studio-carousel-card__header">
                <span className="studio-carousel-card__num">Card {i + 1}</span>
                {copy.cards.length > 2 && (
                  <button
                    className="studio-carousel-card__remove"
                    onClick={() => dispatch({ type: 'REMOVE_CAROUSEL_CARD', index: i })}
                    title="Remove card"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
              <CopyField
                label="Headline"
                description="Shows below the card image"
                value={card.headline[lang] || ''}
                onChange={v => setCarouselCard(i, 'headline', v)}
                limit={limits.headline}
                placeholder={`Card ${i + 1} headline`}
                aiContext={{ ...aiBase, fieldType: 'headline' }}
                onNeedApiKey={onNeedApiKey}
              />
              <CopyField
                label="Description"
                description="Shows below the headline in grey"
                value={card.description[lang] || ''}
                onChange={v => setCarouselCard(i, 'description', v)}
                limit={limits.description}
                placeholder={`Card ${i + 1} description`}
                aiContext={{ ...aiBase, fieldType: 'description' }}
                onNeedApiKey={onNeedApiKey}
              />
            </div>
          ))}
          {copy.cards.length < 10 && (
            <button
              className="studio-add-card-btn"
              onClick={() => dispatch({ type: 'ADD_CAROUSEL_CARD' })}
            >
              + Add Card
            </button>
          )}
        </div>
      ) : (
        /* Single image / video fields */
        <>
          <CopyField
            label="Headline"
            description="Bold text below the image. Keep it short and punchy."
            value={copy.headline[lang] || ''}
            onChange={v => setField('headline', v)}
            limit={limits.headline}
            placeholder="Ad headline"
            aiContext={{ ...aiBase, fieldType: 'headline' }}
            onNeedApiKey={onNeedApiKey}
          />
          <CopyField
            label="Description"
            description="Grey text next to the headline. May be hidden on some placements."
            value={copy.description[lang] || ''}
            onChange={v => setField('description', v)}
            limit={limits.description}
            placeholder="Ad description"
            aiContext={{ ...aiBase, fieldType: 'description' }}
            onNeedApiKey={onNeedApiKey}
          />
        </>
      )}

      {/* ── Settings Section ── */}
      <div className="studio-form__section-title">Settings</div>

      {/* CTA dropdown */}
      <div className="studio-copy-field">
        <div className="studio-copy-field__header">
          <label className="studio-copy-field__label">Call to Action</label>
        </div>
        <div className="studio-copy-field__description">Button text shown on the ad</div>
        <select
          className="studio-copy-input studio-select"
          value={copy.cta}
          onChange={e => setNonLangField('cta', e.target.value)}
        >
          {CTA_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Link */}
      <CopyField
        label="Destination URL"
        description="Where users land after clicking the ad"
        value={copy.link}
        onChange={v => setNonLangField('link', v)}
        placeholder="https://example.com/project"
      />
    </div>
  );
}
