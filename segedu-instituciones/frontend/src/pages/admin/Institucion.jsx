import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import { useInstitucion, LogoInstitucion } from '../../context/InstitucionContext';

const TIPOS = [
  { valor: 'colegio', nombre: 'Colegio', nota: 'Niveles, cursos, profesores y director' },
  { valor: 'instituto', nombre: 'Instituto técnico', nota: 'Carreras técnicas, módulos y coordinador' },
  { valor: 'universidad', nombre: 'Carrera universitaria', nota: 'Carreras, semestres, materias y jefe de carrera' }
];

const ETIQUETAS = [
  ['programa', 'Programa (singular)'], ['programas', 'Programas (plural)'],
  ['periodo', 'Periodo (singular)'], ['periodos', 'Periodos (plural)'],
  ['asignatura', 'Asignatura (singular)'], ['asignaturas', 'Asignaturas (plural)'],
  ['docente', 'Quien enseña (singular)'], ['docentes', 'Quienes enseñan (plural)'],
  ['estudiante', 'Quien estudia (singular)'], ['estudiantes', 'Quienes estudian (plural)'],
  ['jefe', 'Responsable académico'], ['plan', 'Plan de la asignatura']
];

export default function AdminInstitucion() {
  const { institucion, setInstitucion } = useInstitucion();
  const [form, setForm] = useState(null);
  const [logo, setLogo] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null);

  useEffect(() => { setForm({ ...institucion, terminos: { ...institucion.terminos } }); }, [institucion]);
  if (!form) return null;

  const cambiar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));
  const cambiarTermino = (clave, valor) => setForm((f) => ({ ...f, terminos: { ...f.terminos, [clave]: valor } }));

  // Al cambiar de tipo se cargan los términos de ese tipo; los que el
  // administrador quiera distintos los edita después y se guardan aparte.
  const cambiarTipo = async (tipo) => {
    setForm((f) => ({ ...f, tipo, terminos: {} }));
    setAviso({ tipo: 'info', texto: 'Guarde los cambios para cargar los nombres propios de este tipo de institución.' });
  };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true); setAviso(null);
    try {
      const datos = new FormData();
      for (const campo of ['nombre', 'sigla', 'tipo', 'lema', 'color_primario', 'color_acento', 'ciudad', 'telefono']) {
        datos.append(campo, form[campo] ?? '');
      }
      datos.append('terminos', JSON.stringify(form.terminos || {}));
      if (logo) datos.append('logo', logo);
      const { data } = await api.put('/admin/institucion', datos, { headers: { 'Content-Type': 'multipart/form-data' } });
      setInstitucion(data);
      setLogo(null);
      setAviso({ tipo: 'ok', texto: 'Cambios guardados. Ya se ven en todo el sistema.' });
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.response?.data?.error || 'No se pudieron guardar los cambios. Intente otra vez.' });
    } finally { setGuardando(false); }
  };

  return (
    <>
      <PageHeader
        title="Mi institución"
        lead="El nombre, el logo, los colores y las palabras que usa su institución. Se aplican al inicio de sesión, al menú y a los reportes."
      />

      <form onSubmit={guardar} style={{ display: 'grid', gap: '1.25rem', maxWidth: 920 }}>
        <section className="card" style={{ padding: '1.4rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Identidad</h2>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
            <LogoInstitucion size={72} />
            <div className="form-field" style={{ margin: 0 }}>
              <label htmlFor="inst-logo">Logo (PNG, fondo transparente si es posible)</label>
              <input id="inst-logo" type="file" accept="image/png" onChange={(e) => setLogo(e.target.files[0] || null)} />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-field"><label htmlFor="inst-nombre">Nombre completo</label>
              <input id="inst-nombre" value={form.nombre || ''} onChange={(e) => cambiar('nombre', e.target.value)} required /></div>
            <div className="form-field"><label htmlFor="inst-sigla">Sigla</label>
              <input id="inst-sigla" value={form.sigla || ''} maxLength={30} onChange={(e) => cambiar('sigla', e.target.value)} /></div>
            <div className="form-field"><label htmlFor="inst-lema">Lema</label>
              <input id="inst-lema" value={form.lema || ''} onChange={(e) => cambiar('lema', e.target.value)} /></div>
            <div className="form-field"><label htmlFor="inst-ciudad">Ciudad</label>
              <input id="inst-ciudad" value={form.ciudad || ''} onChange={(e) => cambiar('ciudad', e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '.5rem' }}>
            <div className="form-field" style={{ margin: 0 }}><label htmlFor="inst-c1">Color principal</label>
              <input id="inst-c1" type="color" value={form.color_primario} onChange={(e) => cambiar('color_primario', e.target.value)} style={{ width: 90, height: 44, padding: 4 }} /></div>
            <div className="form-field" style={{ margin: 0 }}><label htmlFor="inst-c2">Color de acento</label>
              <input id="inst-c2" type="color" value={form.color_acento} onChange={(e) => cambiar('color_acento', e.target.value)} style={{ width: 90, height: 44, padding: 4 }} /></div>
          </div>
        </section>

        <section className="card" style={{ padding: '1.4rem' }}>
          <h2 style={{ marginBottom: '.3rem' }}>Tipo de institución</h2>
          <p className="text-muted" style={{ marginBottom: '1rem' }}>Define las palabras que aparecen en el menú.</p>
          <div className="grid-3">
            {TIPOS.map((tipo) => (
              <label key={tipo.valor} style={{
                display: 'block', padding: '1rem', borderRadius: 'var(--radius)', cursor: 'pointer',
                border: `2px solid ${form.tipo === tipo.valor ? 'var(--brand)' : 'var(--border)'}`,
                background: form.tipo === tipo.valor ? 'var(--blue-50)' : 'var(--surface)'
              }}>
                <input type="radio" name="tipo" value={tipo.valor} checked={form.tipo === tipo.valor} onChange={() => cambiarTipo(tipo.valor)} style={{ marginRight: '.5rem' }} />
                <strong>{tipo.nombre}</strong>
                <div className="text-muted" style={{ fontSize: '.88rem', marginTop: '.3rem' }}>{tipo.nota}</div>
              </label>
            ))}
          </div>
        </section>

        <section className="card" style={{ padding: '1.4rem' }}>
          <h2 style={{ marginBottom: '.3rem' }}>Cómo le dicen ustedes</h2>
          <p className="text-muted" style={{ marginBottom: '1rem' }}>Cambie solo las palabras que su institución usa distinto. Las vacías toman el nombre habitual del tipo elegido.</p>
          <div className="grid-2">
            {ETIQUETAS.map(([clave, etiqueta]) => (
              <div className="form-field" key={clave}>
                <label htmlFor={`term-${clave}`}>{etiqueta}</label>
                <input id={`term-${clave}`} value={form.terminos?.[clave] || ''} maxLength={60} onChange={(e) => cambiarTermino(clave, e.target.value)} />
              </div>
            ))}
          </div>
        </section>

        {aviso && (
          <div role="status" style={{
            padding: '.8rem 1rem', borderRadius: 12, fontWeight: 600,
            background: aviso.tipo === 'error' ? 'var(--danger-bg)' : aviso.tipo === 'ok' ? 'var(--success-bg)' : 'var(--warning-bg)',
            color: aviso.tipo === 'error' ? 'var(--danger)' : aviso.tipo === 'ok' ? 'var(--success)' : 'var(--gold-dark)'
          }}>{aviso.texto}</div>
        )}

        <div><button className="btn btn-primary btn-lg" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button></div>
      </form>
    </>
  );
}
