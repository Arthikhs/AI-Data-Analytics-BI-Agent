import { create } from 'zustand'

interface AuthState {
  token: string | null
  username: string | null
  role: string | null
  login: (token: string, username: string, role: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>(set => ({
  token: localStorage.getItem('token'),
  username: localStorage.getItem('username'),
  role: localStorage.getItem('role'),
  login: (token, username, role) => {
    localStorage.setItem('token', token)
    localStorage.setItem('username', username)
    localStorage.setItem('role', role)
    set({ token, username, role })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    set({ token: null, username: null, role: null })
  }
}))

interface ThemeState {
  dark: boolean
  toggle: () => void
}

export const useThemeStore = create<ThemeState>(set => ({
  dark: false,
  toggle: () => set(s => {
    const next = !s.dark
    document.documentElement.classList.toggle('dark', next)
    return { dark: next }
  })
}))
