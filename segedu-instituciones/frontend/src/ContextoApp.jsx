import { useEffect, useState } from 'react';
import api from './services/api';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { InstitucionProvider } from './context/InstitucionContext';
import PlataformaApp from './plataforma/PlataformaApp';
import { mensajeError } from './plataforma/utils';
import './plataforma/Plataforma.css';

function EstadoContexto({ titulo, children }) {
  return <main className="contexto-page"><section className="card contexto-card">
    <img src="/chakuy.png" alt="Chakuy Software" width="88" height="88" />
    <p className="eyebrow">SEGEDU · Chakuy Software</p>
    <h1>{titulo}</h1>{children}
  </section></main>;
}

export default function ContextoApp() {
  const [contexto, setContexto] = useState(null);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    api.get('/contexto', { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) {
        if (['plataforma', 'institucion', 'desconocida'].includes(data?.tipo)) setContexto(data);
        else setError('No se pudo identificar la institución. Intente nuevamente.');
      }
    }).catch(err => {
      if (controller.signal.aborted) return;
      if (err.response?.status === 404 && err.response.data?.tipo === 'desconocida') {
        setContexto({ tipo: 'desconocida' });
      } else if (!err.response || err.response.status === 404) {
        // Compatibilidad con instalaciones anteriores sin /contexto.
        setContexto({ tipo: 'institucion', estado: 'activa' });
      } else setError(mensajeError(err));
    });
    return () => controller.abort();
  }, [intento]);

  if (error) return <EstadoContexto titulo="No se pudo iniciar"><p role="alert">{error}</p>
    <button className="btn btn-primary" onClick={() => setIntento(i => i + 1)}>Reintentar</button></EstadoContexto>;
  if (!contexto) return <EstadoContexto titulo="Cargando SEGEDU"><p role="status">Identificando la institución…</p></EstadoContexto>;
  if (contexto.tipo === 'plataforma') return <PlataformaApp />;
  if (contexto.tipo === 'desconocida') return <EstadoContexto titulo="Institución no encontrada"><p>Revise la dirección o comuníquese con Chakuy Software.</p></EstadoContexto>;
  if (contexto.estado !== 'activa') return <EstadoContexto titulo={contexto.estado === 'suspendida' ? 'Acceso suspendido' : 'Esta institución se está configurando'}>
    {contexto.nombre && <p><strong>{contexto.nombre}</strong></p>}
    <p>{contexto.estado === 'suspendida' ? 'Comuníquese con Chakuy Software.' : 'Intente nuevamente más tarde o comuníquese con Chakuy Software.'}</p>
  </EstadoContexto>;
  return <InstitucionProvider><AuthProvider><App /></AuthProvider></InstitucionProvider>;
}
