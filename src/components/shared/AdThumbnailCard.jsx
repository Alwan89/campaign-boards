import FeedCard from '../FeedCard';
import StoryCard from '../StoryCard';
import ReelCard from '../ReelCard';
import { SearchAdCard, DemandGenCard } from '../GoogleAdCards';

/**
 * Renders an ad card at reduced scale inside a fixed-dimension container.
 * Clicking opens the detail panel.
 */
export default function AdThumbnailCard({ ad, adIndex, type, onClick, isActive, googleProps }) {
  const isFeed = type === 'feed';
  const isStory = type === 'story';
  const isReel = type === 'reel';
  const isSearch = type === 'search';
  const isDemandGen = type === 'demandgen';

  // Scale + container dimensions per type
  const config = isFeed
    ? { scale: 0.55, width: 275, height: 320 }
    : isStory || isReel
    ? { scale: 0.44, width: 158, height: 282 }
    : isSearch
    ? { scale: 0.45, width: 252, height: 300 }
    : { scale: 0.5, width: 200, height: 240 };

  const renderCard = () => {
    if (isFeed) return <FeedCard ad={ad} adIndex={adIndex} isClient />;
    if (isStory) return <StoryCard ad={ad} adIndex={adIndex} isClient />;
    if (isReel) return <ReelCard ad={ad} adIndex={adIndex} isClient />;
    if (isSearch && googleProps) {
      return <SearchAdCard {...googleProps} />;
    }
    if (isDemandGen && googleProps) {
      return <DemandGenCard {...googleProps} />;
    }
    return null;
  };

  return (
    <div
      className={`ad-thumbnail${isActive ? ' active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
    >
      <div
        className="ad-thumbnail__preview"
        style={{
          width: config.width,
          height: config.height,
        }}
      >
        <div
          className="ad-thumbnail__scaler"
          style={{
            transform: `scale(${config.scale})`,
            transformOrigin: 'top left',
          }}
        >
          {renderCard()}
        </div>
      </div>
      <div className="ad-thumbnail__label">
        <span className="ad-thumbnail__name">{ad?.name || googleProps?.label || 'Ad'}</span>
        {ad?.type && <span className="ad-thumbnail__type">{ad.type}</span>}
      </div>
    </div>
  );
}
