import LogicCircuitSimulator from '../../components/simulator/LogicCircuitSimulator';

export default function CircuitosLogicos() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', marginBottom: '.25rem' }}>
          Circuitos Lógicos — Simulador
        </h1>
        <p style={{ fontSize: '.82rem', color: 'var(--ink-light)', maxWidth: 680, margin: 0 }}>
          Selecciona un componente del panel izquierdo y haz clic en el canvas para colocarlo.
          Conecta los puertos arrastrando cables desde el <strong>circulo derecho</strong> (salida) al <strong>circulo izquierdo</strong> (entrada).
          Haz clic en <strong>Input</strong> o <strong>Button</strong> para alternar entre 0 y 1.
        </p>
      </div>
      <LogicCircuitSimulator />
    </div>
  );
}
