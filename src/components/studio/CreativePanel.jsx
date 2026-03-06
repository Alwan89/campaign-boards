import { useRef, useState } from 'react';

const PLACEMENT_OPTIONS = [
  { value: '', label: 'Unassigned' },
  { value: 'feed', label: 'Feed' },
  { value: 'story', label: 'Story / Reel' },
  { value: 'carousel-1', label: 'Carousel Card 1' },
  { value: 'carousel-2', label: 'Carousel Card 2' },
  { value: 'carousel-3', label: 'Carousel Card 3' },
  { value: 'carousel-4', label: 'Carousel Card 4' },
  { value: 'carousel-5', label: 'Carousel Card 5' },
  { value: 'google-display', label: 'Google Display' },
  { value: 'logo', label: 'Logo' },
];

export default function CreativePanel({ state, dispatch }) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const files = state.creatives.files;

  function addFiles(fileList) {
    Array.from(fileList).forEach(file => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      if (!isImage && !isVideo) return;

      const url = URL.createObjectURL(file);
      const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Get dimensions for images
      if (isImage) {
        const img = new Image();
        img.onload = () => {
          dispatch({
            type: 'ADD_CREATIVE',
            file: {
              id,
              filename: file.name,
              type: isVideo ? 'video' : 'image',
              url,
              source: 'upload',
              width: img.naturalWidth,
              height: img.naturalHeight,
              placement: '',
            },
          });
        };
        img.src = url;
      } else {
        dispatch({
          type: 'ADD_CREATIVE',
          file: {
            id,
            filename: file.name,
            type: 'video',
            url,
            source: 'upload',
            width: 0,
            height: 0,
            placement: '',
          },
        });
      }
    });
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      addFiles(e.dataTransfer.files);
    }
  }

  function handleFileInput(e) {
    if (e.target.files.length) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  }

  function handlePlacementChange(fileId, placement) {
    dispatch({ type: 'UPDATE_CREATIVE', id: fileId, updates: { placement } });
  }

  function handleRemove(fileId) {
    dispatch({ type: 'REMOVE_CREATIVE', id: fileId });
  }

  return (
    <div className="studio-section">
      {/* Upload zone */}
      <div
        className={`studio-upload-zone${dragOver ? ' dragover' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: .4 }}>
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="17,8 12,3 7,8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <div className="studio-upload-zone__text">
          Drop images or videos here, or click to browse
        </div>
        <div className="studio-upload-zone__hint">
          JPG, PNG, GIF, WebP, MP4, MOV
        </div>
      </div>

      {/* File gallery */}
      {files.length > 0 && (
        <div className="studio-creative-grid">
          {files.map(file => (
            <div key={file.id} className="studio-creative-card">
              <div className="studio-creative-card__preview">
                {file.type === 'video' ? (
                  <video src={file.url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src={file.url} alt={file.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                {file.type === 'video' && (
                  <div className="studio-creative-card__video-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><polygon points="6,3 20,12 6,21"/></svg>
                  </div>
                )}
                <button
                  className="studio-creative-card__remove"
                  onClick={() => handleRemove(file.id)}
                  title="Remove"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="studio-creative-card__info">
                <div className="studio-creative-card__name" title={file.filename}>
                  {file.filename}
                </div>
                <select
                  className="studio-creative-card__placement"
                  value={file.placement || ''}
                  onChange={e => handlePlacementChange(file.id, e.target.value)}
                >
                  {PLACEMENT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 12 }}>
          {files.length} file{files.length !== 1 ? 's' : ''} uploaded. Assign placements to see them in the preview.
        </div>
      )}
    </div>
  );
}
