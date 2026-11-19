import { useLayoutEffect, useRef } from 'react';

// Shared by form modals and queued dialogs: only the top layer handles focus/Escape.
const layers = [];
const originalInert = new Map();
let originalOverflow = '';
const focusable = 'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';
const controls = (node) => [...node.querySelectorAll(focusable)].filter(el => el.getClientRects().length && !el.closest('[inert]'));

function syncBackground() {
  const top = layers.at(-1);
  if (top) {
    for (const node of document.body.children) {
      if (!originalInert.has(node)) originalInert.set(node, node.inert);
      node.inert = !node.contains(top.node);
    }
  } else {
    originalInert.forEach((value, node) => { node.inert = value; });
    originalInert.clear();
    document.body.style.overflow = originalOverflow;
  }
}

export default function useModalAccessibility(open, ref, onClose, initialFocusRef) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const node = ref.current;
    const previous = document.activeElement;
    const layer = { node };
    if (!layers.length) originalOverflow = document.body.style.overflow;
    layers.push(layer);
    document.body.style.overflow = 'hidden';
    syncBackground();
    const focusFirst = () => (initialFocusRef?.current || controls(node)[0] || node).focus();
    focusFirst();
    const onFocus = (event) => {
      if (layers.at(-1) === layer && !node.contains(event.target)) focusFirst();
    };
    const onKey = (event) => {
      if (layers.at(-1) !== layer) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeRef.current();
      } else if (event.key === 'Tab') {
        const items = controls(node);
        const first = items[0];
        const last = items.at(-1);
        if (!first) { event.preventDefault(); node.focus(); }
        else if (event.shiftKey && (document.activeElement === first || !items.includes(document.activeElement))) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !items.includes(document.activeElement))) {
          event.preventDefault(); first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('focusin', onFocus, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('focusin', onFocus, true);
      const wasTop = layers.at(-1) === layer;
      layers.splice(layers.indexOf(layer), 1);
      syncBackground();
      if (wasTop) {
        if (previous?.isConnected && !previous.closest('[inert]')) previous.focus();
        else if (layers.length) (controls(layers.at(-1).node)[0] || layers.at(-1).node).focus();
      }
    };
  }, [open, ref, initialFocusRef]);
}
