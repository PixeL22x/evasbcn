'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

// Usuarios predefinidos
const USERS = {
  admin: {
    username: 'admin',
    password: 'admin',
    role: 'admin',
    name: 'Administrador'
  },
  evas: {
    username: 'evas',
    password: 'evas',
    role: 'worker',
    name: 'Trabajador Evas'
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    setLoading(false)
  }, [])

  const login = (username, password) => {
    const userData = USERS[username]
    
    if (userData && userData.password === password) {
      const userToSave = {
        username: userData.username,
        role: userData.role,
        name: userData.name
      }
      
      setUser(userToSave)
      localStorage.setItem('user', JSON.stringify(userToSave))
      return { success: true, user: userToSave }
    }
    
    return { success: false, error: 'Usuario o contraseña incorrectos' }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('cierreId')
    localStorage.removeItem('workerName')
    
    // Redirigir a login después del logout
    if (typeof window !== 'undefined') {
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

  const canViewPhotos = () => {
    return isAdmin() || isWorker()
  }

  const canUploadPhotos = () => {
    return isWorker()
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isWorker,
    canViewPhotos,
    canUploadPhotos
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
