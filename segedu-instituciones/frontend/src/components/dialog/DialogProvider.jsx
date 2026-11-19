import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import useModalAccessibility from './useModalAccessibility';
import './Dialog.css';

const DialogContext = createContext(null);
const types = {
  exito: { title: 'Listo', icon: '✓' },
  error: { title: 'No se pudo completar', icon: '✕' },
  advertencia: { title: 'Atención', icon: '!' },
  info: { title: 'Información', icon: 'i' },
  peligro: { title: 'Confirmar acción', icon: '!' },
};

function Dialog({ request, onClose }) {
  const ref = useRef(null);
  const primaryRef = useRef(null);
  const cancelRef = useRef(null);
  const id = useId();
  const { mensaje, options, confirm } = request;
  const tipo = types[options.tipo] ? options.tipo : 'info';
  useModalAccessibility(true, ref, () => onClose(false), confirm && tipo === 'peligro' ? cancelRef : primaryRef);
  return createPortal(
    <div className="dialog-overlay">
      <section ref={ref} tabIndex={-1} className={`chakuy-dialog dialog-${tipo}`} role="alertdialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-message`}>
        <div className="dialog-mascot" aria-hidden="true">
          <img src="/chakuy.png" alt="" width="64" height="64" />
          <span className="dialog-badge">{types[tipo].icon}</span>
        </div>
        <h2 id={`${id}-title`}>{options.titulo || types[tipo].title}</h2>
        <p id={`${id}-message`} className="dialog-message">{mensaje}</p>
        <div className="dialog-actions">
          {confirm && <button ref={cancelRef} type="button" className="btn btn-secondary" onClick={() => onClose(false)}>{options.textoCancelar || 'Cancelar'}</button>}
          <button ref={primaryRef} type="button" className={`btn ${tipo === 'peligro' ? 'btn-danger-solid' : 'btn-primary'}`} onClick={() => onClose(true)}>{options.textoConfirmar || (confirm ? 'Confirmar' : 'Entendido')}</button>
        </div>
      </section>
    </div>, document.body
  );
}

export function DialogProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const pending = useRef(new Set());
  const sequence = useRef(0);
  const lifecycle = useRef(0);
  const enqueue = useCallback((mensaje, options = {}, confirm = false) => new Promise(resolve => {
    const request = { id: ++sequence.current, mensaje, options, confirm, resolve };
    pending.current.add(request);
    setQueue(items => [...items, request]);
  }), []);
  const dialog = useMemo(() => ({
    alert: (mensaje, options) => enqueue(mensaje, options),
    confirm: (mensaje, options) => enqueue(mensaje, options, true),
  }), [enqueue]);
  useEffect(() => {
    const generation = ++lifecycle.current;
    return () => {
      // StrictMode replays effects; only settle requests after a real unmount.
      queueMicrotask(() => {
        if (generation !== lifecycle.current) return;
        pending.current.forEach(request => request.resolve(request.confirm ? false : undefined));
        pending.current.clear();
      });
    };
  }, []);
  const close = (value) => {
    const request = queue[0];
    if (!request || !pending.current.delete(request)) return;
    setQueue(items => items.filter(item => item.id !== request.id));
    request.resolve(request.confirm ? value : undefined);
  };
  return <DialogContext.Provider value={dialog}>
    {children}
    {queue[0] && <Dialog key={queue[0].id} request={queue[0]} onClose={close} />}
  </DialogContext.Provider>;
}

export function useDialog() {
  const dialog = useContext(DialogContext);
  if (!dialog) throw new Error('useDialog requiere DialogProvider');
  return dialog;
}
