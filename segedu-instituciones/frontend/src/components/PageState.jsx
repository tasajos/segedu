import { useCallback, useRef, useState } from 'react';

export function usePageLoad() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const request = useRef(0);
  const run = useCallback(async (load) => {
    const id = ++request.current;
    setLoading(true);
    setError('');
    try {
      return await load();
    } catch (err) {
      if (id === request.current) setError(err.response?.data?.message || err.response?.data?.error || 'No se pudo cargar la información. Intente nuevamente.');
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, []);
  return { loading, error, run };
}

export default function PageState({ state, onRetry, children }) {
  const hasLoaded = useRef(false);
  if (!state.loading && !state.error) hasLoaded.current = true;
  return <div className="page-state" aria-busy={state.loading}>
  {state.loading && <div className={hasLoaded.current ? 'page-refresh' : 'loading-state'} role="status" aria-live="polite">
    {!hasLoaded.current && <>
    <div className="skeleton" aria-hidden="true" style={{ height: 16, width: '60%', margin: '0 auto 12px' }} />
    <div className="skeleton" aria-hidden="true" style={{ height: 12, width: '40%', margin: '0 auto 20px' }} />
    </>}
    {hasLoaded.current ? 'Actualizando información…' : 'Cargando información…'}
  </div>}
  {state.error && <div className="error-state" role="alert">
    <p>{state.error}</p>
    {onRetry && <button type="button" className="btn btn-secondary mt-4" onClick={onRetry}>Reintentar</button>}
  </div>}
  {hasLoaded.current && (children || <div className="empty-state">No hay información disponible.</div>)}
  </div>;
}
