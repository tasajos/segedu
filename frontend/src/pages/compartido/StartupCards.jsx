import StartupCardsSimulator from '../../components/simulator/StartupCardsSimulator';

export default function StartupCards() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', marginBottom: '.25rem' }}>
          Startup Cards — Constructor de empresa
        </h1>
        <p style={{ fontSize: '.82rem', color: 'var(--ink-light)', maxWidth: 720, margin: 0, lineHeight: 1.6 }}>
          La IA genera <strong>15 cartas de rubros de negocio</strong> al estilo juego de cartas.
          Elige 5, define tu marca y la IA construirá el <strong>análisis de mercado para Cochabamba</strong>,
          te sugerirá <strong>personajes clave bolivianos reales</strong> como directivos y armará
          el <strong>organigrama jerárquico</strong> de tu empresa.
        </p>
      </div>
      <StartupCardsSimulator />
    </div>
  );
}
