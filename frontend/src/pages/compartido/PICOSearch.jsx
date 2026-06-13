import PICOSearchSimulator from '../../components/simulator/PICOSearchSimulator';

export default function PICOSearch() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', marginBottom: '.25rem' }}>
          Buscador PICO — Medicina Basada en Evidencia
        </h1>
        <p style={{ fontSize: '.82rem', color: 'var(--ink-light)', maxWidth: 720, margin: 0, lineHeight: 1.6 }}>
          Formula tu pregunta clínica con la metodología <strong>PICO</strong> (Paciente, Intervención,
          Comparación, Outcome). La IA generará los <strong>términos MeSH</strong>, ejecutará la búsqueda
          en bases de datos biomédicas y producirá un <strong>informe de evidencia</strong> con fuentes,
          PMIDs, DOI y nivel de recomendación Oxford CEBM.
        </p>
      </div>
      <PICOSearchSimulator />
    </div>
  );
}
