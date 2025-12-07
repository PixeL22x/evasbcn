"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

const ToastContext = createContext(null)

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const toast = useCallback(({ title, description, variant = 'default', duration = 3000 }) => {
        const id = Date.now().toString()
        setToasts(prev => [...prev, { id, title, description, variant, duration }])

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id)
            }, duration)
        }
    }, [])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ toast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    )
}

function ToastContainer({ toasts, removeToast }) {
    return (
        <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4 max-h-screen overflow-hidden flex flex-col-reverse sm:bottom-4 sm:right-4 pointer-events-none">
            {toasts.map(t => (
                <div
                    key={t.id}
                    className={`
            pointer-events-auto flex items-start w-full max-w-sm overflow-hidden rounded-lg shadow-lg border transition-all duration-300 transform translate-y-0 opacity-100 animate-in slide-in-from-right-full fade-in
            ${t.variant === 'destructive' ? 'bg-destructive text-destructive-foreground border-destructive' : 'bg-background text-foreground border-border'}
          `}
                >
                    <div className="p-4 flex-1">
                        <div className="flex items-start gap-3">
                            {t.variant === 'destructive' ? (
                                <AlertCircle className="h-5 w-5 text-red-500" />
                            ) : (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                            <div className="flex-1">
                                {t.title && <h3 className="text-sm font-semibold">{t.title}</h3>}
                                {t.description && <p className="text-sm opacity-90 mt-1">{t.description}</p>}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => removeToast(t.id)}
                        className="p-2 mr-2 mt-2 rounded-md hover:bg-black/10 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    )
}
