import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import useModalAccessibility from './dialog/useModalAccessibility';
import './Modal.css';

export default function Modal({ open, onClose, title, children, maxWidth = '560px' }) {
  const ref = useRef(null);
  const titleId = useId();
  useModalAccessibility(open, ref, onClose);

  if (!open) return null;

  return createPortal(
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} tabIndex={-1} className="modal" style={{ maxWidth }} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal-head">
          <h3 id={titleId}>{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar ventana">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
