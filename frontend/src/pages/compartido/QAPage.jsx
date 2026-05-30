import QASimulator from '../../components/simulator/QASimulator';

export default function QAPage() {
  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', margin: 0, marginBottom: '.25rem' }}>
          🧪 QA Lab
        </h1>
        <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--ink-light)' }}>
          Unidad de Instrucción · Gestión de Calidad de Software
        </p>
      </div>
      <QASimulator />
    </div>
  );
}
