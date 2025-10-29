import { supabase } from '../lib/supabaseClient'

export type CourseCountRow = {
  course_id: string
  name: string
  credits: number
  professor_name: string | null
  professor_email: string | null
  students_count: number
}

export const ReportDAO = {
  async getCoursesWithCounts(): Promise<CourseCountRow[]> {
    const { data, error } = await supabase.rpc('get_courses_with_counts')
    if (error) throw error
    return (data ?? []) as unknown as CourseCountRow[]
  }
}
