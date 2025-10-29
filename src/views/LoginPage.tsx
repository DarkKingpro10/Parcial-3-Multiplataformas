import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, useLocation } from 'react-router'
import { demoCredentials } from '../config/demoCredentials'

export default function LoginPage() {
  const { signIn } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setLoading(true)
    try {
      await signIn(email, password)
  const to = (loc.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/students'
      nav(to, { replace: true })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión')
    } finally { setLoading(false) }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-md  dark:bg-gray-900 dark:text-white">
        <h2 className="mb-6 text-center text-2xl font-semibold light:text-neutral-900">Iniciar sesión</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm light:text-neutral-700">Email</label>
            <input
              className="mt-1 w-full rounded-md border border-neutral-300 light:bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              value={email}
              onChange={e=>setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm light:text-neutral-700">Contraseña</label>
            <input
              type="password"
              className="mt-1 w-full rounded-md border border-neutral-300 light:bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              value={password}
              onChange={e=>setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            disabled={loading}
            className="w-full rounded-md bg-linear-to-r from-indigo-600 to-blue-600 px-3 py-2 font-medium text-white hover:from-indigo-700 hover:to-blue-700 disabled:opacity-60"
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-6 rounded-md light:bg-neutral-50 p-3 text-sm dark:border-2 dark:border-neutral-700">
          <p className="mb-2 font-medium">Credenciales demo (actualiza según tu proyecto):</p>
          <ul className="list-inside list-disc space-y-1">
            {demoCredentials.map(c => (
              <li key={c.role}><strong>{c.role}:</strong> {c.email} / {c.password}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
