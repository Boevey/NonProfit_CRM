import { useEffect } from 'react'

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Delete',
  isProcessing = false,
  error = '',
  onCancel,
  onConfirm,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !isProcessing) {
        onCancel()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isProcessing, onCancel])

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isProcessing) {
          onCancel()
        }
      }}
    >
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <span className="confirm-icon" aria-hidden="true">
          🗑️
        </span>

        <h2 id="confirm-dialog-title">{title}</h2>
        <p id="confirm-dialog-description">{description}</p>

        {error && (
          <p className="form-message" role="alert">
            {error}
          </p>
        )}

        <div className="confirm-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
