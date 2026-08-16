import { eq } from 'drizzle-orm'
import type { AnyPgTable } from 'drizzle-orm/pg-core'
import { db } from '../database/client'

/**
 * CRUD generico su una tabella Drizzle.
 *
 * Riflette lato server lo stesso pattern di `InMemoryRepository` lato client:
 * il CRUD si scrive una volta sola, le rotte specifiche aggiungono solo i
 * filtri che le riguardano.
 */
export function createTableRepository<Row extends { id: string }>(table: AnyPgTable & { id: any, updatedAt: any }) {
  return {
    async list(): Promise<Row[]> {
      return db.select().from(table as any) as unknown as Promise<Row[]>
    },

    async findById(id: string): Promise<Row | null> {
      const rows = await db.select().from(table as any).where(eq(table.id, id)) as unknown as Row[]
      return rows[0] ?? null
    },

    async create(draft: Record<string, unknown>): Promise<Row> {
      const now = new Date()
      const [row] = await db.insert(table as any).values({
        ...draft,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      }).returning() as unknown as Row[]
      return row!
    },

    async update(id: string, patch: Record<string, unknown>): Promise<Row> {
      const [row] = await db.update(table as any)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(table.id, id))
        .returning() as unknown as Row[]
      if (!row) {
        throw createError({ statusCode: 404, statusMessage: 'Elemento non trovato' })
      }
      return row
    },

    async remove(id: string): Promise<void> {
      const [row] = await db.delete(table as any).where(eq(table.id, id)).returning() as unknown as Row[]
      if (!row) {
        throw createError({ statusCode: 404, statusMessage: 'Elemento non trovato' })
      }
    },
  }
}
