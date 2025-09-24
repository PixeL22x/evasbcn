'use client'

import { useState, useEffect } from 'react'

export default function DebugPage() {
  const [status, setStatus] = useState('Verificando...')
  const [details, setDetails] = useState('')

  useEffect(() => {
    checkDatabaseConnection()
  }, [])

  const checkDatabaseConnection = async () => {
    try {
      setStatus('Probando conexión a la base de datos...')
      
      const response = await fetch('/api/debug')
      const data = await response.json()
      
      if (response.ok) {
        setStatus('✅ Conexión exitosa')
        setDetails(JSON.stringify(data, null, 2))
      } else {
        setStatus('❌ Error de conexión')
        setDetails(data.error || 'Error desconocido')
      }
    } catch (error) {
      setStatus('❌ Error de red')
      setDetails(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-white mb-6">🔍 Diagnóstico de Base de Datos</h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-2">Estado:</h2>
          <p className="text-lg">{status}</p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-2">Detalles:</h2>
          <pre className="bg-black/20 p-4 rounded-lg text-sm text-white/80 overflow-auto">
            {details}
          </pre>
        </div>

        <button
          onClick={checkDatabaseConnection}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          🔄 Probar de nuevo
        </button>
      </div>
    </div>
  )
}


