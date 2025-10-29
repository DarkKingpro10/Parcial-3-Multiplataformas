import { useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { supabase } from '../lib/supabaseClient'
import { AuthContext, type SessionUser } from './auth-context'

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem('sessionUser')
    if (raw) {
      try { setUser(JSON.parse(raw) as SessionUser) } catch (e) { console.warn('No se pudo restaurar sesión', e) }
    }
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.rpc('authenticate_user', { p_email: email, p_password: password })
    if (error) throw error
    const u = (Array.isArray(data) ? data[0] : data) as { id: string; email: string; full_name: string; role: 'admin'|'profesor'|'estudiante' } | null
    if (!u) throw new Error('Credenciales inválidas')
    const session: SessionUser = { id: u.id, email: u.email, full_name: u.full_name, role: u.role }
    setUser(session)
    localStorage.setItem('sessionUser', JSON.stringify(session))
  }

  const signOut = async () => {
    localStorage.removeItem('sessionUser')
    setUser(null)
  }

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Sin Supabase Auth: no se usa profiles

// Hook movido a src/hooks/useAuth.ts para cumplir con fast refresh
