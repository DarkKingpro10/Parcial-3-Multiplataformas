import { useEffect, useState } from 'react';
import { CourseController } from '../controllers/CourseController';
import type { Course } from '../models/Course';
import Modal from '../components/Modal';
import { ProfessorController } from '../controllers/ProfessorController';
import type { Professor } from '../models/Professor';
import Swal from 'sweetalert2';
import { useAuth } from '../hooks/useAuth';
import { StudentDAO } from '../dao/StudentDAO';
import { ProfessorDAO } from '../dao/ProfessorDAO';
import { EnrollmentController } from '../controllers/EnrollmentController';
import type { Enrollment } from '../models/Enrollment';
import { GradeController } from '../controllers/GradeController';

export default function CoursesPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Course[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<null | Course>(null);
  const [name, setName] = useState('');
  const [credits, setCredits] = useState<number>(0);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [professorId, setProfessorId] = useState<string | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // datos por rol
  const [myStudentId, setMyStudentId] = useState<string | null>(null);
  const [myProfessorId, setMyProfessorId] = useState<string | null>(null);
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [studentShowMine, setStudentShowMine] = useState<boolean>(false);
  // calificaciones
  const [gradeOpenCourse, setGradeOpenCourse] = useState<Course | null>(null);
  const [gradeEnrollments, setGradeEnrollments] = useState<Enrollment[]>([]);
  const [gradeDraft, setGradeDraft] = useState<Record<string, string>>({}); // enrollmentId -> value string

  const refresh = async () => {
    setLoading(true); setError(null);
    try {
      const [courses, profs] = await Promise.all([
        CourseController.list(),
        ProfessorController.list(),
      ]);
      setProfessors(profs);

      if (user?.role === 'profesor') {
        const me = await ProfessorDAO.findByUserId(user.id);
        setMyProfessorId(me?.id ?? null);
        const filtered = (me?.id)
          ? courses.filter(c => c.professor?.id === me.id)
          : courses;
        setList(filtered);
      } else {
        setList(courses);
      }

      if (user?.role === 'estudiante') {
        const me = await StudentDAO.findByUserId(user.id);
        setMyStudentId(me?.id ?? null);
        if (me?.id) {
          const ens = await EnrollmentController.listByStudent(me.id);
          setMyEnrollments(ens);
        } else {
          setMyEnrollments([]);
        }
      }
    }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error al cargar'); }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => { setName(''); setCredits(0); setProfessorId(''); };
  const onCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    try {
  await CourseController.create({ name, credits, professor_id: professorId || undefined });
      resetForm(); setCreateOpen(false);
      await refresh();
  void Swal.fire({ icon: 'success', title: 'Curso creado', timer: 1500, showConfirmButton: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al crear';
      void Swal.fire({icon:'error', title:'No se pudo crear', text: msg});
    }
  };

  const onDelete = async (id: string) => {
    try { await CourseController.remove(id); await refresh(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error al eliminar'); }
  }

  const openEdit = (c: Course) => { setEditOpen(c); setName(c.name); setCredits(c.credits); setProfessorId(c.professor_id ?? ''); }
  const onEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editOpen) return;
  try { await CourseController.update(editOpen.id, { name, credits, professor_id: professorId || null }); setEditOpen(null); resetForm(); await refresh(); void Swal.fire({icon:'success',title:'Curso actualizado',timer:1500,showConfirmButton:false}); }
    catch (e: unknown) { const msg = e instanceof Error ? e.message : 'Error al actualizar'; void Swal.fire({icon:'error', title:'No se pudo actualizar', text: msg}); }
  }

  // Estudiante: inscribirse / retirarse
  const isEnrolled = (courseId: string) => myEnrollments.some(e => e.course_id === courseId);
  const myGradeFor = (courseId: string): number | null => {
    const e = myEnrollments.find(x => x.course_id === courseId);
    const g = e?.grades?.[0]?.value;
    return typeof g === 'number' ? g : null;
  }
  const onEnroll = async (courseId: string) => {
    if (!myStudentId) return;
    try { await EnrollmentController.enroll(myStudentId, courseId); await refresh(); void Swal.fire({icon:'success', title:'Inscripción realizada', timer:1200, showConfirmButton:false}); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'No se pudo inscribir'); }
  }
  const onUnenroll = async (courseId: string) => {
    if (!myStudentId) return;
    try { await EnrollmentController.unenroll(myStudentId, courseId); await refresh(); void Swal.fire({icon:'success', title:'Inscripción retirada', timer:1200, showConfirmButton:false}); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'No se pudo retirar'); }
  }

  // Profesor: gestionar notas
  const openGrades = async (course: Course) => {
    setGradeOpenCourse(course); setGradeDraft({}); setGradeEnrollments([]);
    try {
      const rows = await EnrollmentController.listByCourse(course.id);
      setGradeEnrollments(rows);
      const draft: Record<string, string> = {};
      for (const r of rows) {
        const v = r.grades?.[0]?.value as unknown as number | undefined;
        if (typeof v === 'number') draft[r.id] = String(v);
      }
      setGradeDraft(draft);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al cargar notas';
      void Swal.fire({icon:'error', title:'No se pudieron cargar', text: msg});
    }
  }
  const saveGrades = async () => {
    try {
      for (const [enrollmentId, valueStr] of Object.entries(gradeDraft)) {
        const v = Number(valueStr);
        if (!isNaN(v)) await GradeController.upsertByEnrollment(enrollmentId, v, null);
      }
      setGradeOpenCourse(null);
      void Swal.fire({icon:'success', title:'Notas guardadas', timer:1200, showConfirmButton:false});
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudieron guardar las notas';
      void Swal.fire({icon:'error', title:'Fallo al guardar', text: msg});
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Cursos</h2>
        <div className="flex items-center gap-2">
          {user?.role === 'estudiante' && (
            <div className="rounded-md bg-neutral-100 p-1 text-xs dark:bg-gray-800">
              <button className={`rounded px-2 py-1 ${!studentShowMine ? 'bg-white dark:bg-gray-900 shadow' : ''}`} onClick={()=>setStudentShowMine(false)}>Todos</button>
              <button className={`rounded px-2 py-1 ${studentShowMine ? 'bg-white shadow dark:bg-gray-900' : ''}`} onClick={()=>setStudentShowMine(true)}>Mis cursos</button>
            </div>
          )}
          {user?.role === 'admin' && (
            <button className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700" onClick={()=>{ resetForm(); setCreateOpen(true); }}>Nuevo curso</button>
          )}
        </div>
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
                {user?.role === 'estudiante' && (
                  <>
                    <th className="px-4 py-2 text-left text-sm font-medium text-neutral-600 dark:text-neutral-300">Mi nota</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-neutral-600 dark:text-neutral-300">Acción</th>
                  </>
                )}
                {(user?.role === 'admin' || user?.role === 'profesor') && (
                  <th className="px-4 py-2 text-right text-sm font-medium text-neutral-600 dark:text-neutral-300">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {(user?.role === 'estudiante' ? (studentShowMine ? list.filter(c=>isEnrolled(c.id)) : list) : list).map(c => (
                <tr key={c.id}>
                  <td className="px-4 py-2">{c.name}</td>
                  <td className="px-4 py-2">{c.credits}</td>
                  <td className="px-4 py-2">{c.professor?.user?.full_name ?? '-'}</td>
                  {user?.role === 'estudiante' && (
                    <>
                      <td className="px-4 py-2">{myGradeFor(c.id) ?? '-'}</td>
                      <td className="px-4 py-2 text-right">
                        {isEnrolled(c.id) ? (
                          <button className="rounded-md border px-2 py-1 text-sm" onClick={()=>onUnenroll(c.id)}>Retirarme</button>
                        ) : (
                          <button className="rounded-md bg-blue-600 px-2 py-1 text-sm text-white" onClick={()=>onEnroll(c.id)}>Inscribirme</button>
                        )}
                      </td>
                    </>
                  )}
                  {(user?.role === 'admin') && (
                    <td className="px-4 py-2 text-right space-x-2">
                      <button className="rounded-md border px-2 py-1 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800" onClick={()=>openEdit(c)}>Editar</button>
                      <button className="rounded-md border px-2 py-1 text-sm text-red-600 hover:bg-red-50 dark:border-neutral-700 dark:text-red-400 dark:hover:bg-neutral-800" onClick={()=>onDelete(c.id)}>Eliminar</button>
                    </td>
                  )}
                  {(user?.role === 'profesor' && c.professor?.id === myProfessorId) && (
                    <td className="px-4 py-2 text-right">
                      <button className="rounded-md bg-blue-600 px-2 py-1 text-sm text-white" onClick={()=>openGrades(c)}>Calificar</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {user?.role === 'admin' && (
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
      )}

      {user?.role === 'admin' && (
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
      )}

      {/* Modal Calificaciones para profesor */}
      {user?.role === 'profesor' && (
        <Modal
          open={!!gradeOpenCourse}
          title={`Calificar: ${gradeOpenCourse?.name ?? ''}`}
          onClose={()=>setGradeOpenCourse(null)}
          actions={<button onClick={saveGrades} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">Guardar</button>}
        >
          <div className="space-y-3">
            {gradeEnrollments.length === 0 ? (
              <p className="text-sm text-neutral-600">No hay estudiantes inscritos.</p>
            ) : (
              <table className="min-w-full divide-y divide-neutral-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-sm">Estudiante</th>
                    <th className="px-3 py-2 text-left text-sm">Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {gradeEnrollments.map(en => (
                    <tr key={en.id}>
                      <td className="px-3 py-2">{en.student?.user?.full_name} ({en.student?.user?.email})</td>
                      <td className="px-3 py-2">
                        <input
                          type="number" min={0} max={10} step={0.1}
                          className="w-28 rounded-md border px-2 py-1"
                          value={gradeDraft[en.id] ?? ''}
                          onChange={e=>setGradeDraft(prev=>({...prev, [en.id]: e.target.value}))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
