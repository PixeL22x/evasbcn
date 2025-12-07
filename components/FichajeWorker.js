
import { useState, useEffect } from 'react'
import { Clock, CheckCircle, AlertCircle, Play, Square } from 'lucide-react'

export default function FichajeWorker({ onClose, trabajadorId, trabajadorNombre }) {
    const [loading, setLoading] = useState(true)
    const [status, setStatus] = useState('unknown') // 'idle' (fuera), 'working' (dentro)
    const [currentRecord, setCurrentRecord] = useState(null)
    const [history, setHistory] = useState([])
    const [observaciones, setObservaciones] = useState('')
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        loadStatus()
    }, [])

    const loadStatus = async () => {
        try {
            setLoading(true)
            // fetch history for today to see status
            const today = new Date().toISOString().split('T')[0]
            const res = await fetch(`/api/fichaje?trabajadorId=${trabajadorId}&fecha=${today}`)
            const data = await res.json()

            if (data.registros) {
                setHistory(data.registros)
                // Check if last record is open
                const lastRecord = data.registros[0] // ordered by desc
                if (lastRecord && !lastRecord.salida) {
                    setStatus('working')
                    setCurrentRecord(lastRecord)
                } else {
                    setStatus('idle')
                    setCurrentRecord(null)
                }
            }
        } catch (err) {
            console.error(err)
            setError('Error al cargar estado')
        } finally {
            setLoading(false)
        }
    }

    const handleClockIn = async () => {
        try {
            setActionLoading(true)
            setError('')
            const res = await fetch('/api/fichaje', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    trabajadorId,
                    tipo: 'turno',
                    observaciones
                })
            })

            if (res.ok) {
                await loadStatus()
                setObservaciones('')
            } else {
                const d = await res.json()
                setError(d.error || 'Error al fichar entrada')
            }
        } catch (err) {
            setError('Error de conexión')
        } finally {
            setActionLoading(false)
        }
    }

    const handleClockOut = async () => {
        try {
            setActionLoading(true)
            setError('')
            const res = await fetch('/api/fichaje', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'clock-out',
                    trabajadorId,
                    observaciones: observaciones || undefined
                })
            })

            if (res.ok) {
                await loadStatus()
                setObservaciones('')
            } else {
                const d = await res.json()
                setError(d.error || 'Error al fichar salida')
            }
        } catch (err) {
            setError('Error de conexión')
        } finally {
            setActionLoading(false)
        }
    }

    const formatTime = (isoString) => {
        if (!isoString) return '--:--'
        return new Date(isoString).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    }

    const getDuration = (start) => {
        const diff = new Date() - new Date(start)
        const hours = Math.floor(diff / 3600000)
        const minutes = Math.floor((diff % 3600000) / 60000)
        return `${hours}h ${minutes}m`
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-white/20 rounded-xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden">

                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Clock className="w-6 h-6 text-blue-400" />
                        Registro Horario
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white/60 hover:text-white text-2xl transition-colors"
                    >
                        ×
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 flex items-center gap-2 text-red-200">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="space-y-6">

                        {/* Main Action Area */}
                        <div className="text-center py-4">
                            <p className="text-white/70 mb-2">Hola, <span className="font-bold text-white">{trabajadorNombre}</span></p>

                            {status === 'working' ? (
                                <div className="animate-pulse bg-green-500/20 border border-green-500/50 rounded-full py-1 px-3 inline-flex items-center gap-2 text-green-300 text-sm mb-6">
                                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                    Estás trabajando desde {formatTime(currentRecord?.entrada)}
                                </div>
                            ) : (
                                <div className="bg-white/5 border border-white/10 rounded-full py-1 px-3 inline-flex items-center gap-2 text-white/50 text-sm mb-6">
                                    <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                                    No estás fichado actualmente
                                </div>
                            )}

                            {status === 'idle' ? (
                                <button
                                    onClick={handleClockIn}
                                    disabled={actionLoading}
                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-6 rounded-xl transition-all shadow-lg hover:scale-[1.02] flex flex-col items-center justify-center gap-2 group"
                                >
                                    {actionLoading ? (
                                        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Play className="w-12 h-12 fill-current" />
                                            <span className="text-xl">FICHAR ENTRADA</span>
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={handleClockOut}
                                    disabled={actionLoading}
                                    className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-6 rounded-xl transition-all shadow-lg hover:scale-[1.02] flex flex-col items-center justify-center gap-2 group"
                                >
                                    {actionLoading ? (
                                        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Square className="w-12 h-12 fill-current" />
                                            <span className="text-xl">FICHAR SALIDA</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Optional Note */}
                        <div>
                            <label className="text-xs text-white/60 mb-1 block">Observaciones (Opcional)</label>
                            <textarea
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
                                rows="2"
                                placeholder="Ej: Retraso por tráfico, Salida al médico..."
                                value={observaciones}
                                onChange={e => setObservaciones(e.target.value)}
                            />
                        </div>

                        {/* Today's History */}
                        {history.length > 0 && (
                            <div className="border-t border-white/10 pt-4">
                                <h3 className="text-sm font-bold text-white mb-3">Historial de Hoy</h3>
                                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                    {history.map(record => (
                                        <div key={record.id} className="bg-white/5 rounded-lg p-3 flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1 h-8 rounded-full ${record.salida ? 'bg-gray-500' : 'bg-green-500'}`}></div>
                                                <div>
                                                    <div className="text-white font-medium">Turno {record.salida ? 'Completado' : 'En Curso'}</div>
                                                    <div className="text-white/50 text-xs">
                                                        {formatTime(record.entrada)} - {record.salida ? formatTime(record.salida) : '...'}
                                                    </div>
                                                </div>
                                            </div>
                                            {record.salida && (
                                                <div className="text-white/70 font-mono text-xs bg-black/20 px-2 py-1 rounded">
                                                    {/* Calculate duration helper needed or just show times */}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    )
}
