'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../../components/AdminLayout'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Bell, Plus, Clock, ChevronRight, Check, X, Trash2, Pencil } from 'lucide-react'

// ─── Config maps ─────────────────────────────────────────────────────────
const COLOR_DOT = { rojo: 'bg-red-500', naranja: 'bg-orange-500', azul: 'bg-blue-500', verde: 'bg-green-500' }
const COLOR_LABEL = { rojo: 'Rojo', naranja: 'Naranja', azul: 'Azul', verde: 'Verde' }
const SONIDO_LABEL = { beep: '🎵 Beep', campana: '🔔 Campana', alerta: '🚨 Alerta' }

// ─── iOS-style action sheet ───────────────────────────────────────────────
function ActionSheet({ alarma, onEdit, onToggle, onDelete, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative px-4 pb-4 space-y-2" onClick={e => e.stopPropagation()}>
        {/* Main actions */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200/80">
            <p className="text-center text-sm font-semibold text-gray-900 truncate">{alarma.titulo}</p>
            <p className="text-center text-xs text-gray-500 mt-0.5">{alarma.hora} · {alarma.recurrencia === 'diaria' ? 'Diaria' : 'Una vez'}</p>
          </div>
          <button onClick={() => { onEdit(); onClose() }}
            className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-200/80 active:bg-gray-100 transition-colors">
            <span className="text-base text-gray-900">Editar alarma</span>
            <Pencil className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={() => { onToggle(); onClose() }}
            className="w-full flex items-center justify-between px-4 py-4 active:bg-gray-100 transition-colors">
            <span className="text-base text-gray-900">{alarma.activa ? 'Desactivar' : 'Activar'}</span>
            <span className="text-sm text-gray-400">{alarma.activa ? '⏸' : '▶️'}</span>
          </button>
        </div>
        {/* Destructive */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden">
          <button onClick={() => { onDelete(); onClose() }}
            className="w-full flex items-center justify-center px-4 py-4 active:bg-red-50 transition-colors">
            <span className="text-base font-semibold text-red-500 flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Eliminar alarma
            </span>
          </button>
        </div>
        {/* Cancel */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden">
          <button onClick={onClose}
            className="w-full px-4 py-4 text-base font-bold text-blue-500 active:bg-gray-100 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete confirmation sheet ────────────────────────────────────────────
function DeleteSheet({ alarma, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative px-4 pb-4 space-y-2" onClick={e => e.stopPropagation()}>
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden">
          <div className="px-4 pt-5 pb-3 text-center border-b border-gray-200/80">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-base font-bold text-gray-900">Eliminar alarma</p>
            <p className="text-sm text-gray-500 mt-1">"{alarma.titulo}" se eliminará permanentemente.</p>
          </div>
          <button onClick={onConfirm}
            className="w-full px-4 py-4 text-base font-semibold text-red-500 active:bg-red-50 transition-colors">
            Eliminar
          </button>
        </div>
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden">
          <button onClick={onCancel}
            className="w-full px-4 py-4 text-base font-bold text-blue-500 active:bg-gray-100 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Form bottom sheet ─────────────────────────────────────────────────────
function FormSheet({ alarma, onSave, onCancel }) {
  const [form, setForm] = useState({
    titulo:      alarma?.titulo      || '',
    descripcion: alarma?.descripcion || '',
    hora:        alarma?.hora        || '09:00',
    recurrencia: alarma?.recurrencia || 'diaria',
    fechaUnica:  alarma?.fechaUnica ? new Date(alarma.fechaUnica).toISOString().split('T')[0] : '',
    sonido:      alarma?.sonido      || 'beep',
    color:       alarma?.color       || 'naranja',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    setError('')
    if (!form.titulo.trim()) return setError('El título es obligatorio')
    if (form.recurrencia === 'unica' && !form.fechaUnica) return setError('Selecciona la fecha')
    setSaving(true)
    try {
      const url    = alarma ? `/api/alarmas/${alarma.id}` : '/api/alarmas'
      const method = alarma ? 'PUT' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, creadaPor: 'Admin', fechaUnica: form.recurrencia === 'unica' ? form.fechaUnica : null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      onSave()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm">
      <div className="bg-gray-100 rounded-t-3xl overflow-hidden max-h-[94vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-gray-400/40" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 flex-shrink-0">
          <button onClick={onCancel} className="text-blue-500 text-base font-medium py-2 pr-4">Cancelar</button>
          <h2 className="text-base font-bold text-gray-900">{alarma ? 'Editar alarma' : 'Nueva alarma'}</h2>
          <button onClick={save} disabled={saving}
            className="text-blue-500 text-base font-bold py-2 pl-4 disabled:opacity-40">
            {saving ? '...' : 'Guardar'}
          </button>
        </div>

        {/* Scrollable form */}
        <div className="overflow-y-auto flex-1 px-4 pb-8 space-y-5">

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          {/* Título + Descripción */}
          <div className="bg-white rounded-2xl overflow-hidden">
            <div className="px-4">
              <input type="text" value={form.titulo} onChange={e => set('titulo', e.target.value)}
                placeholder="Título *"
                className="w-full py-3.5 text-base text-gray-900 placeholder-gray-400 outline-none border-b border-gray-100" />
              <input type="text" value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
                placeholder="Descripción (opcional)"
                className="w-full py-3.5 text-base text-gray-900 placeholder-gray-400 outline-none" />
            </div>
          </div>

          {/* Hora */}
          <div className="bg-white rounded-2xl px-4">
            <div className="flex items-center justify-between py-3.5">
              <span className="text-base text-gray-900">Hora</span>
              <input type="time" value={form.hora} onChange={e => set('hora', e.target.value)}
                className="text-base font-semibold text-blue-500 outline-none bg-transparent" />
            </div>
          </div>

          {/* Recurrencia */}
          <div className="bg-white rounded-2xl overflow-hidden">
            <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recurrencia</p>
            {[{ val: 'diaria', label: '📅  Diaria' }, { val: 'unica', label: '📆  Una sola vez' }].map((opt, i) => (
              <button key={opt.val} onClick={() => set('recurrencia', opt.val)}
                className={`w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-50 ${i === 0 ? 'border-b border-gray-100' : ''}`}>
                <span className="text-base text-gray-900">{opt.label}</span>
                {form.recurrencia === opt.val && <Check className="w-5 h-5 text-blue-500" />}
              </button>
            ))}
            {form.recurrencia === 'unica' && (
              <div className="px-4 pb-3 border-t border-gray-100 pt-2">
                <input type="date" value={form.fechaUnica} onChange={e => set('fechaUnica', e.target.value)}
                  className="w-full py-2 text-base text-gray-900 outline-none bg-transparent" />
              </div>
            )}
          </div>

          {/* Sonido */}
          <div className="bg-white rounded-2xl overflow-hidden">
            <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sonido</p>
            {Object.entries(SONIDO_LABEL).map(([k, v], i, arr) => (
              <button key={k} onClick={() => set('sonido', k)}
                className={`w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-50 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <span className="text-base text-gray-900">{v}</span>
                {form.sonido === k && <Check className="w-5 h-5 text-blue-500" />}
              </button>
            ))}
          </div>

          {/* Color */}
          <div className="bg-white rounded-2xl overflow-hidden">
            <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Color de alerta</p>
            {Object.entries(COLOR_DOT).map(([k, dotClass], i, arr) => (
              <button key={k} onClick={() => set('color', k)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className={`w-4 h-4 rounded-full flex-shrink-0 ${dotClass}`} />
                <span className="text-base text-gray-900 flex-1 text-left">{COLOR_LABEL[k]}</span>
                {form.color === k && <Check className="w-5 h-5 text-blue-500" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Alarm row (iOS list cell) ─────────────────────────────────────────────
function AlarmaRow({ alarma, onPress, isLast }) {
  const dotClass = COLOR_DOT[alarma.color] || 'bg-orange-500'
  return (
    <button onClick={onPress}
      className={`w-full flex items-center gap-3 px-4 py-3.5 bg-white active:bg-gray-100 transition-colors text-left ${!isLast ? 'border-b border-gray-100' : ''}`}>
      {/* Dot indicator */}
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotClass} ${alarma.activa ? 'opacity-100' : 'opacity-30'}`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-base font-medium leading-tight truncate ${alarma.activa ? 'text-gray-900' : 'text-gray-400'}`}>
          {alarma.titulo}
        </p>
        <p className="text-sm text-gray-400 mt-0.5 truncate">
          {alarma.hora} · {alarma.recurrencia === 'diaria' ? 'Todos los días' : 'Una vez'} · {SONIDO_LABEL[alarma.sonido]}
        </p>
      </div>

      {/* Time badge */}
      <span className={`text-xl font-semibold font-mono flex-shrink-0 ${alarma.activa ? 'text-gray-700' : 'text-gray-300'}`}>
        {alarma.hora}
      </span>
      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
    </button>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function AlarmasPage() {
  const [alarmas,      setAlarmas]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showForm,     setShowForm]     = useState(false)
  const [editingAlarma, setEditingAlarma] = useState(null)
  const [actionAlarma,  setActionAlarma]  = useState(null) // for action sheet
  const [deleteAlarma,  setDeleteAlarma]  = useState(null) // for delete confirm

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/alarmas')
      const data = await res.json()
      setAlarmas(data.alarmas || [])
    } catch (_) {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const doToggle = async (a) => {
    await fetch(`/api/alarmas/${a.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activa: !a.activa }),
    })
    load()
  }

  const doDelete = async (a) => {
    setDeleteAlarma(null)
    await fetch(`/api/alarmas/${a.id}`, { method: 'DELETE' })
    load()
  }

  const handleSave = () => { setShowForm(false); setEditingAlarma(null); load() }

  const activeList   = alarmas.filter(a => a.activa)
  const inactiveList = alarmas.filter(a => !a.activa)

  return (
    <AdminLayout>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
      {/* iOS light background */}
      <div className="min-h-screen bg-gray-100">

        {/* iOS Navigation Bar */}
        <div className="sticky top-0 z-30 bg-gray-100/95 backdrop-blur-xl border-b border-gray-300/60">
          <div className="max-w-xl mx-auto px-4 flex items-center justify-between h-14">
            <h1 className="text-xl font-bold text-gray-900">Alarmas</h1>
            <button onClick={() => { setEditingAlarma(null); setShowForm(true) }}
              className="flex items-center gap-1.5 text-blue-500 font-semibold text-base active:opacity-60 transition-opacity">
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              Nueva
            </button>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 py-6 space-y-6 pb-28">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total',    value: alarmas.length,    color: 'text-gray-700' },
              { label: 'Activas',  value: activeList.length,  color: 'text-green-600' },
              { label: 'Inact.',   value: inactiveList.length, color: 'text-gray-400' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl px-3 py-4 text-center shadow-sm">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : alarmas.length === 0 ? (
            <div className="flex flex-col items-center py-24 gap-3">
              <div className="w-16 h-16 bg-white rounded-3xl shadow flex items-center justify-center">
                <Bell className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Sin alarmas</p>
              <p className="text-gray-400 text-sm text-center">Toca "Nueva" para crear tu primera alarma</p>
            </div>
          ) : (
            <>
              {activeList.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Activas</p>
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                    {activeList.map((a, i) => (
                      <AlarmaRow key={a.id} alarma={a} isLast={i === activeList.length - 1}
                        onPress={() => setActionAlarma(a)} />
                    ))}
                  </div>
                </div>
              )}
              {inactiveList.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Inactivas</p>
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                    {inactiveList.map((a, i) => (
                      <AlarmaRow key={a.id} alarma={a} isLast={i === inactiveList.length - 1}
                        onPress={() => setActionAlarma(a)} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* FAB para desktop */}
        <div className="fixed bottom-20 right-4 sm:bottom-6 z-40 sm:block hidden">
          <button onClick={() => { setEditingAlarma(null); setShowForm(true) }}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold py-3 px-5 rounded-2xl shadow-xl transition-all">
            <Plus className="w-5 h-5" /> Nueva alarma
          </button>
        </div>
      </div>

        </SidebarInset>
      </SidebarProvider>

      {/* Action sheet (tap on row) */}
      {actionAlarma && (
        <ActionSheet
          alarma={actionAlarma}
          onClose={() => setActionAlarma(null)}
          onEdit={() => { setEditingAlarma(actionAlarma); setShowForm(true) }}
          onToggle={() => doToggle(actionAlarma)}
          onDelete={() => setDeleteAlarma(actionAlarma)}
        />
      )}

      {/* Delete confirmation */}
      {deleteAlarma && (
        <DeleteSheet
          alarma={deleteAlarma}
          onConfirm={() => doDelete(deleteAlarma)}
          onCancel={() => setDeleteAlarma(null)}
        />
      )}

      {/* Form sheet */}
      {showForm && (
        <FormSheet
          alarma={editingAlarma}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingAlarma(null) }}
        />
      )}
    </AdminLayout>
  )
}
