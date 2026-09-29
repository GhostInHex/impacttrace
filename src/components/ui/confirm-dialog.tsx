"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Uses the native <dialog> element, so focus trapping, Escape-to-close, the
 * top layer, and the inert background come from the platform rather than
 * hand-rolled ARIA.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        // Clicks land on the dialog element itself only when they hit the backdrop.
        if (event.target === ref.current) onCancel();
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border bg-card p-0 text-card-foreground shadow-lg backdrop:bg-foreground/40"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
            <AlertTriangle aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 id="confirm-dialog-title" className="text-lg font-semibold">
              {title}
            </h2>
            <p id="confirm-dialog-description" className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
