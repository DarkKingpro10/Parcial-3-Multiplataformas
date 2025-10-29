import { CourseDAO } from '../dao/CourseDAO';
import { CourseCreateSchema, CourseUpdateSchema } from '../models/Course';

export const CourseController = {
  async list() {
    return await CourseDAO.list();
  },
  async create(input: { name: string; credits: number; professor_id?: string | null }) {
    const parsed = CourseCreateSchema.safeParse(input)
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Datos inválidos')
    return await CourseDAO.create(parsed.data);
  },
  async update(id: string, patch: { name?: string; credits?: number; professor_id?: string | null }) {
    const parsed = CourseUpdateSchema.safeParse(patch)
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Datos inválidos')
    return await CourseDAO.update(id, parsed.data);
  },
  async remove(id: string) {
    await CourseDAO.remove(id);
  },
};
