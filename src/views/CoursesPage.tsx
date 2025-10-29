import { useEffect, useState } from 'react';
import { CourseController } from '../controllers/CourseController';
import type { Course } from '../models/Course';
import Modal from '../components/Modal';
import { ProfessorController } from '../controllers/ProfessorController';
import type { Professor } from '../models/Professor';
import Swal from 'sweetalert2';

export default function CoursesPage() {
  const [list, setList] = useState<Course[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<null | Course>(null);
  const [name, setName] = useState('');
  const [credits, setCredits] = useState<number>(0);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [professorId, setProfessorId] = useState<string | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true); setError(null);
    try {
      const [courses, profs] = await Promise.all([
        CourseController.list(),
        ProfessorController.list(),
      ])
      setList(courses);
      setProfessors(profs);
    }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error al cargar'); }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  const resetForm = () => { setName(''); setCredits(0); setProfessorId(''); };
  const onCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    try {
  await CourseController.create({ name, credits, professor_id: professorId || undefined });
      resetForm(); setCreateOpen(false);
      await refresh();
  void Swal.fire({ icon: 'success', title: 'Curso creado', timer: 1500, showConfirmButton: false });
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error al crear'); }
  };

  const onDelete = async (id: string) => {
    try { await CourseController.remove(id); await refresh(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error al eliminar'); }
  }

  const openEdit = (c: Course) => { setEditOpen(c); setName(c.name); setCredits(c.credits); setProfessorId(c.professor_id ?? ''); }
  const onEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editOpen) return;
  try { await CourseController.update(editOpen.id, { name, credits, professor_id: professorId || null }); setEditOpen(null); resetForm(); await refresh(); void Swal.fire({icon:'success',title:'Curso actualizado',timer:1500,showConfirmButton:false}); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error al actualizar'); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Cursos</h2>
        <button className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700" onClick={()=>{ resetForm(); setCreateOpen(true); }}>Nuevo curso</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? <p className="text-neutral-500">Cargando...</p> : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-600 dark:text-neutral-300">Nombre</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-600 dark:text-neutral-300">Créditos</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-600 dark:text-neutral-300">Profesor</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-neutral-600 dark:text-neutral-300">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {list.map(c => (
                <tr key={c.id}>
                  <td className="px-4 py-2">{c.name}</td>
                  <td className="px-4 py-2">{c.credits}</td>
                  <td className="px-4 py-2">{c.professor?.user?.full_name ?? '-'}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button className="rounded-md border px-2 py-1 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800" onClick={()=>openEdit(c)}>Editar</button>
                    <button className="rounded-md border px-2 py-1 text-sm text-red-600 hover:bg-red-50 dark:border-neutral-700 dark:text-red-400 dark:hover:bg-neutral-800" onClick={()=>onDelete(c.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={createOpen} title="Nuevo curso" onClose={()=>setCreateOpen(false)}
        actions={<button type="submit" form="course-create" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">Guardar</button>}
      >
        <form id="course-create" onSubmit={onCreateSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-300">Nombre</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-300">Créditos</label>
            <input type="number" className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={credits} onChange={e=>setCredits(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-300">Profesor</label>
            <select className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={professorId} onChange={e=>setProfessorId(e.target.value)}>
              <option value="">Sin asignar</option>
              {professors.map(p => (
                <option key={p.id} value={p.id}>{p.user?.full_name} ({p.user?.email})</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      <Modal open={!!editOpen} title="Editar curso" onClose={()=>setEditOpen(null)}
        actions={<button type="submit" form="course-edit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">Actualizar</button>}
      >
        <form id="course-edit" onSubmit={onEditSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-300">Nombre</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-300">Créditos</label>
            <input type="number" className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={credits} onChange={e=>setCredits(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-300">Profesor</label>
            <select className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={professorId} onChange={e=>setProfessorId(e.target.value)}>
              <option value="">Sin asignar</option>
              {professors.map(p => (
                <option key={p.id} value={p.id}>{p.user?.full_name} ({p.user?.email})</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
