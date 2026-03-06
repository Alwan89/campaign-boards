import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStudioState } from '../hooks/useStudioState';
import { useAutoSave, loadStudioProject } from '../hooks/useAutoSave';
import { publishStudioAsBoard, saveBoardToLocalStorage } from '../utils/studioPublish';
import { exportStudioToXlsx } from '../utils/studioExport';
import StudioSidebar from '../components/studio/StudioSidebar';
import CopyFormPanel from '../components/studio/CopyFormPanel';
import PreviewPanel from '../components/studio/PreviewPanel';
import ApiKeyModal from '../components/studio/ApiKeyModal';

export default function StudioWorkspace() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [published, setPublished] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Load saved state from localStorage
  const saved = loadStudioProject(slug);
  const { state, dispatch } = useStudioState(saved);

  // Auto-save on changes
  useAutoSave(state);

  // Set page title
  useEffect(() => {
    const title = state.project.projectName || state.project.name || 'Copy Studio';
    document.title = `${title} — Copy Studio`;
  }, [state.project.projectName, state.project.name]);

  // If no saved project found, show error
  if (!saved) {
    return (
      <div style={{
        maxWidth: 500, margin: '80px auto', textAlign: 'center',
        padding: '40px 20px', color: 'var(--text-secondary)',
      }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Project not found</h2>
        <p>No copy project with slug "{slug}" exists.</p>
        <Link to="/studio" style={{ color: 'var(--periphery)', fontWeight: 600 }}>
          ← Back to Copy Studio
        </Link>
      </div>
    );
  }

  function handlePublish() {
    const data = publishStudioAsBoard(state);
    saveBoardToLocalStorage(data, slug, state.project);
    setPublished(true);
    setTimeout(() => navigate(`/${slug}`), 1500);
  }

  function handleExport() {
    exportStudioToXlsx(state);
  }

  return (
    <div className={`studio-workspace${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <StudioSidebar
        state={state}
        dispatch={dispatch}
        onPublish={handlePublish}
        onExport={handleExport}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        onNeedApiKey={() => setShowApiKeyModal(true)}
      />
      <CopyFormPanel
        state={state}
        dispatch={dispatch}
        onNeedApiKey={() => setShowApiKeyModal(true)}
      />
      <PreviewPanel state={state} dispatch={dispatch} />

      {/* Published toast */}
      {published && (
        <div className="studio-toast">
          Published! Opening campaign board...
        </div>
      )}

      {/* API Key Modal */}
      {showApiKeyModal && (
        <ApiKeyModal
          onClose={() => setShowApiKeyModal(false)}
        />
      )}
    </div>
  );
}
