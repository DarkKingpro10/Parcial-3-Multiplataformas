import { supabase } from '../lib/supabaseClient';
import type { Course } from '../models/Course';

export const CourseDAO = {
  async list(): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('id,name,credits,professor_id,created_at, professor:professors(id,user_id, user:users_app(id,full_name,email))')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Course[];
  },
  async create(course: Omit<Course, 'id' | 'created_at'>): Promise<Course> {
    const { data, error } = await supabase.from('courses').insert(course).select('id,name,credits,professor_id,created_at').single();
    if (error) throw error;
    return data as unknown as Course;
  },
  async update(id: string, patch: Partial<Omit<Course, 'id'>>): Promise<Course> {
    const { data, error } = await supabase.from('courses').update(patch).eq('id', id).select('id,name,credits,professor_id,created_at').single();
    if (error) throw error;
    return data as unknown as Course;
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) throw error;
  },
};
