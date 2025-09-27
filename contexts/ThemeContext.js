"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => null,
})

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}) {
  const [theme, setTheme] = useState(defaultTheme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const storedTheme = localStorage.getItem(storageKey) || defaultTheme
    setTheme(storedTheme)
  }, [defaultTheme, storageKey])

  useEffect(() => {
    if (!mounted) return

    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme, mounted])

  const value = {
    theme,
    setTheme: (newTheme) => {
      if (mounted) {
        localStorage.setItem(storageKey, newTheme)
      }
      setTheme(newTheme)
    },
  }

  // Evitar problemas de hidratación
  if (!mounted) {
    return (
      <ThemeContext.Provider {...props} value={{ theme: defaultTheme, setTheme: () => {} }}>
        {children}
      </ThemeContext.Provider>
    )
  }

  return (
    <ThemeContext.Provider {...props} value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
