import { create } from 'zustand'

export interface ToastRecord {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastStore {
  toasts: ToastRecord[]
  push: (toast: Omit<ToastRecord, 'id'>) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  push(toast) {
    const id = crypto.randomUUID()
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }]
    }))

    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((entry) => entry.id !== id) }))
    }, 4000)
  },

  dismiss(id) {
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }))
  }
}))
