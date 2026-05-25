import AnalizadorMercadoSimulator from '../../components/simulator/AnalizadorMercadoSimulator';

export default function AnalizadorMercado() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', marginBottom: '.25rem' }}>
          Analizador de mercado con IA — Bolivia
        </h1>
        <p style={{ fontSize: '.82rem', color: 'var(--ink-light)', maxWidth: 720, margin: 0, lineHeight: 1.6 }}>
          Ingresa tu idea de negocio y la IA buscará <strong>negocios similares en Bolivia</strong>, analizará
          las <strong>tendencias del mercado</strong> y evaluará si tu idea tiene potencial de éxito.
          Descarga el análisis en PDF para adjuntarlo a otra IA y profundizar en los resultados.
        </p>
      </div>
      <AnalizadorMercadoSimulator />
    </div>
  );
}
