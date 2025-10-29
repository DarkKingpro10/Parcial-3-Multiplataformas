import { createContext } from 'react'

export type SessionUser = {
  id: string
  email: string | null
  role?: 'admin' | 'profesor' | 'estudiante'
  full_name?: string | null
}

export type AuthContextValue = {
  user: SessionUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
