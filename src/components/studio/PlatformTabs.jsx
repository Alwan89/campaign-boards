const PLATFORMS = [
  { key: 'meta', label: 'Meta Ads', enabled: true },
  { key: 'google', label: 'Google Ads', enabled: false },
  { key: 'linkedin', label: 'LinkedIn', enabled: false },
  { key: 'extensions', label: 'Extensions', enabled: false },
  { key: 'leadForm', label: 'Lead Form', enabled: false },
  { key: 'creatives', label: 'Creatives', enabled: true },
];

export default function PlatformTabs({ active, onChange }) {
  return (
    <div className="studio-platform-tabs">
      {PLATFORMS.map(p => (
        <button
          key={p.key}
          className={`studio-platform-tab${active === p.key ? ' active' : ''}${!p.enabled ? ' disabled' : ''}`}
          onClick={() => p.enabled && onChange(p.key)}
          disabled={!p.enabled}
        >
          {p.label}
          {!p.enabled && <span className="studio-platform-tab__badge">Soon</span>}
        </button>
      ))}
    </div>
  );
}
