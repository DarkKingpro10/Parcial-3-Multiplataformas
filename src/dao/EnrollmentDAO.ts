import { supabase } from '../lib/supabaseClient'
import type { Enrollment } from '../models/Enrollment'

export const EnrollmentDAO = {
  async listByCourse(courseId: string): Promise<Enrollment[]> {
    const { data, error } = await supabase
      .from('enrollments')
      .select('id, student_id, course_id, created_at, student:students(id,user_id, user:users_app(id,full_name,email)), grades(id,value,note)')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as Enrollment[]
  },
  async listByStudent(studentId: string): Promise<Enrollment[]> {
    const { data, error } = await supabase
      .from('enrollments')
      .select('id, student_id, course_id, created_at, course:courses(id,name,credits, professor:professor_id(id, user:users_app(id,full_name))), grades(id,value,note)')
      .eq('student_id', studentId)
    if (error) throw error
    return (data ?? []) as unknown as Enrollment[]
  },
  async find(studentId: string, courseId: string): Promise<Enrollment | null> {
    const { data, error } = await supabase
      .from('enrollments')
      .select('id, student_id, course_id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle()
    if (error) throw error
    return (data as unknown as Enrollment) ?? null
  },
  async enroll(studentId: string, courseId: string): Promise<string> {
    const { data, error } = await supabase
      .from('enrollments')
      .insert({ student_id: studentId, course_id: courseId })
      .select('id')
      .single()
    if (error) throw error
    return (data as { id: string }).id
  },
  async unenroll(studentId: string, courseId: string): Promise<void> {
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('student_id', studentId)
      .eq('course_id', courseId)
    if (error) throw error
  }
}
