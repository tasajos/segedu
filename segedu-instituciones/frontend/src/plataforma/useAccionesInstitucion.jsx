import { useRef, useState } from 'react';
import { useDialog } from '../components/dialog/DialogProvider';
import Modal from '../components/Modal';
import Credenciales from './Credenciales';
import api from './api';
import { mensajeError } from './utils';

export default function useAccionesInstitucion(refrescar) {
  const dialog = useDialog();
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [credenciales, setCredenciales] = useState(null);
  const [fallo, setFallo] = useState(null);

  const creado = data => { setFallo(null); setCredenciales(data); refrescar(); };
  const fallido = err => {
    setFallo({ mensaje: mensajeError(err), paso: err.response?.data?.paso, institucion: err.response?.data?.institucion });
    refrescar();
  };
  const ejecutar = async (institucion, accion) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      if (accion === 'estado') {
        const suspender = institucion.estado === 'activa';
        if (!await dialog.confirm(suspender ? `¿Suspender ${institucion.nombre}? Sus usuarios no podrán ingresar.` : `¿Reactivar ${institucion.nombre}? Sus usuarios podrán ingresar nuevamente.`, {
          titulo: suspender ? 'Suspender institución' : 'Reactivar institución', tipo: suspender ? 'peligro' : 'info', textoConfirmar: suspender ? 'Suspender' : 'Reactivar'
        })) return;
        await api.patch(`/instituciones/${institucion.id}`, { estado: suspender ? 'suspendida' : 'activa' });
        refrescar();
      } else if (accion === 'restablecer') {
        if (!await dialog.confirm(`¿Restablecer el acceso de ${institucion.admin.email}? La contraseña anterior dejará de funcionar.`, {
          titulo: 'Restablecer administrador', tipo: 'peligro', textoConfirmar: 'Restablecer'
        })) return;
        const { data } = await api.post(`/instituciones/${institucion.id}/restablecer-admin`);
        creado({ institucion, admin: data.admin });
      } else if (accion === 'reintentar') {
        const { data } = await api.post(`/instituciones/${institucion.id}/reintentar`);
        creado(data);
      }
    } catch (err) {
      if (err.response?.status === 502) fallido(err);
      else await dialog.alert(mensajeError(err), { tipo: 'error' });
    } finally { lock.current = false; setBusy(false); }
  };

  const dialogs = <>
    {credenciales && <Credenciales datos={credenciales} onClose={() => setCredenciales(null)} />}
    {fallo && <Modal open title="No se pudo configurar la institución" onClose={() => { if (!busy) setFallo(null); }}>
      <div className="error-state" role="alert"><p>{fallo.mensaje}</p>{fallo.paso && <p className="mt-2"><strong>Paso:</strong> {fallo.paso}</p>}</div>
      {busy && <p className="page-refresh mt-4" role="status">Creando base de datos y subdominio… puede tardar hasta un minuto</p>}
      <div className="plataforma-actions plataforma-actions-end mt-4">
        <button className="btn btn-secondary" disabled={busy} onClick={() => setFallo(null)}>Cerrar</button>
        {fallo.institucion?.estado === 'error' && <button className="btn btn-primary" disabled={busy} aria-busy={busy} onClick={() => ejecutar(fallo.institucion, 'reintentar')}>{busy ? 'Reintentando…' : 'Reintentar'}</button>}
      </div>
    </Modal>}
  </>;
  return { busy, ejecutar, creado, fallido, dialogs };
}
