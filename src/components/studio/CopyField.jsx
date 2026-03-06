import { useState } from 'react';
import { getCharStatus } from '../../utils/charLimits';
import AiVariationPopover from './AiVariationPopover';

/**
 * Reusable copy input with character counter, AI sparkle button, and field description.
 *
 * @param {string}   label       - Field label
 * @param {string}   description - Field description hint
 * @param {string}   value       - Current text value
 * @param {function} onChange     - Called with new value
 * @param {number}   limit       - Character limit
 * @param {boolean}  multiline   - Textarea vs input (default: false)
 * @param {string}   placeholder - Placeholder text
 * @param {function} onAiClick   - Custom AI click handler (overrides built-in)
 * @param {object}   aiContext   - Context for AI generation { fieldType, projectName, developer, objective, language, platform }
 * @param {function} onNeedApiKey - Called when API key is missing
 */
export default function CopyField({
  label,
  description,
  value = '',
  onChange,
  limit,
  multiline = false,
  placeholder = '',
  onAiClick,
  aiContext,
  onNeedApiKey,
}) {
  const [showAiPopover, setShowAiPopover] = useState(false);

  const len = value.length;
  const status = limit ? getCharStatus(len, limit) : 'ok';
  const statusColor = status === 'over' ? '#dc2626' : status === 'warn' ? '#d97706' : 'var(--text-secondary)';

  const hasAi = !!onAiClick || !!aiContext;

  function handleAiClick() {
    if (onAiClick) {
      onAiClick();
    } else if (aiContext) {
      setShowAiPopover(true);
    }
  }

  const inputProps = {
    className: 'studio-copy-input',
    value,
    onChange: e => onChange(e.target.value),
    placeholder,
    spellCheck: true,
  };

  return (
    <div className="studio-copy-field" style={{ position: 'relative' }}>
      <div className="studio-copy-field__header">
        <label className="studio-copy-field__label">{label}</label>
        <div className="studio-copy-field__meta">
          {hasAi && (
            <button
              className="studio-ai-btn"
              onClick={handleAiClick}
              title="Generate AI variations"
              type="button"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v1m0 16v1m-7.07-2.93l.7-.7M5.64 5.64l-.7-.7M3 12h1m16 0h1m-2.93 7.07l-.7-.7M18.36 5.64l.7-.7"/>
                <circle cx="12" cy="12" r="4"/>
              </svg>
            </button>
          )}
          {limit && (
            <span className="studio-copy-field__counter" style={{ color: statusColor }}>
              {len}/{limit}
            </span>
          )}
        </div>
      </div>
      {description && (
        <div className="studio-copy-field__description">{description}</div>
      )}
      {multiline ? (
        <textarea {...inputProps} rows={3} />
      ) : (
        <input type="text" {...inputProps} />
      )}

      {/* AI Variation Popover */}
      {showAiPopover && aiContext && (
        <AiVariationPopover
          fieldType={aiContext.fieldType}
          currentValue={value}
          charLimit={limit}
          projectName={aiContext.projectName}
          developer={aiContext.developer}
          objective={aiContext.objective}
          language={aiContext.language}
          platform={aiContext.platform}
          onSelect={v => onChange(v)}
          onClose={() => setShowAiPopover(false)}
          onNeedApiKey={onNeedApiKey}
        />
      )}
    </div>
  );
}
