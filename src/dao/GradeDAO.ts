import { supabase } from '../lib/supabaseClient'

export const GradeDAO = {
  async upsertByEnrollment(enrollmentId: string, value: number, note: string | null = null): Promise<void> {
    // Buscar si ya existe una nota para esta inscripción
    const existing = await supabase
      .from('grades')
      .select('id')
      .eq('enrollment_id', enrollmentId)
      .maybeSingle()

    if (existing.error) throw existing.error

    if (existing.data?.id) {
      const { error } = await supabase
        .from('grades')
        .update({ value, note })
        .eq('id', existing.data.id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('grades')
        .insert({ enrollment_id: enrollmentId, value, note })
      if (error) throw error
    }
  }
}
