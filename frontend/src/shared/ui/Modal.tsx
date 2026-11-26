import { useEffect, useId, useRef, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  closeLabel?: string;
}

/**
 * Diálogo modal sobre `<dialog>` nativo.
 *
 * Delega el foco atrapado, el cierre con Escape y la semántica `dialog` al
 * navegador (WAI-ARIA APG), en lugar de reimplementar un focus trap propenso
 * a errores. En jsdom `showModal` puede no existir: se degrada a `open`.
 */
export function Modal({
  open,
  title,
  children,
  footer,
  onClose,
  closeLabel = 'Cerrar diálogo',
}: ModalProps): React.ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
    }

    if (!open && dialog.open) {
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="w-full max-w-lg rounded-2xl border border-emerald-100 bg-white p-0 text-gray-900 shadow-xl backdrop:bg-black/50"
    >
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
        <h2 id={titleId} className="text-lg font-bold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="min-h-12 min-w-12 rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-agro-green/30"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div className="px-6 py-4">{children}</div>
      {footer && <div className="border-t border-gray-100 px-6 py-4">{footer}</div>}
    </dialog>
  );
}
