import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';

export default function InstructorInicio() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/instructor/mis-cursos')
      .then(r => setCursos(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        num="01"
        eyebrow="Panel del instructor"
        title={<>Bienvenido, <span className="display-italic">{user.nombre}</span>.</>}
        lead="Gestiona los cursos especiales que te han sido asignados."
      />

      <div className="section-head" style={{ marginBottom:'1.25rem' }}>
        <h2>Mis cursos asignados</h2>
        <span className="count">{cursos.length} curso{cursos.length !== 1 ? 's' : ''}</span>
      </div>

      {loading && (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--ink-light)' }}>Cargando...</div>
      )}

      {!loading && cursos.length === 0 && (
        <div style={{ textAlign:'center', padding:'4rem', border:'1px dashed var(--line-strong)',
          borderRadius:'8px', color:'var(--ink-light)', fontStyle:'italic' }}>
          No tienes cursos asignados aún. El jefe de carrera te asignará cuando sea necesario.
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px,1fr))', gap:'1.25rem' }}>
        {cursos.map((c, i) => (
          <div
            key={c.id}
            onClick={() => navigate(`/instructor/curso/${c.id}`)}
            style={{ cursor:'pointer', borderRadius:'14px', overflow:'hidden',
              background:'linear-gradient(145deg,#1e3a5f,#1d4480)',
              boxShadow:'0 4px 16px rgba(29,78,216,.2)', transition:'transform .2s, box-shadow .2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 10px 28px rgba(29,78,216,.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 16px rgba(29,78,216,.2)'; }}
          >
            {/* Barra cupos */}
            <div style={{ height:'4px', background:'rgba(255,255,255,.12)' }}>
              <div style={{ height:'100%', background:'#60a5fa',
                width:`${Math.min(100, Math.round((parseInt(c.aprobados||0)/parseInt(c.max_estudiantes||1))*100))}%` }} />
            </div>

            <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'.75rem' }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:'.62rem', color:'rgba(147,197,253,.7)', letterSpacing:'.18em' }}>
                {String(i+1).padStart(2,'0')} · Curso especial
              </div>
              <h2 style={{ fontFamily:'var(--serif)', fontSize:'1.25rem', color:'#f1f5f9', margin:0, lineHeight:1.3 }}>
                {c.nombre}
              </h2>
              {c.descripcion && (
                <p style={{ fontSize:'.83rem', color:'rgba(147,197,253,.7)', margin:0, lineHeight:1.5,
                  display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                  {c.descripcion}
                </p>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                paddingTop:'.6rem', borderTop:'1px solid rgba(255,255,255,.08)', marginTop:'auto' }}>
                <span style={{ fontFamily:'var(--mono)', fontSize:'.72rem', color:'rgba(147,197,253,.65)' }}>
                  {c.aprobados || 0} / {c.max_estudiantes} participantes
                </span>
                <span style={{ fontFamily:'var(--mono)', fontSize:'.72rem', color:'rgba(147,197,253,.5)' }}>
                  Ingresar →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
