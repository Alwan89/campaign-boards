/**
 * Horizontal tab bar for filtering by placement type.
 * Reusable across client and internal views.
 */
export default function PlacementTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="placement-tabs">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={`placement-tabs__tab${activeTab === tab.key ? ' active' : ''}`}
          onClick={() => onTabChange(tab.key)}
        >
          <span className="placement-tabs__icon">{tab.icon}</span>
          <span className="placement-tabs__label">{tab.label}</span>
          {tab.count != null && (
            <span className="placement-tabs__count">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
