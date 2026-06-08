import type { DatabaseMigration } from './database-migration'

/**
 * Better Auth core tables (user, session, account, verification) plus the
 * phoneNumber plugin fields.
 *
 * Mirrors the column types Better Auth's Kysely PostgreSQL adapter would generate
 * (string -> TEXT, boolean -> BOOLEAN, date -> TIMESTAMPTZ, references -> TEXT FK,
 * required -> NOT NULL). createdAt/updatedAt carry a NOW() default as a safety
 * net; Better Auth supplies explicit values on write.
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
  m.col('user', 'emailVerified', 'BOOLEAN NOT NULL DEFAULT FALSE')
  m.col('user', 'image', 'TEXT')
  m.col('user', 'createdAt', 'TIMESTAMPTZ NOT NULL DEFAULT NOW()')
  m.col('user', 'updatedAt', 'TIMESTAMPTZ NOT NULL DEFAULT NOW()')
  m.col('user', 'phoneNumber', 'TEXT UNIQUE')
  m.col('user', 'phoneNumberVerified', 'BOOLEAN')

  // session
  m.table('session')
  m.col('session', 'id', 'TEXT PRIMARY KEY NOT NULL')
  m.col('session', 'expiresAt', 'TIMESTAMPTZ NOT NULL')
  m.col('session', 'token', 'TEXT NOT NULL UNIQUE')
  m.col('session', 'createdAt', 'TIMESTAMPTZ NOT NULL DEFAULT NOW()')
  m.col('session', 'updatedAt', 'TIMESTAMPTZ NOT NULL DEFAULT NOW()')
  m.col('session', 'ipAddress', 'TEXT')
  m.col('session', 'userAgent', 'TEXT')
  m.col(
    'session',
    'userId',
    'TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE',
  )

  // account
  m.table('account')
  m.col('account', 'id', 'TEXT PRIMARY KEY NOT NULL')
  m.col('account', 'accountId', 'TEXT NOT NULL')
  m.col('account', 'providerId', 'TEXT NOT NULL')
  m.col(
    'account',
    'userId',
    'TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE',
  )
  m.col('account', 'accessToken', 'TEXT')
  m.col('account', 'refreshToken', 'TEXT')
  m.col('account', 'idToken', 'TEXT')
  m.col('account', 'accessTokenExpiresAt', 'TIMESTAMPTZ')
  m.col('account', 'refreshTokenExpiresAt', 'TIMESTAMPTZ')
  m.col('account', 'scope', 'TEXT')
  m.col('account', 'password', 'TEXT')
  m.col('account', 'createdAt', 'TIMESTAMPTZ NOT NULL DEFAULT NOW()')
  m.col('account', 'updatedAt', 'TIMESTAMPTZ NOT NULL DEFAULT NOW()')

  // verification
  m.table('verification')
  m.col('verification', 'id', 'TEXT PRIMARY KEY NOT NULL')
  m.col('verification', 'identifier', 'TEXT NOT NULL')
  m.col('verification', 'value', 'TEXT NOT NULL')
  m.col('verification', 'expiresAt', 'TIMESTAMPTZ NOT NULL')
  m.col('verification', 'createdAt', 'TIMESTAMPTZ NOT NULL DEFAULT NOW()')
  m.col('verification', 'updatedAt', 'TIMESTAMPTZ NOT NULL DEFAULT NOW()')

  m.index('session_userId_idx', 'session ("userId")')
  m.index('account_userId_idx', 'account ("userId")')
  m.index('verification_identifier_idx', 'verification (identifier)')
}
