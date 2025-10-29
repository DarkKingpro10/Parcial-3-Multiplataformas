import { useEffect, useState } from 'react';
import { StudentController } from '../controllers/StudentController';
import type { Student } from '../models/Student';
import Modal from '../components/Modal';
import Swal from 'sweetalert2';

export default function StudentsPage() {
  const [list, setList] = useState<Student[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<null | Student>(null);
  // Campos de credenciales y dominio
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [major, setMajor] = useState('');
  const [semester, setSemester] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true); setError(null);
  try { setList(await StudentController.list()); }
  catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error al cargar'); }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  const resetForm = () => { setEmail(''); setFullName(''); setPassword(''); setStudentCode(''); setMajor(''); setSemester(''); };

  const onCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    try {
      await StudentController.create({ email, full_name: fullName, password, student_code: studentCode, major, semester: Number(semester) });
      resetForm(); setCreateOpen(false);
      await refresh();
      void Swal.fire({ icon: 'success', title: 'Estudiante creado', timer: 1500, showConfirmButton: false });
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error al crear'); }
  };

  const onDelete = async (id: string) => {
  try { await StudentController.remove(id); await refresh(); }
  catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error al eliminar'); }
  }

  const openEdit = (s: Student) => {
    setEditOpen(s);
    setEmail(s.user?.email ?? '');
    setFullName(s.user?.full_name ?? '');
    setPassword('');
    setStudentCode(s.student_code ?? '');
    setMajor(s.major ?? '');
    setSemester(s.semester ?? '');
  };
  const onEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editOpen) return;
    try {
      await StudentController.update(editOpen.user_id, {
        email: email || undefined,
        full_name: fullName || undefined,
        password: password || undefined,
        student_code: studentCode || undefined,
        major: major || undefined,
        semester: semester === '' ? undefined : Number(semester),
      });
      setEditOpen(null); resetForm(); await refresh();
      void Swal.fire({ icon: 'success', title: 'Estudiante actualizado', timer: 1500, showConfirmButton: false });
    }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error al actualizar'); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Estudiantes</h2>
        <button
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          onClick={() => { resetForm(); setCreateOpen(true); }}
        >
          Nuevo estudiante
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? <p className="text-neutral-500">Cargando...</p> : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-600 dark:text-neutral-300">Nombre</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-600 dark:text-neutral-300">Email</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-600 dark:text-neutral-300">Código</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-600 dark:text-neutral-300">Carrera</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-600 dark:text-neutral-300">Semestre</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-neutral-600 dark:text-neutral-300">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {list.map(s => (
                <tr key={s.id}>
                  <td className="px-4 py-2">{s.user?.full_name}</td>
                  <td className="px-4 py-2">{s.user?.email}</td>
                  <td className="px-4 py-2">{s.student_code}</td>
                  <td className="px-4 py-2">{s.major}</td>
                  <td className="px-4 py-2">{s.semester ?? ''}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button className="rounded-md border px-2 py-1 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800" onClick={()=>openEdit(s)}>Editar</button>
                    <button className="rounded-md border px-2 py-1 text-sm text-red-600 hover:bg-red-50 dark:border-neutral-700 dark:text-red-400 dark:hover:bg-neutral-800" onClick={()=>onDelete(s.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear */}
      <Modal open={createOpen} title="Nuevo estudiante" onClose={() => setCreateOpen(false)}
        actions={
          <button type="submit" form="student-create" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">Guardar</button>
        }
      >
        <form id="student-create" onSubmit={onCreateSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-300">Email</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-300">Nombre completo</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={fullName} onChange={e=>setFullName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-300">Contraseña</label>
            <input type="password" className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-300">Código</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={studentCode} onChange={e=>setStudentCode(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-300">Carrera</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={major} onChange={e=>setMajor(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-300">Semestre</label>
              <input type="number" className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={semester} onChange={e=>setSemester(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Editar */}
      <Modal open={!!editOpen} title="Editar estudiante" onClose={() => { setEditOpen(null); }}
        actions={
          <button type="submit" form="student-edit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">Actualizar</button>
        }
      >
        <form id="student-edit" onSubmit={onEditSubmit} className="space-y-3">
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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-300">Código</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={studentCode} onChange={e=>setStudentCode(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-300">Carrera</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={major} onChange={e=>setMajor(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-300">Semestre</label>
              <input type="number" className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={semester} onChange={e=>setSemester(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
