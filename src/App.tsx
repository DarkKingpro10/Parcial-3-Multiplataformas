import { Link, Outlet } from 'react-router'
import { useAuth } from './hooks/useAuth'
import './App.css'

export default function App() {
  const { user, signOut } = useAuth()
  return (
    <div className="mx-auto max-w-5xl p-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Sistema Universitario</h1>
        <nav className="flex items-center gap-4 text-sm">
          <Link className="text-blue-700 hover:underline" to="/students">Estudiantes</Link>
          <Link className="text-blue-700 hover:underline" to="/courses">Cursos</Link>
          {user?.role === 'admin' && (
            <Link className="text-blue-700 hover:underline" to="/professors">Profesores</Link>
          )}
          {user ? (
            <>
              <span className="text-neutral-600">{user.full_name} ({user.role})</span>
              <button className="rounded-md border px-2 py-1" onClick={signOut}>Salir</button>
            </>
          ) : (
            <Link className="text-blue-700 hover:underline" to="/login">Login</Link>
          )}
        </nav>
      </header>
      <Outlet />
    </div>
  )
}
