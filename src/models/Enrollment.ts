export type Enrollment = {
  id: string
  student_id: string
  course_id: string
  created_at?: string
  // relaciones opcionales para listados enriquecidos
  student?: { id: string; user_id: string; user?: { id: string; full_name: string; email: string } }
  course?: { id: string; name: string }
  grades?: Array<{ id: string; value: number; note: string | null }>
}

export type StudentEnrollmentInfo = {
  enrollment?: Enrollment | null
  gradeValue?: number | null
}
