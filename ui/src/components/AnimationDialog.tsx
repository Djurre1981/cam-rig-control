import { useEffect, useRef, useState } from "react";

type NameDialogProps = {
  title: string;
  label: string;
  initialName: string;
  confirmLabel: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
};

export function AnimationNameDialog({
  title,
  label,
  initialName,
  confirmLabel,
  onConfirm,
  onCancel,
}: NameDialogProps) {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <div className="animation-dialog-backdrop" onClick={onCancel}>
      <div
        className="animation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="animation-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 id="animation-dialog-title">{title}</h4>
        <label>
          {label}
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onConfirm(name);
              if (e.key === "Escape") onCancel();
            }}
          />
        </label>
        <div className="animation-dialog-actions">
          <button type="button" className="animation-dialog-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="animation-dialog-primary"
            onClick={() => onConfirm(name)}
            disabled={!name.trim()}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type UnsavedDialogProps = {
  animationName: string;
  onSave: () => void;
  onSaveAs: () => void;
  onDiscard: () => void;
  onCancel: () => void;
};

export function UnsavedChangesDialog({
  animationName,
  onSave,
  onSaveAs,
  onDiscard,
  onCancel,
}: UnsavedDialogProps) {
  return (
    <div className="animation-dialog-backdrop" onClick={onCancel}>
      <div
        className="animation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsaved-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 id="unsaved-dialog-title">Save changes?</h4>
        <p className="animation-dialog-message">
          <strong>{animationName}</strong> has unsaved changes. Save before switching animations?
        </p>
        <div className="animation-dialog-actions animation-dialog-actions-stack">
          <button type="button" className="animation-dialog-primary" onClick={onSave}>
            Save
          </button>
          <button type="button" className="animation-dialog-secondary" onClick={onSaveAs}>
            Save as…
          </button>
          <button type="button" className="animation-dialog-danger" onClick={onDiscard}>
            Discard changes
          </button>
          <button type="button" className="animation-dialog-ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

type ConfirmDialogProps = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
};

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  danger,
}: ConfirmDialogProps) {
  return (
    <div className="animation-dialog-backdrop" onClick={onCancel}>
      <div
        className="animation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 id="confirm-dialog-title">{title}</h4>
        <p className="animation-dialog-message">{message}</p>
        <div className="animation-dialog-actions">
          <button type="button" className="animation-dialog-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={danger ? "animation-dialog-danger" : "animation-dialog-primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
