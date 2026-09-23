// focusTrap: tiny Tab-cycle trap for drawer/popover dialogs that don't
// use Radix (Modal.jsx already traps via Radix). Returns a ref to spread
// onto the dialog element. No dependency, respects reduced motion (n/a).
import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(active = true) {
  const ref = useRef(null);
  useEffect(() => {
    if (!active || !ref.current) return;
    const root = ref.current;
    const prev = document.activeElement;
    const first = root.querySelector(FOCUSABLE);
    first?.focus?.(); // land inside on open
    const onKey = (e) => {
      if (e.key !== 'Tab') return;
      const items = [...root.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const head = items[0];
      const tail = items[items.length - 1];
      if (e.shiftKey && document.activeElement === head) {
        e.preventDefault();
        tail.focus();
      } else if (!e.shiftKey && document.activeElement === tail) {
        e.preventDefault();
        head.focus();
      }
    };
    root.addEventListener('keydown', onKey);
    return () => {
      root.removeEventListener('keydown', onKey);
      prev?.focus?.(); // return focus on close
    };
  }, [active]);
  return ref;
}
