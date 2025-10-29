import { supabase } from '../lib/supabaseClient'
import type { Professor } from '../models/Professor'

export const ProfessorDAO = {
  async list(): Promise<Professor[]> {
    const { data, error } = await supabase
      .from('professors')
      .select('id,user_id,department,academic_title,created_at, user:users_app(id,email,full_name,role)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as unknown as Professor[]
  },
  async findByUserId(userId: string): Promise<Professor | null> {
    const { data, error } = await supabase
      .from('professors')
      .select('id,user_id,department,academic_title')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    return (data as unknown as Professor) ?? null
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('professors').delete().eq('id', id)
    if (error) throw error
  }
}
