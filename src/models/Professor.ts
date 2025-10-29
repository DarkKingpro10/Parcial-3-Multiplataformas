import { z } from 'zod'

export const ProfessorCreateSchema = z.object({
  email: z.string().email('Email inválido'),
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  department: z.string().min(2, 'Departamento requerido'),
  academic_title: z.string().min(2, 'Título académico requerido'),
})

export const ProfessorUpdateSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  department: z.string().min(2, 'Departamento requerido').optional(),
  academic_title: z.string().min(2, 'Título académico requerido').optional(),
}).refine((o)=>Object.keys(o).length>0,{message:'No hay cambios para actualizar'})

export type Professor = {
  id: string
  user_id: string
  department: string
  academic_title: string
  created_at?: string
  user?: { id: string; email: string; full_name: string; role: 'admin'|'profesor'|'estudiante' }
}
