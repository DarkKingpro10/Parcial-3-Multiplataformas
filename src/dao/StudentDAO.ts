import { supabase } from '../lib/supabaseClient';
import type { Student } from '../models/Student';

// DAO: Acceso a datos para students (Supabase)
export const StudentDAO = {
  async list(): Promise<Student[]> {
    const { data, error } = await supabase
      .from('students')
      .select('id, user_id, student_code, major, semester, created_at, user:users_app(id,email,full_name,role)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const rows = (data ?? []) as unknown as Array<{
      id: string; user_id: string; student_code: string; major: string; semester: number | null; created_at?: string;
      user?: { id: string; email: string; full_name: string; role: 'admin' | 'profesor' | 'estudiante' }
    }>;
    return rows as Student[];
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) throw error;
  },
};
