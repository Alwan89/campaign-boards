import { useState, useEffect } from 'react';

export function useCampaignData(slug) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // 1. Check localStorage first (browser-built campaigns)
    const storageKey = `campaign:${slug}`;
    const localData = localStorage.getItem(storageKey);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        setData(parsed);
        setLoading(false);
        return;
      } catch (e) {
        // Corrupted localStorage — fall through to network fetch
        console.warn('Corrupted localStorage campaign data, falling back to network:', e);
      }
    }

    // 2. Fall back to static file (Python-built campaigns)
    const basePath = import.meta.env.BASE_URL;
    fetch(`${basePath}campaigns/${slug}/data.json`)
      .then(res => {
        if (!res.ok) throw new Error(`Campaign not found: ${slug}`);
        return res.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  return { data, loading, error };
}
