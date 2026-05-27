import PitchArenaSimulator from '../../components/simulator/PitchArenaSimulator';

export default function PitchArena() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', marginBottom: '.25rem' }}>
          Pitch Arena — Simulador de presentación emprendedora
        </h1>
        <p style={{ fontSize: '.82rem', color: 'var(--ink-light)', maxWidth: 720, margin: 0, lineHeight: 1.6 }}>
          Responde 6 preguntas de diagnóstico, recibe un <strong>escenario único generado por IA</strong>{' '}
          (tipo de evaluador, condición especial, pregunta crítica), presenta tu pitch adaptado y obtén
          una <strong>evaluación por dimensiones</strong> con lineamientos de éxito, fracaso y el pitch ideal.
        </p>
      </div>
      <PitchArenaSimulator />
    </div>
  );
}
