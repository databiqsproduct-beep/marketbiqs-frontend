"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertTriangle, Archive, Info, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui";

export type ConfirmVariant = "danger" | "warning" | "primary" | "info";

export type ConfirmOptions = {
  title?: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  /** Optional icon override or extra details */
  description?: string;
};

export type ConfirmFunction = (options: ConfirmOptions | string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFunction | null>(null);

export function useConfirm(): ConfirmFunction {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return ctx;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    // Focus safe Cancel button by default to prevent accidental destructive actions
    const timer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [open, onCancel]);

  if (!open) return null;

  const isDanger = variant === "danger";
  const isWarning = variant === "warning";

  const defaultTitle = isDanger
    ? "Are you sure?"
    : isWarning
      ? "Confirmation required"
      : "Please confirm";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(20,35,31,0.48)] p-3 sm:p-4 backdrop-blur-[3px] animate-in fade-in duration-150 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-heading"
    >
      <div
        className="flex max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100vh-3rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-[0_24px_80px_rgba(20,35,31,0.28)] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-[var(--line)] px-5 py-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isDanger
                  ? "bg-red-100 text-red-600 border border-red-200/80"
                  : isWarning
                    ? "bg-amber-100 text-amber-700 border border-amber-200/80"
                    : "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--line)]"
              }`}
            >
              {isDanger ? (
                <Trash2 className="h-5 w-5" />
              ) : isWarning ? (
                <Archive className="h-5 w-5" />
              ) : (
                <Info className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2
                id="confirm-dialog-heading"
                className="font-[family-name:var(--font-display)] text-lg sm:text-xl font-bold text-[var(--ink)] leading-snug"
              >
                {title || defaultTitle}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-black/5 hover:text-[var(--ink)] transition touch-manipulation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div className="text-sm leading-relaxed text-[var(--muted)] whitespace-pre-line">
            {message}
          </div>

          {isDanger ? (
            <div className="flex items-center gap-2 rounded-xl bg-red-50/90 border border-red-200/80 px-3 py-2 text-xs font-medium text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
              <span>This action cannot be undone.</span>
            </div>
          ) : null}
        </div>

        {/* Actions Footer */}
        <div className="shrink-0 flex items-center justify-end gap-2.5 border-t border-[var(--line)] bg-[var(--panel)] px-5 py-3.5 sm:py-4">
          <Button
            ref={cancelBtnRef}
            type="button"
            variant="ghost"
            className="px-4 py-2 text-sm"
            onClick={onCancel}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={isDanger ? "danger" : "primary"}
            className="px-4 py-2 text-sm"
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [dialogState, setDialogState] = useState<
    (ConfirmOptions & { resolve: (val: boolean) => void }) | null
  >(null);

  const confirm = useCallback<ConfirmFunction>((options) => {
    return new Promise<boolean>((resolve) => {
      if (typeof options === "string") {
        const isDelete = /delete|remove|destroy|trash/i.test(options);
        const isArchive = /archive|disable|deactivate/i.test(options);
        setDialogState({
          title: isDelete ? "Confirm Deletion" : isArchive ? "Confirm Archive" : "Confirm Action",
          message: options,
          confirmText: isDelete ? "Delete" : isArchive ? "Archive" : "Confirm",
          cancelText: "Cancel",
          variant: isDelete ? "danger" : isArchive ? "warning" : "primary",
          resolve,
        });
      } else {
        const isDelete =
          options.variant === "danger" ||
          /delete|remove|destroy/i.test(options.title || "") ||
          /delete|remove|destroy/i.test(String(options.message));
        setDialogState({
          title: options.title || (isDelete ? "Confirm Deletion" : "Confirm Action"),
          message: options.message,
          confirmText: options.confirmText || (isDelete ? "Delete" : "Confirm"),
          cancelText: options.cancelText || "Cancel",
          variant: options.variant || (isDelete ? "danger" : "primary"),
          resolve,
        });
      }
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (dialogState) {
      dialogState.resolve(true);
      setDialogState(null);
    }
  }, [dialogState]);

  const handleCancel = useCallback(() => {
    if (dialogState) {
      dialogState.resolve(false);
      setDialogState(null);
    }
  }, [dialogState]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialogState ? (
        <ConfirmDialog
          open={Boolean(dialogState)}
          title={dialogState.title}
          message={dialogState.message}
          confirmText={dialogState.confirmText}
          cancelText={dialogState.cancelText}
          variant={dialogState.variant}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      ) : null}
    </ConfirmContext.Provider>
  );
}
