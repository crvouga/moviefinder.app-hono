import { Database } from 'bun:sqlite'

const dbPath = process.env.DATABASE_PATH ?? './app.db'

export const db = new Database(dbPath, { create: true })
