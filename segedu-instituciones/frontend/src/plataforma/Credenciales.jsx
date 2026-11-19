import { useState } from 'react';
import Modal from '../components/Modal';

export default function Credenciales({ datos, onClose }) {
  const [aviso, setAviso] = useState('');
  const copiar = async (label, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setAviso(`${label}: copiado.`);
    } catch {
      setAviso('No se pudo copiar. Seleccione el texto y cópielo manualmente.');
    }
  };
  return <Modal open title="Credenciales del administrador" onClose={onClose} maxWidth="640px">
    <p className="plataforma-warning mb-4">Guarde esta contraseña: no se vuelve a mostrar.</p>
    <div className="plataforma-credentials">
      {[
        ['URL', datos.institucion.url], ['Correo', datos.admin.email], ['Contraseña temporal', datos.admin.passwordTemporal]
      ].map(([label, value], index) => <div key={label}>
        <label className="form-label" htmlFor={`credencial-${index}`}>{label}</label>
        <div className="plataforma-copy"><input className="form-input text-mono" id={`credencial-${index}`} readOnly value={value} onFocus={e => e.target.select()} />
          <button type="button" className="btn btn-secondary" aria-label={`Copiar ${label.toLowerCase()}`} onClick={() => copiar(label, value)}>Copiar</button></div>
      </div>)}
    </div>
    <p className="text-muted mt-4" role="status" aria-live="polite">{aviso}</p>
    <div className="plataforma-actions plataforma-actions-end mt-4"><button className="btn btn-primary" onClick={onClose}>Ya guardé las credenciales</button></div>
  </Modal>;
}
