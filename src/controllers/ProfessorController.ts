import { supabase } from '../lib/supabaseClient'
import { ProfessorCreateSchema, ProfessorUpdateSchema } from '../models/Professor'
import { ProfessorDAO } from '../dao/ProfessorDAO'

export const ProfessorController = {
  async list() {
    return await ProfessorDAO.list()
  },
  async create(input: { email: string; full_name: string; password: string; department: string; academic_title: string }) {
    const parsed = ProfessorCreateSchema.safeParse(input)
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Datos inválidos')
    const { email, password, full_name, department, academic_title } = parsed.data
    const { data, error } = await supabase.rpc('create_professor_with_user', {
      p_email: email,
      p_password: password,
      p_full_name: full_name,
      p_department: department,
      p_academic_title: academic_title,
    })
    if (error) throw error
    return data
  },
  async update(user_id: string, patch: { email?: string; full_name?: string; password?: string; department?: string; academic_title?: string }) {
    const parsed = ProfessorUpdateSchema.safeParse(patch)
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Datos inválidos')
    const { error } = await supabase.rpc('update_user_and_professor', {
      p_user_id: user_id,
      p_email: parsed.data.email ?? null,
      p_full_name: parsed.data.full_name ?? null,
      p_password: parsed.data.password ?? null,
      p_department: parsed.data.department ?? null,
      p_academic_title: parsed.data.academic_title ?? null,
    })
    if (error) throw error
  },
  async remove(id: string) {
    // Esto borra al profesor; ojo que user queda. Para borrar user, se debe decidir política aparte.
    await ProfessorDAO.remove(id)
  }
}
