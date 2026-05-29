import MercadoVirtualSimulator from '../../components/simulator/MercadoVirtualSimulator';

export default function MercadoVirtual() {
  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', margin: 0, marginBottom: '.25rem' }}>
          🛒 Mercado Virtual
        </h1>
        <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--ink-light)' }}>
          Unidad de Instrucción · Simulación de Ventas con IA · Cochabamba, Bolivia
        </p>
      </div>
      <MercadoVirtualSimulator />
    </div>
  );
}
