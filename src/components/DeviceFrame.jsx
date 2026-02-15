export default function DeviceFrame({ variant = 'feed', children }) {
  return (
    <div className={`device-frame device-frame--${variant}`}>
      {/* Status Bar */}
      <div className="device-frame__status-bar">
        <span className="device-frame__time">9:41</span>
        <div className="device-frame__notch" />
        <span className="device-frame__indicators">
          {/* Signal */}
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <rect x="0" y="6" width="2" height="4" rx="0.5" fill="rgba(255,255,255,.8)"/>
            <rect x="3" y="4" width="2" height="6" rx="0.5" fill="rgba(255,255,255,.8)"/>
            <rect x="6" y="2" width="2" height="8" rx="0.5" fill="rgba(255,255,255,.8)"/>
            <rect x="9" y="0" width="2" height="10" rx="0.5" fill="rgba(255,255,255,.8)"/>
          </svg>
          {/* WiFi */}
          <svg width="13" height="10" viewBox="0 0 24 18" fill="none">
            <path d="M2 5C6.5 1 17.5 1 22 5" stroke="rgba(255,255,255,.8)" strokeWidth="2" strokeLinecap="round"/>
            <path d="M6 9.5C9 6.5 15 6.5 18 9.5" stroke="rgba(255,255,255,.8)" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="14" r="1.5" fill="rgba(255,255,255,.8)"/>
          </svg>
          {/* Battery */}
          <svg width="22" height="10" viewBox="0 0 27 12" fill="none">
            <rect x="0.5" y="0.5" width="22" height="11" rx="2" stroke="rgba(255,255,255,.6)"/>
            <rect x="2" y="2" width="17" height="8" rx="1" fill="rgba(255,255,255,.8)"/>
            <rect x="24" y="3.5" width="2" height="5" rx="1" fill="rgba(255,255,255,.4)"/>
          </svg>
        </span>
      </div>

      {/* Screen */}
      <div className="device-frame__screen">
        {children}
      </div>

      {/* Home Indicator */}
      <div className="device-frame__home-bar" />
    </div>
  );
}
