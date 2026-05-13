import DerivadaSimulator from '../../components/simulator/DerivadaSimulator';

export default function CalculoDerivadas() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', marginBottom: '.25rem' }}>
          Cálculo — Derivadas
        </h1>
        <p style={{ fontSize: '.82rem', color: 'var(--ink-light)', maxWidth: 720, margin: 0, lineHeight: 1.6 }}>
          Ingresa la función <strong>f(x)</strong> y el valor de <strong>x₀</strong> del punto P.
          El simulador calcula la derivada en P, la pendiente, las ecuaciones de la recta tangente y normal,
          y muestra la gráfica interactiva. Usa <code>*</code> para multiplicar, <code>^</code> para
          potencias y funciones como <code>sin</code>, <code>cos</code>, <code>ln</code>, <code>sqrt</code>.
        </p>
      </div>
      <DerivadaSimulator />
    </div>
  );
}
