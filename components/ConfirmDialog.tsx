'use client'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-label={title}
      >
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">{message}</p>
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onCancel}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Отказ
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
