import ValidadorLeanSimulator from '../../components/simulator/ValidadorLeanSimulator';

export default function ValidadorLean() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', marginBottom: '.25rem' }}>
          Sprint de Validación Lean
        </h1>
        <p style={{ fontSize: '.82rem', color: 'var(--ink-light)', maxWidth: 720, margin: 0, lineHeight: 1.6 }}>
          Formula una <strong>hipótesis de negocio</strong>, diseña un experimento ágil y define tus criterios
          de éxito. La IA simulará las respuestas de <strong>8 clientes potenciales</strong> y emitirá
          un veredicto: <strong>Perseverar, Pivotar parcialmente o Pivotar</strong>.
          Descarga el reporte completo en PDF.
        </p>
      </div>
      <ValidadorLeanSimulator />
    </div>
  );
}
