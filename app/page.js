'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import SequentialTask from '../components/SequentialTask'
import WorkerForm from '../components/WorkerForm'
import PedidoHelados from '../components/PedidoHelados'


export default function Home() {
  const { user, logout, isAuthenticated, loading } = useAuth()
  const [tasks, setTasks] = useState([])
  const [currentStep, setCurrentStep] = useState(1)
  const [showTimer, setShowTimer] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showWorkerForm, setShowWorkerForm] = useState(false)
  const [showPedidoHelados, setShowPedidoHelados] = useState(false)
  const [cierreId, setCierreId] = useState(null)
  const [workerName, setWorkerName] = useState('')
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  const totalTasks = tasks.length
  const currentTask = tasks[currentStep - 1]
  const completedTasks = tasks.filter(task => task.completed || task.completada).length
  const isAllCompleted = completedTasks === totalTasks

  // Debug logging
  console.log('Debug info:', {
    totalTasks,
    currentStep,
    completedTasks,
    isAllCompleted,
    tasks: tasks.map(t => ({ id: t.id, nombre: t.nombre, completed: t.completed, completada: t.completada }))
  })

  // Redirigir a login si no está autenticado
  useEffect(() => {
    if (!loading && !isAuthenticated()) {
      window.location.href = '/login'
    }
  }, [isAuthenticated, loading])

  // Redirigir a admin dashboard si es administrador
  useEffect(() => {
    if (!loading && isAuthenticated() && user?.role === 'admin') {
      window.location.href = '/admin/dashboard'
    }
  }, [loading, isAuthenticated, user?.role])

  useEffect(() => {
    if (isAllCompleted && gameStarted) {
      setShowCelebration(true)
    }
  }, [isAllCompleted, gameStarted])

  // Cronómetro para medir el tiempo real
  useEffect(() => {
    let interval = null
    if (startTime && gameStarted && !isAllCompleted) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [startTime, gameStarted, isAllCompleted])

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Si no está autenticado, no mostrar nada (se redirigirá)
  if (!isAuthenticated()) {
    return null
  }

  // Si es admin, mostrar loading mientras se redirige
  if (user?.role === 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Redirigiendo al dashboard...</p>
        </div>
      </div>
    )
  }

  const handleTaskComplete = async (taskId) => {
    console.log('handleTaskComplete called for taskId:', taskId)
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task =>
        task.id === taskId
          ? { ...task, completed: true, completada: true }
          : task
      )
      console.log('Updated tasks:', updatedTasks)
      return updatedTasks
    })

    // Las fotos ahora se suben inmediatamente cuando se completa cada tarea
  }


  const handleNext = () => {
    if (currentStep < totalTasks) {
      // Pequeño delay para suavizar la transición
      setTimeout(() => {
        setCurrentStep(currentStep + 1)
      }, 100)
    } else {
      setShowCelebration(true)
    }
  }


  const handleStartGame = () => {
    setShowWorkerForm(true)
  }

  const handleWorkerSubmit = async (newCierreId, newWorkerName, turno) => {
    setCierreId(newCierreId)
    setWorkerName(newWorkerName)
    setShowWorkerForm(false)
    setCurrentStep(1)
    setShowCelebration(false)
    setLoadingTasks(true)
    setElapsedTime(0)
    
    // Cargar las tareas desde la base de datos antes de iniciar el juego
    await loadTasksFromDatabase(newCierreId)
    
    setLoadingTasks(false)
    setGameStarted(true)
    setStartTime(Date.now()) // Iniciar el cronómetro
  }

  const loadTasksFromDatabase = async (cierreId) => {
    try {
      const response = await fetch(`${window.location.origin}/api/cierre/${cierreId}`)
      
      if (response.ok) {
        const data = await response.json()
        setTasks(data.cierre.tareas)
      } else {
        console.error('Error en respuesta de carga de tareas:', response.status)
      }
    } catch (error) {
      console.error('Error al cargar tareas:', error)
    }
  }

  const handleCancelWorkerForm = () => {
    setShowWorkerForm(false)
  }

  const handleResetGame = () => {
    setTasks([])
    setGameStarted(false)
    setCurrentStep(1)
    setShowCelebration(false)
    setShowWorkerForm(false)
    setCierreId(null)
    setWorkerName('')
    setStartTime(null)
    setElapsedTime(0)
  }

  const getTotalTime = () => {
    return tasks.reduce((total, task) => total + (task.duration || task.duracion || 0), 0)
  }

  const getTimeBreakdown = () => {
    if (tasks.length === 0) return { preCierre: 0, cierre: 0, total: 0 }
    
    // Tareas de pre-cierre (1-6): 20 minutos
    const preCierreTasks = tasks.slice(0, 6)
    const preCierreTime = preCierreTasks.reduce((total, task) => total + (task.duration || task.duracion || 0), 0)
    
    // Tareas de cierre (7-20): 30 minutos
    const cierreTasks = tasks.slice(6)
    const cierreTime = cierreTasks.reduce((total, task) => total + (task.duration || task.duracion || 0), 0)
    
    return {
      preCierre: preCierreTime,
      cierre: cierreTime,
      total: preCierreTime + cierreTime
    }
  }

  const getCompletedTime = () => {
    return tasks
      .filter(task => task.completed || task.completada)
      .reduce((total, task) => total + (task.duration || task.duracion || 0), 0)
  }

  const formatRealTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getRealTime = () => {
    if (isAllCompleted && startTime) {
      // Si está completado, calcular el tiempo final
      const finalTime = Math.floor((Date.now() - startTime) / 1000)
      return finalTime
    }
    return elapsedTime
  }

  // Pantalla de formulario de trabajador
  if (showWorkerForm) {
    return (
      <WorkerForm
        onStart={handleWorkerSubmit}
        onCancel={handleCancelWorkerForm}
      />
    )
  }

  // Pantalla de carga de tareas
  if (loadingTasks) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="text-center w-full max-w-md mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-white/20">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4 sm:mb-6"></div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
                Cargando Tareas
              </h2>
              <p className="text-white/70 text-base sm:text-lg">
                Preparando el proceso de cierre para {workerName}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Pantalla de inicio
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-3 sm:p-6 lg:p-8">
        {/* Header con usuario y logout */}
        {isAuthenticated() && (
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-3 border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-white text-sm font-medium">{user?.name}</p>
                  <p className="text-white/60 text-xs capitalize">{user?.role}</p>
                </div>
                <button
                  onClick={() => {
                    logout()
                    window.location.href = '/login'
                  }}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-1 rounded text-sm transition-colors"
                >
                  Salir
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="text-center w-full max-w-4xl mx-auto">
          {/* Logo y Header */}
          <div className="mb-6 sm:mb-8 lg:mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-white/10 backdrop-blur-sm rounded-full mb-4 sm:mb-6 lg:mb-8">
              <span className="text-3xl sm:text-4xl lg:text-6xl">🍦</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2 sm:mb-3 lg:mb-4">
              Evas Barcelona
            </h1>
            <h2 className="text-base sm:text-lg lg:text-xl xl:text-2xl text-white/80 mb-1 sm:mb-2">
              Sistema de Cierre de Tienda
            </h2>
            <p className="text-white/60 text-xs sm:text-sm lg:text-base xl:text-lg max-w-2xl mx-auto px-2 sm:px-4">
              Sigue el proceso paso a paso para cerrar la heladería de manera eficiente y profesional
            </p>
          </div>

          {/* Controles */}
          <div className="space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Solo mostrar botón de empezar cierre para trabajadores */}
            {user?.role === 'worker' && (
              <div className="space-y-3 sm:space-y-4">
                <button
                  onClick={handleStartGame}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 lg:px-12 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-2xl text-base sm:text-lg lg:text-xl"
                >
                  🚀 Empezar Cierre
                </button>
                
                <button
                  onClick={() => setShowPedidoHelados(true)}
                  className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 lg:px-12 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-2xl text-base sm:text-lg lg:text-xl"
                >
                  🍦 Hacer Pedido Helados
                </button>
              </div>
            )}
            
            {/* Botones de navegación */}
            {user?.role === 'worker' ? (
              // Los trabajadores solo tienen el botón de empezar cierre
              null
            ) : (
              // Botones para admin
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <a
                    href="/admin/dashboard"
                    className="bg-white/10 hover:bg-white/20 text-white font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-300 border border-white/20 text-xs sm:text-sm lg:text-base"
                  >
                    📊 Panel Admin
                  </a>
                  
                  <a
                    href="/trabajadores"
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-xs sm:text-sm lg:text-base"
                  >
                    👷 Trabajadores
                  </a>
                </div>
              </div>
            )}
      
            {/* Solo mostrar controles de temporizador para trabajadores */}
            {user?.role === 'worker' && (
              <div className="flex justify-center">
                <button
                  onClick={() => setShowTimer(!showTimer)}
                  className={`px-3 sm:px-4 lg:px-6 py-2 rounded-lg font-medium transition-all duration-300 text-xs sm:text-sm lg:text-base ${
                    showTimer 
                      ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                >
                  {showTimer ? '⏰ Desactivar Temporizador' : '⏰ Activar Temporizador'}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Modal de Pedido de Helados */}
        {showPedidoHelados && (
          <PedidoHelados onClose={() => setShowPedidoHelados(false)} />
        )}
      </div>
    )
  }

  // Pantalla de celebración
  if (showCelebration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-3 sm:p-6 lg:p-8">
        <div className="text-center w-full max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 xl:p-12 border border-white/20">
            <div className="text-5xl sm:text-6xl lg:text-8xl mb-3 sm:mb-4 lg:mb-6 animate-bounce">🎉</div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-2 sm:mb-3 lg:mb-4">
              ¡Cierre Finalizado!
            </h1>
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-white/80 mb-2 sm:mb-3 lg:mb-4 px-2 sm:px-4">
              Has completado exitosamente todas las tareas de cierre de Evas Barcelona
            </p>
            <p className="text-xs sm:text-sm lg:text-base xl:text-lg text-white/70 mb-4 sm:mb-6 lg:mb-8">
              Trabajador: <span className="font-bold text-white">{workerName}</span>
            </p>
      
                   <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 xl:p-8 mb-4 sm:mb-6 lg:mb-8">
                     <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-2 sm:mb-3 lg:mb-4">
                       ¡Excelente trabajo! 🏆
                     </h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 text-white/90">
                       <div className="text-center">
                         <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{totalTasks}</div>
                         <div className="text-xs sm:text-sm">Tareas completadas</div>
                       </div>
                       <div className="text-center">
                         <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{formatRealTime(getRealTime())}</div>
                         <div className="text-xs sm:text-sm">Tiempo real</div>
                       </div>
                     </div>
                   </div>

            <div className="flex justify-center">
              <button
                onClick={handleResetGame}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
              >
                🔄 Nuevo Cierre
              </button>
            </div>
          </div>
          
          {/* Modal de Pedido de Helados */}
          {showPedidoHelados && (
            <PedidoHelados onClose={() => setShowPedidoHelados(false)} />
          )}
        </div>
      </div>
    )
  }

         // Pantalla de tarea secuencial
         if (!currentTask) {
           return (
             <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
               <div className="text-center">
                 <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                 <p className="text-white/70">Cargando tarea...</p>
               </div>
             </div>
           )
         }

         return (
           <>
             <SequentialTask
               task={{...currentTask, cierreId}}
               currentStep={currentStep}
               totalSteps={totalTasks}
               onComplete={handleTaskComplete}
               onNext={handleNext}
               showTimer={showTimer}
               cierreId={cierreId}
               trabajador={workerName}
             />
             
             {/* Modal de Pedido de Helados */}
             {showPedidoHelados && (
               <PedidoHelados onClose={() => setShowPedidoHelados(false)} />
             )}
           </>
         )
}
