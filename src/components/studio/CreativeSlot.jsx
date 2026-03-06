import { useRef, useState } from 'react';

/**
 * A single placement-specific creative upload slot.
 * Shows a dropzone when empty, thumbnail when filled.
 */
export default function CreativeSlot({ label, placement, aspectHint, file, onAdd, onRemove }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [justUploaded, setJustUploaded] = useState(false);

  function handleFiles(fileList) {
    const f = fileList[0];
    if (!f) return;
    const isVideo = f.type.startsWith('video/');
    const isImage = f.type.startsWith('image/');
    if (!isImage && !isVideo) return;

    const url = URL.createObjectURL(f);
    const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Flash upload feedback
    setJustUploaded(true);
    setTimeout(() => setJustUploaded(false), 800);

    if (isImage) {
      const img = new Image();
      img.onload = () => {
        onAdd({
          id, filename: f.name, type: 'image', url, source: 'upload',
          width: img.naturalWidth, height: img.naturalHeight, placement,
        });
      };
      img.src = url;
    } else {
      onAdd({
        id, filename: f.name, type: 'video', url, source: 'upload',
        width: 0, height: 0, placement,
      });
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  if (file) {
    return (
      <div className="studio-slot">
        <div className="studio-slot__label">{label}</div>
        <div className={`studio-slot__filled${justUploaded ? ' just-uploaded' : ''}`}>
          <div className="studio-slot__thumb">
            {file.type === 'video' ? (
              <video src={file.url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <img src={file.url} alt={file.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            {file.type === 'video' && (
              <div className="studio-slot__video-badge">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="#fff"><polygon points="6,3 20,12 6,21"/></svg>
              </div>
            )}
          </div>
          <div className="studio-slot__meta">
            <span className="studio-slot__filename" title={file.filename}>{file.filename}</span>
            <button className="studio-slot__change" onClick={() => inputRef.current?.click()}>Replace</button>
            <button className="studio-slot__remove" onClick={() => onRemove(file.id)}>Remove</button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            style={{ display: 'none' }}
            onChange={e => {
              if (e.target.files.length) {
                onRemove(file.id);
                handleFiles(e.target.files);
                e.target.value = '';
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="studio-slot">
      <div className="studio-slot__label">{label}</div>
      <div
        className={`studio-slot__empty${dragOver ? ' dragover' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/>
        </svg>
        <span>{aspectHint || 'Upload'}</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={e => { if (e.target.files.length) { handleFiles(e.target.files); e.target.value = ''; } }}
        />
      </div>
    </div>
  );
}
