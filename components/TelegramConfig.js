'use client'

import { useState, useEffect } from 'react'

export default function TelegramConfig() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [testMessage, setTestMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    checkConfig()
  }, [])

  const checkConfig = async () => {
    try {
      const response = await fetch('/api/telegram/config')
      const data = await response.json()
      setConfig(data)
    } catch (error) {
      console.error('Error verificando configuración:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendTestMessage = async () => {
    if (!testMessage.trim()) return

    setSending(true)
    try {
      const response = await fetch('/api/telegram/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: testMessage })
      })

      const result = await response.json()
      
      if (result.success) {
        alert('✅ Mensaje enviado exitosamente!')
        setTestMessage('')
      } else {
        alert(`❌ Error: ${result.message}`)
      }
    } catch (error) {
      alert('❌ Error enviando mensaje')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-xl font-bold text-white mb-4">🤖 Configuración de Telegram</h3>
      
      {!config?.configured ? (
        <div className="space-y-4">
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
            <h4 className="text-red-400 font-semibold mb-2">⚠️ Bot no configurado</h4>
            <p className="text-red-300 text-sm mb-3">{config?.message}</p>
            
            <div className="space-y-2">
              <h5 className="text-white font-medium">📋 Instrucciones:</h5>
              <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                {config?.instructions?.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
            </div>
          </div>
          
          <button
            onClick={checkConfig}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
          >
            🔄 Verificar configuración
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
            <h4 className="text-green-400 font-semibold mb-2">✅ Bot configurado correctamente</h4>
            <div className="text-gray-300 text-sm space-y-1">
              <p><strong>Bot:</strong> @{config.botInfo.username}</p>
              <p><strong>Nombre:</strong> {config.botInfo.firstName}</p>
              <p><strong>Chat ID:</strong> {config.chatId}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-white font-medium">🧪 Enviar mensaje de prueba:</h5>
            <div className="flex space-x-2">
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={sendTestMessage}
                disabled={sending || !testMessage.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm"
              >
                {sending ? '⏳ Enviando...' : '📤 Enviar'}
              </button>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
            <h5 className="text-blue-400 font-semibold mb-2">📊 Funcionalidades activas:</h5>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>✅ Notificaciones cuando se complete un cierre</li>
              <li>✅ Resumen de ventas del día</li>
              <li>✅ Información del trabajador y turno</li>
              <li>✅ Conteo de fotos subidas</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
