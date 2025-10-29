import { z } from 'zod'

// Esquema normalizado: usuarios en users_app y datos propios en students
export const StudentCreateSchema = z.object({
  email: z.string().email('Email inválido'),
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  student_code: z.string().min(1, 'Código requerido'),
  major: z.string().min(2, 'Carrera requerida'),
  semester: z.number().int().positive('Semestre inválido'),
})

export const StudentUpdateSchema = z
  .object({
    email: z.string().email('Email inválido').optional(),
    full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
    student_code: z.string().min(1, 'Código requerido').optional(),
    major: z.string().min(2, 'Carrera requerida').optional(),
    semester: z.number().int().positive('Semestre inválido').optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'No hay cambios para actualizar',
  })

export type Student = {
  id: string
  user_id: string
  student_code: string
  major: string
  semester: number | null
  created_at?: string
  user?: { id: string; email: string; full_name: string; role: 'admin' | 'profesor' | 'estudiante' }
}
