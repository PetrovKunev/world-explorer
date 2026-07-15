'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

type ToastKind = 'success' | 'error'

interface Toast {
  id: number
  kind: ToastKind
  message: string
}

type ShowToast = (kind: ToastKind, message: string) => void

const ToastContext = createContext<ShowToast>(() => {})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextIdRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const show = useCallback<ShowToast>(
    (kind, message) => {
      nextIdRef.current += 1
      const id = nextIdRef.current
      setToasts((prev) => [...prev, { id, kind, message }])
      setTimeout(() => dismiss(id), 4000)
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-16 z-[3000] flex flex-col items-center space-y-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm items-center space-x-2 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${
              toast.kind === 'success' ? 'bg-gray-900 dark:bg-gray-700' : 'bg-red-600'
            }`}
          >
            {toast.kind === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="rounded p-0.5 transition-colors hover:bg-white/20"
              aria-label="Затвори"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
