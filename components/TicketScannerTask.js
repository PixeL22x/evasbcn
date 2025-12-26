'use client'

import { useState, useRef } from 'react'
import { Camera, CheckCircle, AlertCircle, Loader2, Upload, Edit3 } from 'lucide-react'

export default function TicketScannerTask({
    task,
    currentStep,
    totalSteps,
    onComplete,
    onNext,
    cierreId,
    trabajador
}) {
    const [scanning, setScanning] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [ticketData, setTicketData] = useState(null)
    const [error, setError] = useState(null)
    const [manualEdit, setManualEdit] = useState(false)
    const [manualTotal, setManualTotal] = useState('')
    const [uploadedImage, setUploadedImage] = useState(null)
    const fileInputRef = useRef(null)

    const handleCapture = async (imageFile) => {
        if (!imageFile) return

        setScanning(true)
        setAnalyzing(true)
        setError(null)

        try {
            // 1. Subir imagen a Cloudinary usando la API existente
            const formData = new FormData()
            formData.append('cierreId', cierreId)
            formData.append('trabajador', trabajador)
            formData.append('tareaId', task.id)
            formData.append('tipo', 'ticket_ventas')
            formData.append('descripcion', 'Ticket de ventas del día')
            formData.append('file', imageFile)

            const uploadRes = await fetch('/api/tarea/foto-individual', {
                method: 'POST',
                body: formData
            })

            if (!uploadRes.ok) {
                const errorData = await uploadRes.json()
                throw new Error(errorData.error || 'Error al subir la imagen')
            }

            const uploadData = await uploadRes.json()
            const imageUrl = uploadData.foto.url
            setUploadedImage(imageUrl)

            // 2. Analizar con Gemini usando la API existente
            const analyzeRes = await fetch('/api/tickets-diarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl: imageUrl
                })
            })

            if (!analyzeRes.ok) {
                const errorData = await analyzeRes.json()
                throw new Error(errorData.error || 'Error al analizar ticket')
            }

            const ticketResult = await analyzeRes.json()

            // Extraer total del resultado
            const total = ticketResult.ticket?.total || 0
            const items = ticketResult.ticket?.items || []

            setTicketData({
                total: total,
                items: items,
                imageUrl: imageUrl,
                ticketId: ticketResult.ticket?.id
            })

        } catch (err) {
            console.error('Error al procesar ticket:', err)
            setError(err.message || 'Error al procesar el ticket. Puedes ingresar el total manualmente.')
            setManualEdit(true)
        } finally {
            setScanning(false)
            setAnalyzing(false)
        }
    }

    const handleConfirm = async () => {
        const totalVentas = manualEdit
            ? parseFloat(manualTotal)
            : ticketData.total

        if (isNaN(totalVentas) || totalVentas < 0) {
            alert('Por favor ingresa un total válido')
            return
        }

        try {
            setScanning(true)

            // 1. Actualizar cierre con total de ventas y datos del ticket
            const cierreRes = await fetch(`/api/cierre/${cierreId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    totalVentas: totalVentas,
                    ticketData: ticketData || null
                })
            })

            if (!cierreRes.ok) {
                const errorData = await cierreRes.json().catch(() => ({}))
                console.error('Error del servidor:', errorData)
                throw new Error(errorData.error || 'Error al guardar el total de ventas')
            }

            // 2. Marcar tarea como completada
            const tareaRes = await fetch('/api/tarea', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tareaId: task.id,
                    completada: true,
                    cierreId: cierreId
                })
            })

            if (!tareaRes.ok) {
                throw new Error('Error al completar la tarea')
            }

            onComplete(task.id)
            setTimeout(() => onNext(), 1500)

        } catch (error) {
            console.error('Error:', error)
            alert('Error al guardar: ' + error.message)
        } finally {
            setScanning(false)
        }
    }

    const formatCurrency = (value) => {
        const num = parseFloat(value)
        return isNaN(num) ? '0.00' : num.toFixed(2)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-3 sm:p-6 lg:p-8">
            <div className="w-full max-w-2xl animate-fade-in">
                {/* Header */}
                <div className="text-center mb-4 sm:mb-6 lg:mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-white/10 backdrop-blur-sm rounded-full mb-3 sm:mb-4 lg:mb-6">
                        <span className="text-2xl sm:text-3xl lg:text-4xl">💰</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-1 sm:mb-2">
                        {task.nombre || 'Escanea el ticket de ventas'}
                    </h1>
                    <p className="text-white/70 text-sm sm:text-base lg:text-lg">
                        Paso {currentStep} de {totalSteps}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-4 sm:mb-6 lg:mb-8">
                    <div className="flex justify-between text-white/60 text-xs sm:text-sm mb-2">
                        <span>Progreso del cierre</span>
                        <span>{Math.round(((currentStep - 1) / totalSteps) * 100)}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2 sm:h-3 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${((currentStep - 1) / totalSteps) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20">
                    {!ticketData && !manualEdit && (
                        <>
                            <p className="text-white text-center mb-6 text-sm sm:text-base">
                                Escanea el ticket del total de ventas del día para extraer el total automáticamente
                            </p>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={(e) => handleCapture(e.target.files[0])}
                                className="hidden"
                                id="camera-input"
                            />

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={analyzing}
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 sm:py-6 px-6 sm:px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg text-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {analyzing ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                                        <span className="text-sm sm:text-base">Analizando ticket...</span>
                                    </div>
                                ) : (
                                    <span className="text-sm sm:text-base">📸 Escanear Ticket</span>
                                )}
                            </button>

                            <button
                                onClick={() => setManualEdit(true)}
                                className="w-full mt-4 text-white/70 hover:text-white text-xs sm:text-sm transition-colors"
                            >
                                O ingresar el total manualmente
                            </button>
                        </>
                    )}

                    {ticketData && !manualEdit && (
                        <div className="space-y-4">
                            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                                <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                                <p className="text-white text-center text-sm sm:text-base">Ticket analizado correctamente</p>
                            </div>

                            <div className="bg-white/5 rounded-lg p-6">
                                <p className="text-white/70 text-xs sm:text-sm mb-2">Total de ventas extraído:</p>
                                <p className="text-3xl sm:text-4xl font-bold text-white">{formatCurrency(ticketData.total)}€</p>
                            </div>

                            {ticketData.items && ticketData.items.length > 0 && (
                                <div className="bg-white/5 rounded-lg p-4">
                                    <p className="text-white/70 text-xs sm:text-sm mb-2">Items detectados: {ticketData.items.length}</p>
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        {ticketData.items.slice(0, 5).map((item, idx) => (
                                            <div key={idx} className="text-white text-xs sm:text-sm flex justify-between">
                                                <span className="truncate">{item.nombre || item.name}</span>
                                                <span className="ml-2">{formatCurrency(item.precio || item.price)}€</span>
                                            </div>
                                        ))}
                                        {ticketData.items.length > 5 && (
                                            <p className="text-white/50 text-xs text-center mt-2">
                                                +{ticketData.items.length - 5} items más
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={handleConfirm}
                                    disabled={scanning}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 sm:py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
                                >
                                    {scanning ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Guardando...
                                        </div>
                                    ) : (
                                        '✅ Confirmar Total'
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setTicketData(null)
                                        setUploadedImage(null)
                                    }}
                                    className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors text-sm sm:text-base"
                                >
                                    🔄
                                </button>
                            </div>
                        </div>
                    )}

                    {manualEdit && (
                        <div className="space-y-4">
                            <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                                <Edit3 className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                                <p className="text-white text-center text-sm sm:text-base">
                                    Ingresa el total manualmente
                                </p>
                            </div>

                            <div className="bg-white/5 rounded-lg p-4">
                                <label className="block text-white font-medium text-xs sm:text-sm mb-2">
                                    Total de ventas (€)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 text-lg">€</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={manualTotal}
                                        onChange={(e) => setManualTotal(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full pl-8 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-xl sm:text-2xl text-center placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        autoFocus
                                    />
                                </div>
                                {manualTotal && parseFloat(manualTotal) >= 0 && (
                                    <p className="mt-2 text-green-400 text-xs sm:text-sm text-center">
                                        Total: €{formatCurrency(manualTotal)}
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={handleConfirm}
                                disabled={!manualTotal || parseFloat(manualTotal) < 0 || scanning}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 sm:py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
                            >
                                {scanning ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Guardando...
                                    </div>
                                ) : (
                                    '✅ Confirmar Total'
                                )}
                            </button>

                            <button
                                onClick={() => {
                                    setManualEdit(false)
                                    setManualTotal('')
                                    setError(null)
                                }}
                                className="w-full text-white/70 hover:text-white text-xs sm:text-sm transition-colors"
                            >
                                ← Volver a escanear
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mt-4">
                            <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                            <p className="text-white text-center text-xs sm:text-sm">{error}</p>
                        </div>
                    )}
                </div>

                {/* Navigation Dots */}
                <div className="flex items-center justify-center gap-2 sm:gap-4 mt-6">
                    <div className="flex space-x-1 sm:space-x-2">
                        {Array.from({ length: totalSteps }, (_, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${index < currentStep - 1
                                    ? 'bg-green-400'
                                    : index === currentStep - 1
                                        ? 'bg-blue-400 animate-pulse'
                                        : 'bg-white/30'
                                    }`}
                            />
                        ))}
                    </div>
                    <div className="text-white/60 text-xs sm:text-sm">
                        {currentStep} / {totalSteps}
                    </div>
                </div>
            </div>
        </div>
    )
}
