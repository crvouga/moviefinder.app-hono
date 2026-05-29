import type { DatabaseMigration } from '../db-migrate/database-migration'

/**
 * Better Auth core tables (user, session, account, verification) plus the
 * phoneNumber plugin fields, registered in the app's migration DSL so the whole
 * schema is created by the single startup migrate() pass.
 *
 * Mirrors the column types Better Auth's Kysely SQLite adapter would generate
 * (string -> TEXT, boolean -> INTEGER, date -> DATE, references -> TEXT FK,
 * required -> NOT NULL). createdAt/updatedAt carry a CURRENT_TIMESTAMP default
 * as a safety net; Better Auth supplies explicit values on write.
 *
 * Pinned to better-auth@1.6.x. Re-verify against `@better-auth/cli generate`
 * when bumping the major/minor version.
 */
export function registerAuthSchema(m: DatabaseMigration): void {
  // user (must be declared before session/account for the FK references).
  m.table('user')
  m.col('user', 'id', 'TEXT PRIMARY KEY NOT NULL')
  m.col('user', 'name', 'TEXT NOT NULL')
  m.col('user', 'email', 'TEXT NOT NULL UNIQUE')
  m.col('user', 'emailVerified', 'INTEGER NOT NULL DEFAULT 0')
  m.col('user', 'image', 'TEXT')
  m.col('user', 'createdAt', 'DATE NOT NULL DEFAULT CURRENT_TIMESTAMP')
  m.col('user', 'updatedAt', 'DATE NOT NULL DEFAULT CURRENT_TIMESTAMP')
  m.col('user', 'phoneNumber', 'TEXT UNIQUE')
  m.col('user', 'phoneNumberVerified', 'INTEGER')

  // session
  m.table('session')
  m.col('session', 'id', 'TEXT PRIMARY KEY NOT NULL')
  m.col('session', 'expiresAt', 'DATE NOT NULL')
  m.col('session', 'token', 'TEXT NOT NULL UNIQUE')
  m.col('session', 'createdAt', 'DATE NOT NULL DEFAULT CURRENT_TIMESTAMP')
  m.col('session', 'updatedAt', 'DATE NOT NULL DEFAULT CURRENT_TIMESTAMP')
  m.col('session', 'ipAddress', 'TEXT')
  m.col('session', 'userAgent', 'TEXT')
  m.col(
    'session',
    'userId',
    'TEXT NOT NULL REFERENCES user (id) ON DELETE CASCADE',
  )

  // account
  m.table('account')
  m.col('account', 'id', 'TEXT PRIMARY KEY NOT NULL')
  m.col('account', 'accountId', 'TEXT NOT NULL')
  m.col('account', 'providerId', 'TEXT NOT NULL')
  m.col(
    'account',
    'userId',
    'TEXT NOT NULL REFERENCES user (id) ON DELETE CASCADE',
  )
  m.col('account', 'accessToken', 'TEXT')
  m.col('account', 'refreshToken', 'TEXT')
  m.col('account', 'idToken', 'TEXT')
  m.col('account', 'accessTokenExpiresAt', 'DATE')
  m.col('account', 'refreshTokenExpiresAt', 'DATE')
  m.col('account', 'scope', 'TEXT')
  m.col('account', 'password', 'TEXT')
  m.col('account', 'createdAt', 'DATE NOT NULL DEFAULT CURRENT_TIMESTAMP')
  m.col('account', 'updatedAt', 'DATE NOT NULL DEFAULT CURRENT_TIMESTAMP')

  // verification
  m.table('verification')
  m.col('verification', 'id', 'TEXT PRIMARY KEY NOT NULL')
  m.col('verification', 'identifier', 'TEXT NOT NULL')
  m.col('verification', 'value', 'TEXT NOT NULL')
  m.col('verification', 'expiresAt', 'DATE NOT NULL')
  m.col('verification', 'createdAt', 'DATE NOT NULL DEFAULT CURRENT_TIMESTAMP')
  m.col('verification', 'updatedAt', 'DATE NOT NULL DEFAULT CURRENT_TIMESTAMP')

  m.index('session_userId_idx', 'session (userId)')
  m.index('account_userId_idx', 'account (userId)')
  m.index('verification_identifier_idx', 'verification (identifier)')
}
