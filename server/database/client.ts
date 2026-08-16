import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

/**
 * Connessione condivisa al database.
 *
 * Driver HTTP di Neon: ogni query e' una chiamata HTTP singola, senza pool di
 * connessioni da gestire. E' la scelta corretta per le funzioni serverless di
 * Vercel, che vivono troppo poco per ammortizzare un pool.
 */
const sql = neon(process.env.DATABASE_URL!)

export const db = drizzle(sql, { schema })
