/**
 * Read-only display of ad copy fields.
 * Used in the detail panel for client inspection.
 */
export default function CopyInspector({ ad, landingPage }) {
  const fields = [
    { label: 'Primary Text', value: ad.copy?.primary },
    { label: 'Headline', value: ad.copy?.headline },
    { label: 'Description', value: ad.copy?.description },
    { label: 'Call to Action', value: ad.copy?.cta },
    { label: 'Landing Page', value: ad.copy?.link || landingPage },
  ].filter(f => f.value);

  return (
    <div className="copy-inspector">
      <div className="copy-inspector__header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
        <span>Ad Copy</span>
      </div>
      {fields.map((f, i) => (
        <div key={i} className="copy-inspector__field">
          <div className="copy-inspector__label">{f.label}</div>
          <div className="copy-inspector__value">{f.value}</div>
        </div>
      ))}
    </div>
  );
}
