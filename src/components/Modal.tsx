import type { PropsWithChildren } from 'react'

type ModalProps = PropsWithChildren<{
  open: boolean
  title?: string
  onClose: () => void
  actions?: React.ReactNode
}>

export default function Modal({ open, title, onClose, actions, children }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-3/4 md:w-full max-w-lg rounded-lg bg-white shadow-lg dark:bg-neutral-900">
        {title && (
          <div className="border-b px-5 py-3 font-semibold text-neutral-900 dark:text-neutral-100 dark:border-neutral-800">
            {title}
          </div>
        )}
        <div className="px-5 py-4 text-neutral-800 dark:text-neutral-100">{children}</div>
        <div className="flex items-center justify-end gap-2 border-t px-5 py-3 dark:border-neutral-800">
          <button
            type="button"
            className="rounded-md border px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-neutral-800"
            onClick={onClose}
          >
            Cancelar
          </button>
          {actions}
        </div>
      </div>
    </div>
  )
}
