'use client'

import { useState } from 'react'
import { RefreshCw, Database, Image, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

function StatusIcon({ pct }) {
    if (pct >= 90) return <AlertTriangle className="w-4 h-4 text-red-500" />
    if (pct >= 70) return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    return <CheckCircle className="w-4 h-4 text-green-500" />
}

function BarColor(pct) {
    if (pct >= 90) return 'bg-red-500'
    if (pct >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
}

function UsageBar({ pct, label, used, limit }) {
    return (
        <div className="mb-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{label}</span>
                <span>{used} / {limit} MB ({pct}%)</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${BarColor(pct)}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                />
            </div>
        </div>
    )
}

export function StorageMonitor() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const fetchStats = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/admin/storage')
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const json = await res.json()
            setData(json)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (iso) => new Date(iso).toLocaleString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })

    return (
        <div className="rounded-xl border bg-card shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        📊 Monitor de Almacenamiento
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Uso de espacio en MongoDB y Cloudinary
                    </p>
                </div>
                <Button
                    variant={data ? 'outline' : 'default'}
                    size="sm"
                    onClick={fetchStats}
                    disabled={loading}
                    className="gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {data ? 'Actualizar' : 'Comprobar'}
                </Button>
            </div>

            <div className="p-6">
                {/* Estado inicial */}
                {!data && !loading && !error && (
                    <div className="text-center py-8 text-muted-foreground">
                        <Database className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Pulsa "Comprobar" para ver el uso actual de almacenamiento</p>
                    </div>
                )}

                {/* Cargando */}
                {loading && (
                    <div className="text-center py-8 text-muted-foreground">
                        <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin opacity-50" />
                        <p className="text-sm">Consultando servicios...</p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300 text-sm">
                        ❌ {error}
                    </div>
                )}

                {/* Datos */}
                {data && !loading && (
                    <div className="grid gap-5 md:grid-cols-2">

                        {/* MongoDB */}
                        <div className="border rounded-xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 font-semibold">
                                    <Database className="w-4 h-4 text-green-600" />
                                    MongoDB Atlas
                                </div>
                                {data.mongodb ? <StatusIcon pct={data.mongodb.pct} /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
                            </div>

                            {data.mongodb ? (
                                <>
                                    <UsageBar
                                        pct={data.mongodb.pct}
                                        label="Almacenamiento total (datos + índices)"
                                        used={data.mongodb.totalSizeMB}
                                        limit={data.mongodb.limitMB}
                                    />
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="bg-muted/50 rounded-lg p-3">
                                            <div className="text-xs text-muted-foreground mb-1">Datos</div>
                                            <div className="font-semibold">{(data.mongodb.dataSize / 1024 / 1024).toFixed(2)} MB</div>
                                        </div>
                                        <div className="bg-muted/50 rounded-lg p-3">
                                            <div className="text-xs text-muted-foreground mb-1">Índices</div>
                                            <div className="font-semibold">{(data.mongodb.indexSize / 1024 / 1024).toFixed(2)} MB</div>
                                        </div>
                                        <div className="bg-muted/50 rounded-lg p-3">
                                            <div className="text-xs text-muted-foreground mb-1">Colecciones</div>
                                            <div className="font-semibold">{data.mongodb.collections}</div>
                                        </div>
                                        <div className="bg-muted/50 rounded-lg p-3">
                                            <div className="text-xs text-muted-foreground mb-1">Documentos</div>
                                            <div className="font-semibold">{data.mongodb.objects?.toLocaleString('es-ES')}</div>
                                        </div>
                                    </div>
                                    <div className={`text-xs font-medium rounded-lg px-3 py-2 text-center ${data.mongodb.pct >= 90 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : data.mongodb.pct >= 70 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                                        {data.mongodb.pct >= 90 ? '⚠️ Espacio crítico — considera ampliar el plan' : data.mongodb.pct >= 70 ? '🟡 Uso elevado — vigila el crecimiento' : `✅ Libre: ${(data.mongodb.limitMB - data.mongodb.totalSizeMB).toFixed(0)} MB disponibles`}
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-red-500">No se pudo obtener datos de MongoDB</p>
                            )}
                        </div>

                        {/* Cloudinary */}
                        <div className="border rounded-xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 font-semibold">
                                    <Image className="w-4 h-4 text-blue-600" />
                                    Cloudinary
                                    {data.cloudinary?.plan && (
                                        <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full font-normal">
                                            {data.cloudinary.plan}
                                        </span>
                                    )}
                                </div>
                                {data.cloudinary ? <StatusIcon pct={data.cloudinary.pct} /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
                            </div>

                            {data.cloudinary ? (
                                <>
                                    <UsageBar
                                        pct={data.cloudinary.pct}
                                        label="Almacenamiento de archivos"
                                        used={data.cloudinary.usedMB}
                                        limit={data.cloudinary.limitMB}
                                    />
                                    {data.cloudinary.bandwidthLimitMB > 0 && (
                                        <UsageBar
                                            pct={data.cloudinary.bandwidthPct}
                                            label="Ancho de banda (este mes)"
                                            used={data.cloudinary.bandwidthUsedMB}
                                            limit={data.cloudinary.bandwidthLimitMB}
                                        />
                                    )}
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="bg-muted/50 rounded-lg p-3">
                                            <div className="text-xs text-muted-foreground mb-1">Archivos</div>
                                            <div className="font-semibold">{data.cloudinary.resources?.toLocaleString('es-ES')}</div>
                                        </div>
                                        <div className="bg-muted/50 rounded-lg p-3">
                                            <div className="text-xs text-muted-foreground mb-1">Transformaciones</div>
                                            <div className="font-semibold">{data.cloudinary.transformations?.toLocaleString('es-ES')}</div>
                                        </div>
                                    </div>
                                    <div className={`text-xs font-medium rounded-lg px-3 py-2 text-center ${data.cloudinary.pct >= 90 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : data.cloudinary.pct >= 70 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                                        {data.cloudinary.pct >= 90 ? '⚠️ Espacio crítico — elimina archivos no usados' : data.cloudinary.pct >= 70 ? '🟡 Uso elevado — vigila las subidas' : `✅ Libre: ${(data.cloudinary.limitMB - data.cloudinary.usedMB).toFixed(0)} MB disponibles`}
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-red-500">No se pudo obtener datos de Cloudinary</p>
                            )}
                        </div>

                        {/* Errores parciales */}
                        {data.errors?.length > 0 && (
                            <div className="md:col-span-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-700 dark:text-yellow-300">
                                ⚠️ Algunos servicios no respondieron: {data.errors.join(' · ')}
                            </div>
                        )}

                        {/* Timestamp */}
                        <div className="md:col-span-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            Actualizado: {formatDate(data.fetchedAt)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
