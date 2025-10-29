import { useEffect, useState } from 'react'
import { ProfessorController } from '../controllers/ProfessorController'
import type { Professor } from '../models/Professor'
import { ProfessorCreateSchema, ProfessorUpdateSchema } from '../models/Professor'
import type { z } from 'zod'
import Modal from '../components/Modal'
import Swal from 'sweetalert2'
import { useAuth } from '../hooks/useAuth'

export default function ProfessorsPage() {
  const { user } = useAuth()
  const [list, setList] = useState<Professor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState<Professor | null>(null)

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [department, setDepartment] = useState('')
  const [academicTitle, setAcademicTitle] = useState('')

  const refresh = async () => {
    setLoading(true); setError(null)
    try { setList(await ProfessorController.list()) } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error al cargar') }
    finally { setLoading(false) }
  }

  useEffect(() => { void refresh() }, [])

  const resetForm = () => { setEmail(''); setFullName(''); setPassword(''); setDepartment(''); setAcademicTitle('') }

  const onCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null)
    try {
      const payload: z.infer<typeof ProfessorCreateSchema> = {
        email,
        full_name: fullName,
        password,
        department,
        academic_title: academicTitle,
      }
      await ProfessorController.create(payload)
      setCreateOpen(false); resetForm(); await refresh()
      void Swal.fire({ icon: 'success', title: 'Profesor creado', timer: 1500, showConfirmButton: false })
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error al crear') }
  }

  const openEdit = (p: Professor) => {
    setEditOpen(p)
    setEmail(p.user?.email ?? '')
    setFullName(p.user?.full_name ?? '')
    setPassword('')
    setDepartment(p.department ?? '')
    setAcademicTitle(p.academic_title ?? '')
  }

  const onEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editOpen) return
    try {
      const payload: z.infer<typeof ProfessorUpdateSchema> = {
        email: email || undefined,
        full_name: fullName || undefined,
        password: password || undefined,
        department: department || undefined,
        academic_title: academicTitle || undefined,
      }
      await ProfessorController.update(editOpen.user_id, payload)
      setEditOpen(null); resetForm(); await refresh()
      void Swal.fire({ icon: 'success', title: 'Profesor actualizado', timer: 1500, showConfirmButton: false })
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error al actualizar') }
  }

  const onDelete = async (id: string) => {
    try { await ProfessorController.remove(id); await refresh(); void Swal.fire({icon:'success', title:'Profesor eliminado', timer: 1200, showConfirmButton:false}) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error al eliminar') }
  }

  if (user?.role !== 'admin') {
    return <p className="text-sm text-red-600">No tienes permisos para ver esta página.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Profesores</h2>
        <button className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700" onClick={()=>{ resetForm(); setCreateOpen(true) }}>Nuevo profesor</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? <p className="text-neutral-500">Cargando...</p> : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-600 dark:text-neutral-300">Nombre</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-600 dark:text-neutral-300">Email</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-600 dark:text-neutral-300">Departamento</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-600 dark:text-neutral-300">Título</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-neutral-600 dark:text-neutral-300">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {list.map(p => (
                <tr key={p.id}>
                  <td className="px-4 py-2">{p.user?.full_name}</td>
                  <td className="px-4 py-2">{p.user?.email}</td>
                  <td className="px-4 py-2">{p.department}</td>
                  <td className="px-4 py-2">{p.academic_title}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button className="rounded-md border px-2 py-1 text-sm" onClick={()=>openEdit(p)}>Editar</button>
                    <button className="rounded-md border px-2 py-1 text-sm text-red-600" onClick={()=>onDelete(p.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={createOpen} title="Nuevo profesor" onClose={()=>setCreateOpen(false)}
        actions={<button type="submit" form="prof-create" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">Guardar</button>}
      >
        <form id="prof-create" onSubmit={onCreateSubmit} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-300">Email</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-300">Nombre completo</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={fullName} onChange={e=>setFullName(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-300">Contraseña</label>
            <input type="password" className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-300">Departamento</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={department} onChange={e=>setDepartment(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-300">Título académico</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={academicTitle} onChange={e=>setAcademicTitle(e.target.value)} />
            </div>
          </div>
        </form>
      </Modal>

      <Modal open={!!editOpen} title="Editar profesor" onClose={()=>setEditOpen(null)}
        actions={<button type="submit" form="prof-edit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">Actualizar</button>}
      >
        <form id="prof-edit" onSubmit={onEditSubmit} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-300">Email</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-300">Nombre completo</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={fullName} onChange={e=>setFullName(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-300">Nueva contraseña (opcional)</label>
            <input type="password" className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-300">Departamento</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={department} onChange={e=>setDepartment(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-300">Título académico</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={academicTitle} onChange={e=>setAcademicTitle(e.target.value)} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
