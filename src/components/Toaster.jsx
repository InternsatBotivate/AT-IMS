"use client"

import { useState, useEffect } from "react"

// Toast context for managing toasts
const toasts = []
let listeners = []

export function toast({ title, description, variant = "default" }) {
  const id = Date.now().toString()
  const newToast = { id, title, description, variant }

  toasts.push(newToast)

  // Notify all listeners
  listeners.forEach((listener) => listener([...toasts]))

  // Auto dismiss after 5 seconds
  setTimeout(() => {
    const index = toasts.findIndex((t) => t.id === id)
    if (index !== -1) {
      toasts.splice(index, 1)
      listeners.forEach((listener) => listener([...toasts]))
    }
  }, 5000)
}

export function Toaster() {
  const [currentToasts, setCurrentToasts] = useState([])

  useEffect(() => {
    // Add listener
    listeners.push(setCurrentToasts)

    // Initial state
    setCurrentToasts([...toasts])

    // Cleanup
    return () => {
      listeners = listeners.filter((l) => l !== setCurrentToasts)
    }
  }, [])

  const removeToast = (id) => {
    const index = toasts.findIndex((t) => t.id === id)
    if (index !== -1) {
      toasts.splice(index, 1)
      listeners.forEach((listener) => listener([...toasts]))
    }
  }

  if (currentToasts.length === 0) return null

  return (
    <div className="toast-container">
      {currentToasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${toast.variant === "destructive" ? "border-red-600" : "border-gray-200"}`}
        >
          <div className="flex flex-col gap-1">
            <div className="toast-title">{toast.title}</div>
            {toast.description && <div className="toast-description">{toast.description}</div>}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="absolute top-2 right-2 rounded-md p-1 text-foreground/50 opacity-70 transition-opacity hover:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
