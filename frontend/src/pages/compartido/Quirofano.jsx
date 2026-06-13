import QuirofanoSimulator from '../../components/simulator/QuirofanoSimulator';

export default function Quirofano() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', marginBottom: '.25rem' }}>
          Sala de Operaciones — Simulador Quirúrgico
        </h1>
        <p style={{ fontSize: '.82rem', color: 'var(--ink-light)', maxWidth: 720, margin: 0, lineHeight: 1.6 }}>
          La IA genera una <strong>emergencia médica aleatoria</strong>. Conforma tu equipo quirúrgico
          seleccionando el personal disponible, asigna roles y toma decisiones críticas en tiempo real.
          Cada elección afecta los vitales del paciente — una mala secuencia puede ser fatal.
        </p>
      </div>
      <QuirofanoSimulator />
    </div>
  );
}
