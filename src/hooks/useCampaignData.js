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
