/**
 * Branded header for client preview.
 * Minimal: project name, date, Periphery branding.
 */
export default function ClientHeader({ project }) {
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <header className="client-header">
      <div className="client-header__left">
        <div className="client-header__badge">
          <span>PD</span>
        </div>
        <div>
          <h1 className="client-header__project">{project}</h1>
          <p className="client-header__date">{dateStr} &middot; Ad Preview</p>
        </div>
      </div>
      <div className="client-header__brand">periphery</div>
    </header>
  );
}
