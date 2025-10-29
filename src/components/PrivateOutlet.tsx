import { Outlet, Navigate, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'

export default function PrivateOutlet() {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <div className="text-neutral-500">Cargando...</div>
  if (!user) return <Navigate to="/login" replace state={{ from: loc }} />
  return <Outlet />
}
