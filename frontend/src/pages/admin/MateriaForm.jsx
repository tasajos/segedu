import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';

export default function MateriaForm({ role = 'admin' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const esEdicion = Boolean(id);

  const [form, setForm] = useState({
    nombre: '',
    codigo: '',
    grupo: '',
    semestre: '',
    creditos: '',
    carrera_id: '',
    docente_id: ''
  });

  const [carreras, setCarreras] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(false);

  const base = role === 'admin' ? '/admin' : '/jefe';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);

        const requests = [api.get(`${base}/docentes`)];

        if (role === 'admin') {
          requests.push(api.get('/admin/carreras'));
        }

        if (esEdicion) {
          requests.push(api.get(`${base}/materias/${id}`));
        }

        const responses = await Promise.all(requests);

        let idx = 0;
        setDocentes(responses[idx++].data);

        if (role === 'admin') {
          setCarreras(responses[idx++].data);
        }

        if (esEdicion) {
          const materia = responses[idx].data;
          setForm({
            nombre: materia.nombre || '',
            codigo: materia.codigo || '',
            grupo: materia.grupo || '',
            semestre: materia.semestre || '',
            creditos: materia.creditos || '',
            carrera_id: materia.carrera_id || '',
            docente_id: materia.docente_id || ''
          });
        } else if (location.state?.materia) {
          const materia = location.state.materia;
          setForm({
            nombre: materia.nombre || '',
            codigo: materia.codigo || '',
            grupo: materia.grupo || '',
            semestre: materia.semestre || '',
            creditos: materia.creditos || '',
            carrera_id: materia.carrera_id || '',
            docente_id: materia.docente_id || ''
          });
        }
      } catch (err) {
        alert('Error al cargar datos del formulario');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id, esEdicion, role]);

  const guardar = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (esEdicion) {
        await api.put(`${base}/materias/${id}`, form);
      } else {
        await api.post(`${base}/materias`, form);
      }

      navigate(role === 'admin' ? '/admin/materias' : '/jefe/materias');
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar la materia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        num={role === 'admin' ? '04' : '09'}
        eyebrow="Gestión académica"
        title={
          <>
            {esEdicion ? 'Editar' : 'Nueva'} <span className="display-italic">materia</span>
          </>
        }
        lead="Complete los datos de la materia y asigne un docente."
      />

      <form className="card" style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }} onSubmit={guardar}>
        <div>
          <label>Nombre</label>
          <input
            className="form-input"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Código</label>
          <input
            className="form-input"
            name="codigo"
            value={form.codigo}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Grupo</label>
          <input
            className="form-input"
            name="grupo"
            value={form.grupo}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Semestre</label>
          <input
            type="number"
            className="form-input"
            name="semestre"
            value={form.semestre}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Créditos</label>
          <input
            type="number"
            className="form-input"
            name="creditos"
            value={form.creditos}
            onChange={handleChange}
            required
          />
        </div>

        {role === 'admin' && (
          <div>
            <label>Carrera</label>
            <select
              className="form-input"
              name="carrera_id"
              value={form.carrera_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione una carrera</option>
              {carreras.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label>Docente</label>
          <select
            className="form-input"
            name="docente_id"
            value={form.docente_id}
            onChange={handleChange}
          >
            <option value="">Sin docente</option>
            {docentes.map(d => (
              <option key={d.id} value={d.id}>
                {d.nombre} {d.apellido}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '.75rem' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Crear materia'}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(role === 'admin' ? '/admin/materias' : '/jefe/materias')}
          >
            Cancelar
          </button>
        </div>
      </form>
    </>
  );
}