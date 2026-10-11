'use client';

import { useEffect, useId, useRef } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Buttons shown at the bottom, e.g. Cancel / Confirm. */
  footer?: React.ReactNode;
  size?: 'md' | 'lg';
}

/**
 * Accessible dialog built on <dialog>: focus moves inside, Escape and the backdrop close it,
 * and the page behind can't be interacted with while it is open.
 */
export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // click on the backdrop
      }}
      className={`m-auto w-[calc(100%-2rem)] rounded-2xl bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/40 ${
        size === 'lg' ? 'max-w-2xl' : 'max-w-md'
      }`}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="space-y-1 border-b border-border px-5 py-4">
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            {description && <p className="text-sm text-muted">{description}</p>}
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {footer && (
            <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-3">
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
