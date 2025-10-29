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
    <div className="mx-auto mt-16 max-w-md rounded-lg border p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">Iniciar sesión</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm">Email</label>
          <input className="mt-1 w-full rounded-md border px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Contraseña</label>
          <input type="password" className="mt-1 w-full rounded-md border px-3 py-2" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full rounded-md bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60">
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>

      <div className="mt-6 rounded-md bg-neutral-50 p-3 text-sm">
        <p className="mb-2 font-medium">Credenciales demo (actualiza según tu proyecto):</p>
        <ul className="list-inside list-disc space-y-1">
          {demoCredentials.map(c => (
            <li key={c.role}><strong>{c.role}:</strong> {c.email} / {c.password}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
