import { useEffect, useRef } from 'react';

/**
 * Debounced auto-save to localStorage.
 * Saves state as `studio:{slug}` and maintains `studio:index`.
 */
export function useAutoSave(state, delay = 500) {
  const timerRef = useRef(null);
  const slug = state.project.slug;

  useEffect(() => {
    if (!slug) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      // Save project state
      localStorage.setItem(`studio:${slug}`, JSON.stringify(state));

      // Update index
      const raw = localStorage.getItem('studio:index');
      const index = raw ? JSON.parse(raw) : [];
      const existing = index.findIndex(p => p.slug === slug);
      const entry = {
        slug,
        name: state.project.name,
        projectName: state.project.projectName,
        developer: state.project.developer,
        updatedAt: new Date().toISOString(),
      };
      if (existing >= 0) {
        index[existing] = entry;
      } else {
        index.unshift(entry);
      }
      localStorage.setItem('studio:index', JSON.stringify(index));
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, slug, delay]);
}

/**
 * Load a studio project from localStorage.
 */
export function loadStudioProject(slug) {
  const raw = localStorage.getItem(`studio:${slug}`);
  return raw ? JSON.parse(raw) : null;
}

/**
 * Load the studio project index.
 */
export function loadStudioIndex() {
  const raw = localStorage.getItem('studio:index');
  return raw ? JSON.parse(raw) : [];
}

/**
 * Delete a studio project from localStorage.
 */
export function deleteStudioProject(slug) {
  localStorage.removeItem(`studio:${slug}`);
  const raw = localStorage.getItem('studio:index');
  if (raw) {
    const index = JSON.parse(raw).filter(p => p.slug !== slug);
    localStorage.setItem('studio:index', JSON.stringify(index));
  }
}
