import { useEffect, useRef, useState } from 'react';
import Modal from '../components/Modal';
import api from './api';
import { mensajeError, sugerirSubdominio, tipos } from './utils';

export default function NuevaInstitucion({ onClose, onCreated, onFailure }) {
  const [form, setForm] = useState({ nombre: '', sigla: '', tipo: 'colegio', subdominio: '', admin: { nombre: '', apellido: '', email: '' } });
  const [editado, setEditado] = useState(false);
  const [disponibilidad, setDisponibilidad] = useState(null);
  const [consulta, setConsulta] = useState(0);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const enviando = useRef(false);

  useEffect(() => {
    setDisponibilidad(null);
    if (!form.subdominio) return;
    const controller = new AbortController();
    const valor = form.subdominio;
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/subdominio-disponible', { params: { valor }, signal: controller.signal });
        if (!controller.signal.aborted) setDisponibilidad({ valor, ...data });
      } catch (err) {
        if (!controller.signal.aborted) setDisponibilidad({ valor, error: mensajeError(err) });
      }
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [form.subdominio, consulta]);

  const cambiar = (campo, valor) => {
    setErrores(prev => ({ ...prev, [campo]: undefined }));
    setForm(prev => {
      if (campo.startsWith('admin.')) return { ...prev, admin: { ...prev.admin, [campo.split('.')[1]]: valor } };
      if (campo === 'nombre' && !editado) return { ...prev, nombre: valor, subdominio: sugerirSubdominio(valor) };
      return { ...prev, [campo]: valor };
    });
  };
  const comprobado = disponibilidad?.valor === form.subdominio;
  const disponible = comprobado && disponibilidad.disponible;
  const guardar = async event => {
    event.preventDefault();
    if (enviando.current || !disponible) return;
    enviando.current = true;
    setSaving(true);
    setError('');
    setErrores({});
    try {
      const { data } = await api.post('/instituciones', {
        ...form, nombre: form.nombre.trim(), sigla: form.sigla.trim(),
        admin: { nombre: form.admin.nombre.trim(), apellido: form.admin.apellido.trim(), email: form.admin.email.trim() }
      });
      onCreated(data);
    } catch (err) {
      if (err.response?.status === 502) onFailure(err);
      else {
        setError(mensajeError(err));
        setErrores(err.response?.data?.errores || {});
      }
    } finally {
      enviando.current = false;
      setSaving(false);
    }
  };

  const campo = (name, label, type = 'text', optional = false) => {
    const value = name.startsWith('admin.') ? form.admin[name.split('.')[1]] : form[name];
    const id = `nueva-${name.replace('.', '-')}`;
    return <div className="form-field" key={name}>
      <label htmlFor={id}>{label}{optional ? ' (opcional)' : ' *'}</label>
      <input id={id} type={type} value={value} required={!optional} disabled={saving}
        aria-invalid={!!errores[name]} aria-describedby={errores[name] ? `${id}-error` : undefined}
        onChange={e => cambiar(name, e.target.value)} />
      {errores[name] && <p id={`${id}-error`} className="plataforma-field-error">{errores[name]}</p>}
    </div>;
  };

  return <Modal open onClose={() => { if (!enviando.current) onClose(); }} title="Nueva institución" maxWidth="720px">
    <form onSubmit={guardar} aria-busy={saving}>
      <p className="text-muted mb-4">Complete los datos de la institución y de su administrador. Los campos con * son obligatorios.</p>
      <div className="grid-2">{campo('nombre', 'Nombre')}{campo('sigla', 'Sigla', 'text', true)}</div>
      <div className="form-field"><label htmlFor="nueva-tipo">Tipo *</label>
        <select id="nueva-tipo" value={form.tipo} disabled={saving} onChange={e => cambiar('tipo', e.target.value)} aria-invalid={!!errores.tipo} aria-describedby={errores.tipo ? 'nueva-tipo-error' : undefined}>
          {Object.entries(tipos).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>{errores.tipo && <p id="nueva-tipo-error" className="plataforma-field-error">{errores.tipo}</p>}
      </div>
      <div className="form-field"><label htmlFor="nueva-subdominio">Subdominio *</label>
        <input id="nueva-subdominio" value={form.subdominio} required maxLength={30} disabled={saving} autoCapitalize="none" spellCheck={false}
          aria-invalid={!!errores.subdominio || (comprobado && disponibilidad.disponible === false)} aria-describedby="subdominio-ayuda subdominio-error"
          onChange={e => { setEditado(true); cambiar('subdominio', e.target.value); }} />
        <div id="subdominio-ayuda" className="mt-2" role="status" aria-live="polite">
          {!form.subdominio ? <span className="text-muted">De 3 a 30 caracteres. Use letras minúsculas, números y guiones.</span>
            : !comprobado ? <span className="text-muted">Comprobando disponibilidad…</span>
            : disponibilidad.error ? <><span className="text-danger">{disponibilidad.error}</span> <button type="button" className="btn btn-secondary btn-sm" disabled={saving} onClick={() => setConsulta(i => i + 1)}>Reintentar</button></>
            : disponible ? <span className="text-success">✓ disponible: {disponibilidad.url}</span>
            : <span className="text-danger">{disponibilidad.motivo}</span>}
        </div>
        <p id="subdominio-error" className="plataforma-field-error">{errores.subdominio}</p>
      </div>
      <h4 className="mb-4">Administrador</h4>
      <div className="grid-2">{campo('admin.nombre', 'Nombre')}{campo('admin.apellido', 'Apellido')}</div>
      {campo('admin.email', 'Correo', 'email')}
      {error && <p className="error-state mb-4" role="alert">{error}</p>}
      {saving && <p className="page-refresh" role="status">Creando base de datos y subdominio… puede tardar hasta un minuto</p>}
      <div className="plataforma-actions plataforma-actions-end">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
        <button className="btn btn-primary" disabled={saving || !disponible} aria-busy={saving}>{saving ? 'Creando…' : 'Crear institución'}</button>
      </div>
    </form>
  </Modal>;
}
