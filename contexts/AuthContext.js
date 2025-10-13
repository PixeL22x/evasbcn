'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import bcrypt from 'bcryptjs'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window !== 'undefined') {
      // Verificar si hay usuario guardado en localStorage
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser))
        } catch (error) {
          console.error('Error al cargar usuario guardado:', error)
          localStorage.removeItem('user')
        }
      }
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      // Verificar trabajadores en la base de datos (incluyendo admin)
      const response = await fetch('/api/trabajadores')
      if (response.ok) {
        const data = await response.json()
        const trabajador = data.trabajadores.find(t => 
          t.nombre === username && t.activo
        )
        
        if (trabajador) {
          // Verificar contraseña con hash
          const isValidPassword = await bcrypt.compare(password, trabajador.password)
          
          if (isValidPassword) {
            const userToSave = {
              username: trabajador.nombre,
              role: trabajador.nombre === 'admin' ? 'admin' : 'worker',
              name: trabajador.nombre === 'admin' ? 'Administrador' : trabajador.nombre,
              id: trabajador.id
            }
            setUser(userToSave)
            if (typeof window !== 'undefined') {
              localStorage.setItem('user', JSON.stringify(userToSave))
            }
            return { success: true, user: userToSave }
          }
        }
      }
      
      return { success: false, error: 'Usuario o contraseña incorrectos' }
    } catch (error) {
      console.error('Error al verificar credenciales:', error)
      return { success: false, error: 'Error de conexión' }
    }
  }

  const logout = () => {
    setUser(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user')
      localStorage.removeItem('cierreId')
      localStorage.removeItem('workerName')
      window.location.href = '/login'
    }
  }

  const isAuthenticated = () => {
    return user !== null
  }

  const isAdmin = () => {
    return user?.role === 'admin'
  }

  const isWorker = () => {
    return user?.role === 'worker'
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isWorker
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}
