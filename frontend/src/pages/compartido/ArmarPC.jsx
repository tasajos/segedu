import PCBuilderSimulator from '../../components/simulator/PCBuilderSimulator';

export default function ArmarPC() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', marginBottom: '.25rem' }}>
          Armar una PC
        </h1>
        <p style={{ fontSize: '.82rem', color: 'var(--ink-light)', maxWidth: 740, margin: 0, lineHeight: 1.6 }}>
          Selecciona cada componente para armar tu computadora. El simulador verifica
          <strong> compatibilidad</strong> en tiempo real (socket, RAM, consumo, refrigeración) e indica si
          el equipo <strong>enciende o no</strong>. Al terminar, genera el <strong>reporte de gama y precio estimado</strong>.
          Usa los presets para ver ejemplos de configuraciones típicas.
        </p>
      </div>
      <PCBuilderSimulator />
    </div>
  );
}
