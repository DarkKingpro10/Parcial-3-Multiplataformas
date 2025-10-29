import { describe, it, expect, beforeEach, vi } from 'vitest'

// Reusar el mock definido en CourseDAO.test mediante el mismo módulo
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

import { StudentDAO } from '../StudentDAO'

const getDb = async () => {
  const mod: any = await import('../../lib/supabaseClient')
  return mod.__mockDb as { courses: any[]; students: any[] }
}

describe('StudentDAO', () => {
  beforeEach(async () => {
    const db = await getDb()
    db.students.length = 0
  })

  it('list y findByUserId con datos válidos', async () => {
    // seed usando la API mock: insert en tabla students
    const db = await getDb()
    db.students.push({
      id: '11111111-1111-4111-aaaa-aaaaaaaaaaaa',
      user_id: '22222222-2222-4222-bbbb-bbbbbbbbbbbb',
      student_code: 'A001',
      major: 'Sistemas',
      semester: 3,
      created_at: new Date().toISOString(),
      user: { id: '22222222-2222-4222-bbbb-bbbbbbbbbbbb', email: 'a@a.com', full_name: 'Ana', role: 'estudiante' },
    })

    const list = await StudentDAO.list()
    expect(list.length).toBe(1)

    const found = await StudentDAO.findByUserId('22222222-2222-4222-bbbb-bbbbbbbbbbbb')
    expect(found?.student_code).toBe('A001')
  })

  it('remove elimina por id y list queda vacío', async () => {
    const db = await getDb()
    db.students.push({
      id: '33333333-3333-4333-cccc-cccccccccccc',
      user_id: '44444444-4444-4444-dddd-dddddddddddd',
      student_code: 'B002',
      major: 'Industrial',
      semester: 2,
      created_at: new Date().toISOString(),
    })

    await StudentDAO.remove('33333333-3333-4333-cccc-cccccccccccc')
    const list = await StudentDAO.list()
    expect(list.length).toBe(0)
  })

  it('manejo de errores: list propaga error de supabase', async () => {
    const mod: any = await import('../../lib/supabaseClient')
    const originalFrom = mod.supabase.from
    mod.supabase.from = () => ({
      select() {
        return { order: () => Promise.resolve({ data: null, error: new Error('fail') }) }
      },
    })

    await expect(StudentDAO.list()).rejects.toThrow('fail')
    mod.supabase.from = originalFrom
  })
})
