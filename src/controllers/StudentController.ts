import { StudentDAO } from '../dao/StudentDAO';
import { StudentCreateSchema, StudentUpdateSchema } from '../models/Student';
import { supabase } from '../lib/supabaseClient';

export const StudentController = {
  async list() {
    return await StudentDAO.list();
  },
  async create(input: { email: string; full_name: string; password: string; student_code: string; major: string; semester: number }) {
    const parsed = StudentCreateSchema.safeParse(input)
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Datos inválidos');
    const { email, password, full_name, student_code, major, semester } = parsed.data
    const { data, error } = await supabase.rpc('create_student_with_user', {
      p_email: email,
      p_password: password,
      p_full_name: full_name,
      p_student_code: student_code,
      p_major: major,
      p_semester: semester,
    })
    if (error) throw error
    return data
  },
  async update(user_id: string, patch: {
    email?: string; full_name?: string; password?: string; student_code?: string; major?: string; semester?: number
  }) {
    const parsed = StudentUpdateSchema.safeParse(patch)
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Datos inválidos');
    const { error } = await supabase.rpc('update_user_and_student', {
      p_user_id: user_id,
      p_email: parsed.data.email ?? null,
      p_full_name: parsed.data.full_name ?? null,
      p_password: parsed.data.password ?? null,
      p_student_code: parsed.data.student_code ?? null,
      p_major: parsed.data.major ?? null,
      p_semester: parsed.data.semester ?? null,
    })
    if (error) throw error
  },
  async remove(id: string) {
    await StudentDAO.remove(id);
  },
};
