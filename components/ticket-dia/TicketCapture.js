'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, X, Check, AlertCircle, RefreshCw } from 'lucide-react'
import { validateAndCompressPhoto } from '@/lib/image-compression'

export default function TicketCapture({ onClose }) {
    const [file, setFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [ticketData, setTicketData] = useState(null)

    const fileInputRef = useRef(null)

    const handleFileSelect = async (e) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        try {
            setError(null)
            const compressedFile = await validateAndCompressPhoto(selectedFile)
            setFile(compressedFile)
            setPreviewUrl(URL.createObjectURL(compressedFile))
        } catch (err) {
            console.error('Error procesando imagen:', err)
            setError('Error al procesar la imagen. Inténtalo de nuevo.')
        }
    }

    const handleUploadAndAnalyze = async () => {
        if (!file) return

        setUploading(true)
        setError(null)

        try {
            // 1. Subir a Cloudinary
            const formData = new FormData()
            formData.append('file', file)
            formData.append('folder', 'tickets-diarios')

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            if (!uploadRes.ok) throw new Error('Error subiendo la imagen')

            const uploadData = await uploadRes.json()
            const imageUrl = uploadData.url

            setUploading(false)
            setProcessing(true)

            // 2. Enviar a analizar con Gemini
            const analyzeRes = await fetch('/api/tickets-diarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl })
            })

            if (!analyzeRes.ok) {
                const errData = await analyzeRes.json()
                throw new Error(errData.error || 'Error analizando el ticket')
            }

            const result = await analyzeRes.json()
            setTicketData(result.ticket)
            setSuccess(true)

        } catch (err) {
            console.error(err)
            setError(err.message || 'Ocurrió un error inesperado')
            setUploading(false)
            setProcessing(false)
        }
    }

    const handleReset = () => {
        setFile(null)
        setPreviewUrl(null)
        setError(null)
        setSuccess(false)
        setTicketData(null)
        setProcessing(false)
        setUploading(false)
    }

    if (success && ticketData) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 w-full max-w-md rounded-2xl border border-green-500/30 shadow-2xl overflow-hidden">
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">¡Ticket Procesado!</h2>
                        <p className="text-white/70 mb-6">
                            Total detectado: <span className="text-green-400 font-mono text-xl font-bold">{ticketData.total?.toFixed(2)}€</span>
                        </p>

                        <div className="bg-white/5 rounded-xl p-4 text-left mb-6 max-h-48 overflow-y-auto">
                            <h3 className="text-xs uppercase tracking-wider text-white/50 mb-2">Items Detectados ({ticketData.items?.length || 0})</h3>
                            <ul className="space-y-2">
                                {ticketData.items?.map((item, idx) => (
                                    <li key={idx} className="text-sm text-white/80 flex justify-between">
                                        <span>{item.nombre} x{item.cantidad}</span>
                                        <span>{item.precio?.toFixed(2)}€</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col">
            {/* Header */}
            <div className="bg-black/50 p-4 flex justify-between items-center">
                <h2 className="text-white font-bold text-lg">📸 Escanear Ticket del Día</h2>
                <button onClick={onClose} className="text-white/70 hover:text-white">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-4">

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 w-full max-w-md flex items-center gap-3">
                        <AlertCircle className="text-red-400 w-5 h-5 flex-shrink-0" />
                        <p className="text-red-200 text-sm">{error}</p>
                    </div>
                )}

                {!file ? (
                    <div className="w-full max-w-md space-y-4">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-white/20 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer min-h-[300px]"
                        >
                            <Camera className="w-16 h-16 text-white/50" />
                            <div className="text-center">
                                <p className="text-white font-medium text-lg">Toca para tomar foto</p>
                                <p className="text-white/50 text-sm mt-1">Asegúrate que el ticket esté bien iluminado</p>
                            </div>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>
                ) : (
                    <div className="w-full max-w-md flex-1 flex flex-col">
                        <div className="relative flex-1 bg-black rounded-2xl overflow-hidden mb-6 border border-white/10">
                            <img
                                src={previewUrl}
                                alt="Ticket preview"
                                className="w-full h-full object-contain"
                            />
                            <button
                                onClick={handleReset}
                                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full backdrop-blur-sm"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>

                        <button
                            onClick={handleUploadAndAnalyze}
                            disabled={uploading || processing}
                            className={`w-full font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 ${uploading || processing
                                    ? 'bg-blue-600/50 cursor-wait'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                } text-white shadow-lg`}
                        >
                            {uploading ? (
                                <>
                                    <Upload className="w-5 h-5 animate-bounce" /> Subiendo...
                                </>
                            ) : processing ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" /> Analizando con IA...
                                </>
                            ) : (
                                <>
                                    <Check className="w-5 h-5" /> Procesar Ticket
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
