'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import SequentialTask from '../components/SequentialTask'
import WorkerForm from '../components/WorkerForm'
import WorkerFormApertura from '../components/WorkerFormApertura'
import PedidoHelados from '../components/PedidoHelados'
import CambioTurno from '../components/CambioTurno'
import StockWorker from '../components/StockWorker'
import TemperaturaVitrina from '../components/TemperaturaVitrina'
import ResenaWorker from '../components/ResenaWorker'
import ControlTartas from '../components/ControlTartas'
import ControlMasas from '../components/ControlMasas'
import ListaCompras from '../components/ListaCompras'
import PendingClosureModal from '../components/PendingClosureModal'
import PendingOpeningModal from '../components/PendingOpeningModal'
import BottomNav from '../components/worker/BottomNav'
import MoreMenuSheet from '../components/worker/MoreMenuSheet'
import MisTareas from '../components/worker/MisTareas'
import WorkerDashboardWidgetsLight from '../components/worker/DashboardWidgetsLight'
import AlarmaNotification from '../components/AlarmaNotification'


export default function Home() {
  const { user, logout, isAuthenticated, loading } = useAuth()
  const [tasks, setTasks] = useState([])
  const [currentStep, setCurrentStep] = useState(1)
  const [showTimer, setShowTimer] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [modoActivo, setModoActivo] = useState('cierre') // 'cierre' | 'apertura'
  const [showWorkerForm, setShowWorkerForm] = useState(false)
  const [showAperturaForm, setShowAperturaForm] = useState(false)
  const [showPedidoHelados, setShowPedidoHelados] = useState(false)
  const [showCambioTurno, setShowCambioTurno] = useState(false)
  const [showStockWorker, setShowStockWorker] = useState(false)
  const [showTemperaturaVitrina, setShowTemperaturaVitrina] = useState(false)
  const [showResenaWorker, setShowResenaWorker] = useState(false)
  const [showControlTartas, setShowControlTartas] = useState(false)
  const [showControlMasas, setShowControlMasas] = useState(false)
  const [showListaCompras, setShowListaCompras] = useState(false)
  const [currentView, setCurrentView] = useState('home')
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [cierreId, setCierreId] = useState(null)
  const [workerName, setWorkerName] = useState('')
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [hasCheckedPending, setHasCheckedPending] = useState(false)
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [pendingCierreData, setPendingCierreData] = useState(null)
  // 🌅 Apertura state
  const [hasCheckedPendingApertura, setHasCheckedPendingApertura] = useState(false)
  const [showPendingAperturaModal, setShowPendingAperturaModal] = useState(false)
  const [pendingAperturaData, setPendingAperturaData] = useState(null)
  const [showMisTareas, setShowMisTareas] = useState(false)
  const [tareasCount, setTareasCount] = useState(0)

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

  // Verificar cierres pendientes al cargar (solo para workers)
  useEffect(() => {
    if (!loading && isAuthenticated() && user?.role === 'worker' && !hasCheckedPending) {
      setHasCheckedPending(true)
      checkForPendingCierre()
    }
  }, [loading, isAuthenticated, user?.role, hasCheckedPending])

  // 🌅 Verificar aperturas pendientes al cargar (solo para workers)
  useEffect(() => {
    if (!loading && isAuthenticated() && user?.role === 'worker' && !hasCheckedPendingApertura) {
      setHasCheckedPendingApertura(true)
      checkForPendingApertura()
    }
  }, [loading, isAuthenticated, user?.role, hasCheckedPendingApertura])

  // Fetch tareas asignadas pendientes (badge count)
  useEffect(() => {
    if (!loading && isAuthenticated() && user?.role === 'worker' && user?.id) {
      fetch(`/api/tareas-asignadas?trabajadorId=${user.id}&estado=pendiente`)
        .then(r => r.ok ? r.json() : [])
        .then(data => setTareasCount(Array.isArray(data) ? data.length : 0))
        .catch(() => {})
    }
  }, [loading, isAuthenticated, user?.role, user?.id])

  // ⭐ NUEVO: Función para verificar cierres pendientes
  async function checkForPendingCierre() {
    try {
      console.log('🔍 Verificando cierres pendientes...')
      const response = await fetch(`/api/cierre/pendiente?trabajador=${encodeURIComponent(user.name)}`)

      if (response.ok) {
        const { cierre } = await response.json()

        if (cierre) {
          const tareasCompletadas = cierre.tareas.filter(t => t.completada).length
          const totalTareas = cierre.tareas.length
          const progreso = Math.round((tareasCompletadas / totalTareas) * 100)

          const fechaInicio = new Date(cierre.fechaInicio)

          // ⭐ NUEVO: Preparar datos para el modal
          setPendingCierreData({
            cierre: cierre,
            turno: cierre.turno,
            fechaInicio: cierre.fechaInicio,
            tareasCompletadas,
            totalTareas,
            progreso
          })

          // ⭐ NUEVO: Mostrar modal en lugar de confirm
          setShowPendingModal(true)

          console.log(`✅ Cierre pendiente encontrado: ${cierre.id} (${tareasCompletadas}/${totalTareas} tareas)`)
        } else {
          console.log('ℹ️ No hay cierres pendientes')
        }
      }
    } catch (error) {
      console.error('❌ Error al verificar cierres pendientes:', error)
    }
  }

  // Función para continuar cierre pendiente — hace fresh fetch para datos actualizados
  async function handleContinuePendingCierre() {
    if (!pendingCierreData) return

    const cierreIdToResume = pendingCierreData.cierre.id
    setShowPendingModal(false)
    setPendingCierreData(null)
    setLoadingTasks(true)
    setModoActivo('cierre')

    try {
      const res = await fetch(`/api/cierre/${cierreIdToResume}`)
      if (!res.ok) throw new Error('No se pudo cargar el cierre')
      const { cierre } = await res.json()

      const firstPendingIndex = cierre.tareas.findIndex(t => !t.completada)

      setCierreId(cierre.id)
      setWorkerName(cierre.trabajador)
      setTasks(cierre.tareas)
      setCurrentStep(firstPendingIndex !== -1 ? firstPendingIndex + 1 : 1)
      setStartTime(new Date(cierre.fechaInicio).getTime())
      setLoadingTasks(false)
      setGameStarted(true)

      console.log(`✅ Cierre reanudado: paso ${firstPendingIndex + 1}/${cierre.tareas.length}`)
    } catch (err) {
      console.error('❌ Error al reanudar cierre:', err)
      setLoadingTasks(false)
    }
  }

  function handleNewCierre() {
    if (pendingCierreData?.cierre?.id) {
      fetch(`/api/cierre/${pendingCierreData.cierre.id}`, { method: 'DELETE' })
        .catch(err => console.error('Error al eliminar cierre abandonado:', err))
    }
    setShowPendingModal(false)
    setPendingCierreData(null)
    setModoActivo('cierre')
    setShowWorkerForm(true)
  }

  function handleCloseModal() {
    setShowPendingModal(false)
    setPendingCierreData(null)
  }

  // 🌅 Apertura: verificar pendiente
  async function checkForPendingApertura() {
    try {
      console.log('🌅 Verificando aperturas pendientes...')
      const response = await fetch(`/api/apertura/pendiente?trabajador=${encodeURIComponent(user.name)}`)
      if (response.ok) {
        const { cierre } = await response.json()
        if (cierre) {
          const tareasCompletadas = cierre.tareas.filter(t => t.completada).length
          const totalTareas = cierre.tareas.length
          const progreso = Math.round((tareasCompletadas / totalTareas) * 100)
          setPendingAperturaData({
            cierre,
            turno: cierre.turno,
            fechaInicio: cierre.fechaInicio,
            tareasCompletadas,
            totalTareas,
            progreso
          })
          setShowPendingAperturaModal(true)
          console.log(`✅ Apertura pendiente: ${cierre.id} (${tareasCompletadas}/${totalTareas})`)
        }
      }
    } catch (error) {
      console.error('❌ Error al verificar aperturas pendientes:', error)
    }
  }

  // 🌅 Continuar apertura pendiente
  async function handleContinuePendingApertura() {
    if (!pendingAperturaData) return
    const aperturaIdToResume = pendingAperturaData.cierre.id
    setShowPendingAperturaModal(false)
    setPendingAperturaData(null)
    setLoadingTasks(true)
    setModoActivo('apertura')

    try {
      const res = await fetch(`/api/apertura/${aperturaIdToResume}`)
      if (!res.ok) throw new Error('No se pudo cargar la apertura')
      const { cierre } = await res.json()
      const firstPendingIndex = cierre.tareas.findIndex(t => !t.completada)
      setCierreId(cierre.id)
      setWorkerName(cierre.trabajador)
      setTasks(cierre.tareas)
      setCurrentStep(firstPendingIndex !== -1 ? firstPendingIndex + 1 : 1)
      setStartTime(new Date(cierre.fechaInicio).getTime())
      setLoadingTasks(false)
      setGameStarted(true)
    } catch (err) {
      console.error('❌ Error al reanudar apertura:', err)
      setLoadingTasks(false)
    }
  }

  function handleNewApertura() {
    if (pendingAperturaData?.cierre?.id) {
      fetch(`/api/apertura/${pendingAperturaData.cierre.id}`, { method: 'DELETE' })
        .catch(err => console.error('Error al eliminar apertura abandonada:', err))
    }
    setShowPendingAperturaModal(false)
    setPendingAperturaData(null)
    setModoActivo('apertura')
    setShowAperturaForm(true)
  }

  useEffect(() => {
    if (isAllCompleted && gameStarted && cierreId) {
      // Marcar como completado en BD usando la API correcta
      const apiUrl = modoActivo === 'apertura' ? `/api/apertura/${cierreId}` : `/api/cierre/${cierreId}`
      fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completado: true, fechaFin: new Date() })
      }).catch(err => console.error('Error auto-completando:', err))
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


  const handleNext = async () => {
    if (currentStep < totalTasks) {
      setTimeout(() => {
        setCurrentStep(currentStep + 1)
      }, 100)
    } else {
      // Marcar como completado usando la API correcta
      try {
        const apiUrl = modoActivo === 'apertura' ? `/api/apertura/${cierreId}` : `/api/cierre/${cierreId}`
        const label = modoActivo === 'apertura' ? 'apertura' : 'cierre'
        console.log(`📝 Marcando ${label} como completado...`)
        await fetch(apiUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            completado: true,
            fechaFin: new Date()
          })
        })
        console.log(`✅ ${label} marcado como completado`)
      } catch (error) {
        console.error('❌ Error al marcar como completado:', error)
      }

      setShowCelebration(true)
    }
  }


  const handleStartGame = () => {
    if (pendingCierreData) {
      setShowPendingModal(true)
    } else {
      setModoActivo('cierre')
      setShowWorkerForm(true)
    }
  }

  const handleStartApertura = () => {
    if (pendingAperturaData) {
      setShowPendingAperturaModal(true)
    } else {
      setModoActivo('apertura')
      setShowAperturaForm(true)
    }
  }

  const handleWorkerSubmit = async (newCierreId, newWorkerName, turno) => {
    setCierreId(newCierreId)
    setWorkerName(newWorkerName)
    setShowWorkerForm(false)
    setModoActivo('cierre')
    setCurrentStep(1)
    setShowCelebration(false)
    setLoadingTasks(true)
    setElapsedTime(0)

    await loadTasksFromDatabase(newCierreId)
    setLoadingTasks(false)
    setGameStarted(true)
    setStartTime(Date.now())
  }

  const handleAperturaSubmit = async (newAperturaId, newWorkerName, turno) => {
    setCierreId(newAperturaId)
    setWorkerName(newWorkerName)
    setShowAperturaForm(false)
    setModoActivo('apertura')
    setCurrentStep(1)
    setShowCelebration(false)
    setLoadingTasks(true)
    setElapsedTime(0)

    // Cargar las tareas de apertura desde la BD
    try {
      const response = await fetch(`${window.location.origin}/api/apertura/${newAperturaId}`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data.cierre.tareas)
      }
    } catch (error) {
      console.error('Error al cargar tareas de apertura:', error)
    }

    setLoadingTasks(false)
    setGameStarted(true)
    setStartTime(Date.now())
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
    setShowAperturaForm(false)
    setCierreId(null)
    setWorkerName('')
    setStartTime(null)
    setElapsedTime(0)
    setModoActivo('cierre')
    setCurrentView('home')
  }

  const handleNavigate = (view) => {
    setCurrentView(view)

    switch (view) {
      case 'home':
        // Ya estamos en home, no hacer nada
        break
      case 'cierre':
        handleStartGame()
        break
      case 'pedido':
        setShowPedidoHelados(true)
        break
      case 'stock':
        setShowStockWorker(true)
        break
      case 'more':
        setShowMoreMenu(true)
        break
      case 'cambio-turno':
        setShowCambioTurno(true)
        break
      case 'temperatura':
        setShowTemperaturaVitrina(true)
        break
      case 'resenas':
        setShowResenaWorker(true)
        break
      case 'tartas':
        setShowControlTartas(true)
        break
      case 'masas':
        setShowControlMasas(true)
        break
      case 'lista-compras':
        setShowListaCompras(true)
        break
    }
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

  // Pantalla de formulario de trabajador (cierre)
  if (showWorkerForm) {
    return (
      <WorkerForm
        onStart={handleWorkerSubmit}
        onCancel={handleCancelWorkerForm}
      />
    )
  }

  // 🌅 Pantalla de formulario de apertura
  if (showAperturaForm) {
    return (
      <WorkerFormApertura
        onStart={handleAperturaSubmit}
        onCancel={() => setShowAperturaForm(false)}
      />
    )
  }

  // Pantalla de carga de tareas
  if (loadingTasks) {
    const isAperturaLoading = modoActivo === 'apertura'
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 ${isAperturaLoading ? 'bg-gradient-to-br from-amber-900 via-orange-800 to-yellow-900' : 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'}`}>
        <div className="text-center w-full max-w-md mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-white/20">
            <div className="text-center">
              <div className="text-5xl mb-4 animate-pulse">{isAperturaLoading ? '🌅' : '🚀'}</div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4 sm:mb-6"></div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
                {isAperturaLoading ? 'Cargando Apertura' : 'Cargando Tareas'}
              </h2>
              <p className="text-white/70 text-base sm:text-lg">
                {isAperturaLoading
                  ? `Preparando el proceso de apertura para ${workerName}`
                  : `Preparando el proceso de cierre para ${workerName}`
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Modal de cierre pendiente
  if (showPendingModal && pendingCierreData) {
    return (
      <PendingClosureModal
        isOpen={true}
        onClose={handleCloseModal}
        onContinue={handleContinuePendingCierre}
        onNewClosure={handleNewCierre}
        cierreData={pendingCierreData}
      />
    )
  }

  // 🌅 Modal de apertura pendiente
  if (showPendingAperturaModal && pendingAperturaData) {
    return (
      <PendingOpeningModal
        isOpen={true}
        onClose={() => { setShowPendingAperturaModal(false); setPendingAperturaData(null) }}
        onContinue={handleContinuePendingApertura}
        onNewOpening={handleNewApertura}
        aperturaData={pendingAperturaData}
      />
    )
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex flex-col">
        {/* Header Moderno */}
        <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🍦</div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Evas Barcelona</h1>
                <p className="text-xs text-gray-500">Sistema de Gestión</p>
              </div>
            </div>

            {isAuthenticated() && (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <button
                  onClick={async () => {
                    await logout()
                  }}
                  className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-red-200"
                >
                  Salir
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

            {/* Hero Greeting */}
            <div className="bg-gradient-to-br from-pink-400 via-rose-400 to-orange-400 rounded-3xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="text-5xl">🍦</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-1">
                    ¡Hola {user?.name}!
                  </h2>
                  <p className="text-white/90 text-sm">
                    {new Date().toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })} • {new Date().toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Panel de control para trabajadores */}
            {user?.role === 'worker' && (
              <div className="space-y-6">
                {/* Dashboard Widgets */}
                <WorkerDashboardWidgetsLight userId={user?.id} />

                {/* ⭐ NUEVO: Badge de cierre pendiente */}
                {pendingCierreData && (
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 text-2xl">⚠️</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-yellow-900 text-sm mb-1">
                          Tienes un cierre pendiente
                        </h4>
                        <p className="text-yellow-800 text-xs mb-2">
                          Cierre de <span className="font-semibold">{pendingCierreData.turno.toUpperCase()}</span> • {pendingCierreData.tareasCompletadas}/{pendingCierreData.totalTareas} tareas ({pendingCierreData.progreso}%)
                        </p>
                        <button
                          onClick={() => setShowPendingModal(true)}
                          className="text-xs font-semibold text-yellow-700 underline underline-offset-2"
                        >
                          → Reanudar cierre pendiente
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 🌅 Badge apertura pendiente */}
                {pendingAperturaData && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 text-2xl">🌅</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-amber-900 text-sm mb-1">
                          Tienes una apertura pendiente
                        </h4>
                        <p className="text-amber-800 text-xs mb-2">
                          Apertura de <span className="font-semibold">{pendingAperturaData.turno?.toUpperCase()}</span> • {pendingAperturaData.tareasCompletadas}/{pendingAperturaData.totalTareas} pasos ({pendingAperturaData.progreso}%)
                        </p>
                        <button
                          onClick={() => setShowPendingAperturaModal(true)}
                          className="text-xs font-semibold text-amber-700 underline underline-offset-2"
                        >
                          → Reanudar apertura pendiente
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 📋 Badge tareas asignadas */}
                {tareasCount > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 text-2xl">📋</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-blue-900 text-sm mb-1">
                          {tareasCount === 1 ? '1 tarea pendiente' : `${tareasCount} tareas pendientes`}
                        </h4>
                        <p className="text-blue-700 text-xs mb-2">El administrador te ha asignado tareas operativas.</p>
                        <button
                          onClick={() => setShowMisTareas(true)}
                          className="text-xs font-semibold text-blue-700 underline underline-offset-2"
                        >
                          → Ver mis tareas
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Acciones Principales */}
                <div>
                  <h3 className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-3 px-1">
                    🚀 Acciones del Turno
                  </h3>
                  <div className="flex flex-col gap-3">
                    {/* 🌅 Apertura */}
                    <button
                      onClick={handleStartApertura}
                      className="w-full bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500 hover:from-amber-500 hover:via-orange-500 hover:to-yellow-600 text-white rounded-3xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-4xl">🌅</div>
                          <div className="text-left">
                            <div className="text-lg font-bold">Iniciar Apertura</div>
                            <div className="text-xs text-white/80">Checklist de apertura de tienda</div>
                          </div>
                        </div>
                        <div className="text-white/60 text-3xl">→</div>
                      </div>
                    </button>

                    {/* 🚀 Cierre */}
                    <button
                      onClick={handleStartGame}
                      className="w-full bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 hover:from-purple-600 hover:via-pink-600 hover:to-rose-600 text-white rounded-3xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-4xl animate-pulse">🚀</div>
                          <div className="text-left">
                            <div className="text-lg font-bold">Iniciar Cierre</div>
                            <div className="text-xs text-white/80">Proceso completo de turno</div>
                          </div>
                        </div>
                        <div className="text-white/60 text-3xl">→</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Accesos Rápidos */}
                <div>
                  <h3 className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-3 px-1">
                    🎯 Accesos Rápidos
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowTemperaturaVitrina(true)}
                      className="bg-gradient-to-br from-cyan-100 to-blue-100 hover:from-cyan-200 hover:to-blue-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all active:scale-95 border border-cyan-200"
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-2">🌡️</div>
                        <div className="text-sm font-semibold text-gray-800">Temperatura</div>
                        <div className="text-xs text-gray-600">Vitrina</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setShowStockWorker(true)}
                      className="bg-gradient-to-br from-purple-100 to-indigo-100 hover:from-purple-200 hover:to-indigo-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all active:scale-95 border border-purple-200"
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-2">📦</div>
                        <div className="text-sm font-semibold text-gray-800">Stock</div>
                        <div className="text-xs text-gray-600">Inventario</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Link a más opciones */}
                <button
                  onClick={() => setShowMoreMenu(true)}
                  className="w-full text-center py-3 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
                >
                  Ver todas las opciones →
                </button>
              </div>
            )}

            {/* Botones para admin */}
            {user?.role !== 'worker' && (
              <div className="space-y-3">
                <a
                  href="/admin/dashboard"
                  className="block w-full bg-white hover:bg-gray-50 text-gray-800 font-medium py-3 px-6 rounded-2xl transition-all border border-gray-200 text-center shadow-sm"
                >
                  📊 Panel Admin
                </a>
                <a
                  href="/trabajadores"
                  className="block w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg text-center"
                >
                  👷 Trabajadores
                </a>
              </div>
            )}
          </div>
        </main>

        {/* Modal de Pedido de Helados */}
        {showPedidoHelados && (
          <PedidoHelados onClose={() => setShowPedidoHelados(false)} />
        )}

        {/* Modal de Cambio de Turno */}
        {showCambioTurno && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Cambio de Turno</h2>
                <button
                  onClick={() => setShowCambioTurno(false)}
                  className="text-white/60 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              <CambioTurno trabajadorActual={user?.name} />
            </div>
          </div>
        )}

        {/* Modal de Stocks */}
        {showStockWorker && (
          <StockWorker
            onClose={() => setShowStockWorker(false)}
            trabajadorId={user?.id}
          />
        )}

        {/* Modal de Temperatura Vitrina */}
        {showTemperaturaVitrina && (
          <TemperaturaVitrina onClose={() => setShowTemperaturaVitrina(false)} />
        )}

        {/* Modal de Reseñas */}
        {showResenaWorker && (
          <ResenaWorker onClose={() => setShowResenaWorker(false)} />
        )}

        {/* Modal de Control de Tartas */}
        {showControlTartas && (
          <ControlTartas onClose={() => setShowControlTartas(false)} />
        )}

        {/* Modal de Control de Masas */}
        {showControlMasas && (
          <ControlMasas onClose={() => setShowControlMasas(false)} />
        )}

        {/* Modal de Lista de Compras */}
        {showListaCompras && (
          <ListaCompras onClose={() => setShowListaCompras(false)} />
        )}

        {/* Bottom Navigation - Solo móvil */}
        {user?.role === 'worker' && (
          <BottomNav onNavigate={handleNavigate} currentView={currentView} />
        )}

        {/* More Menu Sheet */}
        {showMoreMenu && (
          <MoreMenuSheet
            onClose={() => setShowMoreMenu(false)}
            onNavigate={handleNavigate}
          />
        )}

        {/* Mis Tareas sheet */}
        {showMisTareas && (
          <MisTareas
            trabajadorId={user?.id}
            onClose={() => {
              setShowMisTareas(false)
              // Refrescar el contador al cerrar
              fetch(`/api/tareas-asignadas?trabajadorId=${user?.id}&estado=pendiente`)
                .then(r => r.ok ? r.json() : [])
                .then(data => setTareasCount(Array.isArray(data) ? data.length : 0))
                .catch(() => {})
            }}
          />
        )}

        {/* 🔔 Alarmas programadas — siempre activo para workers */}
        {user?.role === 'worker' && (
          <AlarmaNotification
            trabajadorNombre={user?.name}
            trabajadorId={user?.id}
          />
        )}
      </div>
    )
  }

  // Pantalla de celebración
  if (showCelebration) {
    const isApertura = modoActivo === 'apertura'
    return (
      <div className={`min-h-screen flex items-center justify-center p-3 sm:p-6 lg:p-8 ${isApertura ? 'bg-gradient-to-br from-amber-900 via-orange-800 to-yellow-900' : 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'}`}>
        <div className="text-center w-full max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 xl:p-12 border border-white/20">
            <div className="text-5xl sm:text-6xl lg:text-8xl mb-3 sm:mb-4 lg:mb-6 animate-bounce">
              {isApertura ? '🌅' : '🎉'}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-2 sm:mb-3 lg:mb-4">
              {isApertura ? '¡Apertura Completada!' : '¡Cierre Finalizado!'}
            </h1>
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-white/80 mb-2 sm:mb-3 lg:mb-4 px-2 sm:px-4">
              {isApertura
                ? 'Has completado todos los pasos de apertura de Evas Barcelona ☀️'
                : 'Has completado exitosamente todas las tareas de cierre de Evas Barcelona'
              }
            </p>
            <p className="text-xs sm:text-sm lg:text-base xl:text-lg text-white/70 mb-4 sm:mb-6 lg:mb-8">
              Trabajador: <span className="font-bold text-white">{workerName}</span>
            </p>

            <div className={`border rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 xl:p-8 mb-4 sm:mb-6 lg:mb-8 ${isApertura ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400/30' : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/30'}`}>
              <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-2 sm:mb-3 lg:mb-4">
                {isApertura ? '¡La tienda está lista! ☀️' : '¡Excelente trabajo! 🏆'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 text-white/90">
                <div className="text-center">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{totalTasks}</div>
                  <div className="text-xs sm:text-sm">{isApertura ? 'Pasos completados' : 'Tareas completadas'}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{formatRealTime(getRealTime())}</div>
                  <div className="text-xs sm:text-sm">Tiempo real</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:gap-4">
              <button
                onClick={logout}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
              >
                🚪 Cerrar sesión
              </button>
              <button
                onClick={handleResetGame}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
              >
                🏠 Ir al Menu Principal
              </button>
            </div>
          </div>

          {/* Modal de Pedido de Helados */}
          {showPedidoHelados && (
            <PedidoHelados onClose={() => setShowPedidoHelados(false)} />
          )}

          {/* Modal de Cambio de Turno */}
          {showCambioTurno && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white">Cambio de Turno</h2>
                  <button
                    onClick={() => setShowCambioTurno(false)}
                    className="text-white/60 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>
                <CambioTurno trabajadorActual={user?.name} />
              </div>
            </div>
          )}

          {/* Modal de Stocks */}
          {showStockWorker && (
            <StockWorker
              onClose={() => setShowStockWorker(false)}
              trabajadorId={user?.id}
            />
          )}

          {/* Modal de Temperatura Vitrina */}
          {showTemperaturaVitrina && (
            <TemperaturaVitrina onClose={() => setShowTemperaturaVitrina(false)} />
          )}

          {/* Modal de cierre pendiente — en el home state (ver !gameStarted block) */}
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
        task={{ ...currentTask, cierreId }}
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

      {/* Modal de Fichaje (also here for safety if accessible during tasks, usually not but keeps consistency) */}

      {/* Modal de Cambio de Turno - Rendered here to ensure it's available even during tasks if needed */}
      {showCambioTurno && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Cambio de Turno</h2>
              <button
                onClick={() => setShowCambioTurno(false)}
                className="text-white/60 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <CambioTurno trabajadorActual={user?.name} />
          </div>
        </div>
      )}

      {/* Modal de Stocks */}
      {showStockWorker && (
        <StockWorker
          onClose={() => setShowStockWorker(false)}
          trabajadorId={user?.id}
        />
      )}

      {/* Modal de Temperatura Vitrina */}
      {showTemperaturaVitrina && (
        <TemperaturaVitrina onClose={() => setShowTemperaturaVitrina(false)} />
      )}

      {/* PendingClosureModal está en el home state, no aquí */}
    </>
  )
}