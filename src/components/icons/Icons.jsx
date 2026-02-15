/* ═══════════════════════════════════════════════════
   SVG Icon Components
   ═══════════════════════════════════════════════════ */

export const PlayIcon = () => (
  <svg viewBox="0 0 24 24"><polygon points="6,3 20,12 6,21"/></svg>
);

export const GlobeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="#65676b">
    <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm-.5 14.9A6.96 6.96 0 011 8c0-2.2 1-4.2 2.7-5.5C4.5 3.3 5 4.5 5 5.8v.4c0 .8.6 1.4 1.4 1.4h.2c.8 0 1.4-.6 1.4-1.4V5c0-.5.3-.9.7-1.1l1.1-.6c.3-.2.5-.5.5-.8V2c1.7 1.3 2.8 3.2 2.8 5.4 0 3.6-2.8 6.5-6.3 6.9l-.3.6z"/>
  </svg>
);

export const ThumbIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#65676b" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
  </svg>
);

export const CommentIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#65676b" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);

export const ShareIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#65676b" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16,6 12,2 8,6"/><line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);

export const LinkIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="#1b2a4a">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
  </svg>
);

/* Three-dot horizontal ellipsis — Facebook header */
export const EllipsisIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="#65676b">
    <circle cx="4" cy="10" r="1.5"/>
    <circle cx="10" cy="10" r="1.5"/>
    <circle cx="16" cy="10" r="1.5"/>
  </svg>
);

/* Facebook Like reaction — blue circle with white thumbs-up */
export const LikeReactionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20">
    <circle cx="10" cy="10" r="10" fill="#1877f2"/>
    <path d="M10.7 5.3c-.2 0-.4.1-.5.3L8.5 9H7c-.3 0-.5.2-.5.5v4c0 .3.2.5.5.5h5.2c.4 0 .7-.2.8-.6l1-3c.1-.2 0-.4-.1-.5-.1-.1-.2-.2-.4-.2H11V7.5c0-.4-.1-.7-.3-.9-.2-.2-.4-.3-.6-.3h.6z" fill="none"/>
    <path d="M13.5 9.2h-2.3V7.1c0-.6-.5-1.1-1.1-1.1l-2 4v4.5h4.4c.5 0 .9-.3 1-.8l.7-3.1c.1-.3 0-.6-.2-.8-.1-.3-.3-.4-.5-.6z" fill="#fff"/>
    <rect x="6.5" y="10" width="1.5" height="4.5" rx=".4" fill="#fff"/>
  </svg>
);

/* Heart/Love reaction — red circle with white heart */
export const LoveReactionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20">
    <circle cx="10" cy="10" r="10" fill="#f0284a"/>
    <path d="M10 14.5l-.4-.4C7 11.7 5.5 10.3 5.5 8.6 5.5 7.2 6.6 6 8 6c.8 0 1.5.4 2 .9C10.5 6.4 11.2 6 12 6c1.4 0 2.5 1.2 2.5 2.6 0 1.7-1.5 3.1-4.1 5.5l-.4.4z" fill="#fff"/>
  </svg>
);

/* Chevron down — for collapsible sections */
export const ChevronDownIcon = ({ size = 20, color = '#8a8d91' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6,9 12,15 18,9"/>
  </svg>
);

/* ─── Reel Icon Stack ─── */

/* Heart icon — for Reel side panel */
export const ReelHeartIcon = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="#fff">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

/* Comment bubble — for Reel side panel */
export const ReelCommentIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="#fff">
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
  </svg>
);

/* Send/Share — paper plane for Reel */
export const ReelShareIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="#fff">
    <path d="M22 2L11 13"/>
    <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
  </svg>
);

/* Repost arrows — for Reel */
export const ReelRepostIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9"/>
    <path d="M3 11V9a4 4 0 014-4h14"/>
    <polyline points="7 23 3 19 7 15"/>
    <path d="M21 13v2a4 4 0 01-4 4H3"/>
  </svg>
);

/* Music note — for Reel spinning disc label */
export const MusicNoteIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="#fff">
    <path d="M9 18V5l12-2v13"/>
    <circle cx="6" cy="18" r="3"/>
    <circle cx="18" cy="16" r="3"/>
  </svg>
);
