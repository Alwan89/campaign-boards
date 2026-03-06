import PlatformTabs from './PlatformTabs';
import MetaCopySection from './MetaCopySection';
import CreativePanel from './CreativePanel';

/**
 * Tabbed copy form container.
 * Phase 1: Only Meta + Creatives are active. Other tabs show as disabled.
 */
export default function CopyFormPanel({ state, dispatch, onNeedApiKey }) {
  const platform = state.ui.activePlatform;

  return (
    <div className="studio-form">
      <PlatformTabs
        active={platform}
        onChange={v => dispatch({ type: 'SET_UI', field: 'activePlatform', value: v })}
      />

      <div className="studio-form__content">
        {platform === 'meta' && (
          <MetaCopySection state={state} dispatch={dispatch} onNeedApiKey={onNeedApiKey} />
        )}
        {platform === 'creatives' && (
          <CreativePanel state={state} dispatch={dispatch} />
        )}
      </div>
    </div>
  );
}
