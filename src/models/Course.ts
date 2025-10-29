import { z } from 'zod'

export const CourseCreateSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  credits: z.coerce.number().int({ message: 'Créditos debe ser entero' }).nonnegative({ message: 'Créditos inválidos' }),
  professor_id: z.string().uuid().optional().nullable(),
})

export const CourseUpdateSchema = z
  .object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
    credits: z.coerce.number().int({ message: 'Créditos debe ser entero' }).nonnegative({ message: 'Créditos inválidos' }).optional(),
    professor_id: z.string().uuid().nullable().optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, { message: 'No hay cambios para actualizar' })

export type Course = z.infer<typeof CourseCreateSchema> & {
  id: string
  created_at?: string
  professor?: { id: string; user_id: string; user?: { id: string; full_name: string; email: string } }
}
