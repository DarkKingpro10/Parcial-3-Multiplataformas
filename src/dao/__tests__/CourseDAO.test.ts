import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock de Supabase con estado en memoria
vi.mock('../../lib/supabaseClient', () => {
  type TableName = 'courses' | 'students'
  const db: Record<TableName, any[]> = { courses: [], students: [] }

  const genId = () => {
    const rand = () => Math.random().toString(16).slice(2).padEnd(12, '0').slice(0, 12)
    return `00000000-0000-4000-${rand().slice(0, 4)}-${rand()}`
  }

  const api = {
    from(table: TableName) {
      const tableArr = db[table]
      return {
        select(_fields?: string) {
          return {
            order(_field: string, opts?: { ascending?: boolean }) {
              const asc = opts?.ascending ?? true
              const sorted = [...tableArr].sort((a, b) => (a.created_at > b.created_at ? 1 : -1) * (asc ? 1 : -1))
              return Promise.resolve({ data: sorted, error: null })
            },
            eq(field: string, value: any) {
              const filtered = tableArr.filter((r) => r[field] === value)
              return {
                maybeSingle() {
                  return Promise.resolve({ data: filtered[0] ?? null, error: null })
                },
                select() {
                  return {
                    single() {
                      return Promise.resolve({ data: filtered[0] ?? null, error: null })
                    },
                  }
                },
              }
            },
            maybeSingle() {
              return Promise.resolve({ data: tableArr[0] ?? null, error: null })
            },
            single() {
              return Promise.resolve({ data: tableArr[0] ?? null, error: null })
            },
          }
        },
        insert(payload: any) {
          const row = { id: genId(), created_at: new Date().toISOString(), ...payload }
          tableArr.push(row)
          return {
            select() {
              return {
                single() {
                  return Promise.resolve({ data: row, error: null })
                },
              }
            },
          }
        },
        update(patch: any) {
          return {
            eq(field: string, value: any) {
              const idx = tableArr.findIndex((r) => r[field] === value)
              if (idx >= 0) tableArr[idx] = { ...tableArr[idx], ...patch }
              const row = idx >= 0 ? tableArr[idx] : null
              return {
                select() {
                  return {
                    single() {
                      return Promise.resolve({ data: row, error: null })
                    },
                  }
                },
              }
            },
          }
        },
        delete() {
          return {
            eq(field: string, value: any) {
              const idx = tableArr.findIndex((r) => r[field] === value)
              if (idx >= 0) tableArr.splice(idx, 1)
              return Promise.resolve({ error: null })
            },
          }
        },
      }
    },
  }

  return { supabase: api, __mockDb: db }
})

import { CourseDAO } from '../CourseDAO'
import { CourseCreateSchema } from '../../models/Course'

// Acceso al DB mock para reiniciar estado entre tests
const getDb = async () => {
  const mod: any = await import('../../lib/supabaseClient')
  return mod.__mockDb as { courses: any[]; students: any[] }
}

describe('CourseDAO', () => {
  beforeEach(async () => {
    const db = await getDb()
    db.courses.length = 0
  })

  it('valida schema CourseCreateSchema con entradas válidas e inválidas', () => {
    // válido
    const valid = { name: 'Algebra', credits: 4, professor_id: null }
    expect(() => CourseCreateSchema.parse(valid)).not.toThrow()

    // inválido nombre
    expect(() => CourseCreateSchema.parse({ name: 'A', credits: 3, professor_id: null })).toThrow()

    // inválido créditos
    expect(() => CourseCreateSchema.parse({ name: 'OK', credits: -1, professor_id: null })).toThrow()
  })

  it('CRUD feliz: create -> list -> update -> remove', async () => {
    // create
    const created = await CourseDAO.create({ name: 'Programación', credits: 5, professor_id: null })
    expect(created.id).toBeTypeOf('string')
    expect(created.name).toBe('Programación')

    // list (ordenado desc por created_at)
    const list1 = await CourseDAO.list()
    expect(list1.length).toBe(1)

    // update
    const updated = await CourseDAO.update(created.id, { name: 'Programación I' })
    expect(updated.name).toBe('Programación I')

    // remove
    await CourseDAO.remove(created.id)
    const list2 = await CourseDAO.list()
    expect(list2.length).toBe(0)
  })

  it('manejo de errores: create propaga error de supabase', async () => {
    // Fuerza un error sólo una vez en insert
    const mod: any = await import('../../lib/supabaseClient')
    const originalFrom = mod.supabase.from
    mod.supabase.from = (table: any) => {
      const builder = originalFrom(table)
      return {
        ...builder,
        insert() {
          return {
            select() {
              return { single: () => Promise.resolve({ data: null, error: new Error('DB down') }) }
            },
          }
        },
      }
    }

    await expect(CourseDAO.create({ name: 'X', credits: 1, professor_id: null })).rejects.toThrow('DB down')

    // restaurar
    mod.supabase.from = originalFrom
  })
})
