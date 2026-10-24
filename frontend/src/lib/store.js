import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from './api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: async (email, password) => {
        try {
          const res = await api.post('/users/login', { email, password })
          const { token, ...user } = res.data
          localStorage.setItem('token', token)
          set({ user, token, isAuthenticated: true })
          return res.data
        } catch (error) {
          // QUAN TRỌNG: Throw error để component catch được
          throw error
        }
      },
      
      register: async (data) => {
        const res = await api.post('/users/register', data)
        return res.data
      },
      
      logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        set({ user: null, token: null, isAuthenticated: false })
      },
      
      loadUser: async () => {
        const token = localStorage.getItem('token')
        if (!token) return
        try {
          const res = await api.get('/users/profile')
          set({ user: res.data, token, isAuthenticated: true })
        } catch {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      },

      setAuth: (user, token) => {
        if (token) localStorage.setItem('token', token)
        set({ user, token, isAuthenticated: !!user })
      },

      updateUser: (data) => set((state) => ({ 
        user: state.user ? { ...state.user, ...data } : data 
      })),

      
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)  