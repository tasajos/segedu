import CanvasNegocioSimulator from '../../components/simulator/CanvasNegocioSimulator';

export default function CanvasNegocio() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', marginBottom: '.25rem' }}>
          Canvas inteligente — Modelo de negocio
        </h1>
        <p style={{ fontSize: '.82rem', color: 'var(--ink-light)', maxWidth: 720, margin: 0, lineHeight: 1.6 }}>
          Construye tu modelo Canvas usando IA como asesor. Selecciona un <strong>rol de asesor IA</strong>,
          haz clic en cada bloque y copia el prompt generado para usarlo con ChatGPT, Claude o Gemini.
          Completa todos los bloques para tener tu modelo de negocio listo.
        </p>
      </div>
      <CanvasNegocioSimulator />
    </div>
  );
}
