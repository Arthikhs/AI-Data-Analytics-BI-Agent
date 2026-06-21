import { create } from 'zustand'

interface AuthState {
  token: string | null
  username: string | null
  role: string | null
  login: (token: string, username: string, role: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>(set => ({
  token: sessionStorage.getItem('token'),
  username: sessionStorage.getItem('username'),
  role: sessionStorage.getItem('role'),
  login: (token, username, role) => {
    sessionStorage.setItem('token', token)
    sessionStorage.setItem('username', username)
    sessionStorage.setItem('role', role)
    set({ token, username, role })
  },
  logout: () => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('username')
    sessionStorage.removeItem('role')
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
