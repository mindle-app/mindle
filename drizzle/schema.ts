import { sql } from 'drizzle-orm'
import {
  sqliteTable,
  text,
  numeric,
  integer,
  uniqueIndex,
  index,
  blob,
} from 'drizzle-orm/sqlite-core'

export const _prisma_migrations = sqliteTable('_prisma_migrations', {
  id: text('id').primaryKey().notNull(),
  checksum: text('checksum').notNull(),
  finished_at: numeric('finished_at'),
  migration_name: text('migration_name').notNull(),
  logs: text('logs'),
  rolled_back_at: numeric('rolled_back_at'),
  started_at: numeric('started_at')
    .default(sql`(current_timestamp)`)
    .notNull(),
  applied_steps_count: integer('applied_steps_count').default(0).notNull(),
})

export const User = sqliteTable(
  'User',
  {
    id: text('id').primaryKey().notNull(),
    email: text('email').notNull(),
    username: text('username').notNull(),
    name: text('name'),
    createdAt: numeric('createdAt')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: numeric('updatedAt').notNull(),
  },
  (table) => {
    return {
      username_key: uniqueIndex('User_username_key').on(table.username),
      email_key: uniqueIndex('User_email_key').on(table.email),
    }
  },
)

export const Note = sqliteTable(
  'Note',
  {
    id: text('id').primaryKey().notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    createdAt: numeric('createdAt')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: numeric('updatedAt').notNull(),
    ownerId: text('ownerId')
      .notNull()
      .references(() => User.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => {
    return {
      ownerId_updatedAt_idx: index('Note_ownerId_updatedAt_idx').on(
        table.ownerId,
        table.updatedAt,
      ),
      ownerId_idx: index('Note_ownerId_idx').on(table.ownerId),
    }
  },
)

export const NoteImage = sqliteTable(
  'NoteImage',
  {
    id: text('id').primaryKey().notNull(),
    altText: text('altText'),
    contentType: text('contentType').notNull(),
    blob: blob('blob').notNull(),
    createdAt: numeric('createdAt')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: numeric('updatedAt').notNull(),
    noteId: text('noteId')
      .notNull()
      .references(() => Note.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => {
    return {
      noteId_idx: index('NoteImage_noteId_idx').on(table.noteId),
    }
  },
)

export const UserImage = sqliteTable(
  'UserImage',
  {
    id: text('id').primaryKey().notNull(),
    altText: text('altText'),
    contentType: text('contentType').notNull(),
    blob: blob('blob').notNull(),
    createdAt: numeric('createdAt')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: numeric('updatedAt').notNull(),
    userId: text('userId')
      .notNull()
      .references(() => User.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => {
    return {
      userId_key: uniqueIndex('UserImage_userId_key').on(table.userId),
    }
  },
)

export const Password = sqliteTable(
  'Password',
  {
    hash: text('hash').notNull(),
    userId: text('userId')
      .notNull()
      .references(() => User.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => {
    return {
      userId_key: uniqueIndex('Password_userId_key').on(table.userId),
    }
  },
)

export const Session = sqliteTable(
  'Session',
  {
    id: text('id').primaryKey().notNull(),
    expirationDate: numeric('expirationDate').notNull(),
    createdAt: numeric('createdAt')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: numeric('updatedAt').notNull(),
    userId: text('userId')
      .notNull()
      .references(() => User.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => {
    return {
      userId_idx: index('Session_userId_idx').on(table.userId),
    }
  },
)

export const Permission = sqliteTable(
  'Permission',
  {
    id: text('id').primaryKey().notNull(),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    access: text('access').notNull(),
    description: text('description').default('').notNull(),
    createdAt: numeric('createdAt')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: numeric('updatedAt').notNull(),
  },
  (table) => {
    return {
      action_entity_access_key: uniqueIndex(
        'Permission_action_entity_access_key',
      ).on(table.action, table.entity, table.access),
    }
  },
)

export const Role = sqliteTable(
  'Role',
  {
    id: text('id').primaryKey().notNull(),
    name: text('name').notNull(),
    description: text('description').default('').notNull(),
    createdAt: numeric('createdAt')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: numeric('updatedAt').notNull(),
  },
  (table) => {
    return {
      name_key: uniqueIndex('Role_name_key').on(table.name),
    }
  },
)

export const Verification = sqliteTable(
  'Verification',
  {
    id: text('id').primaryKey().notNull(),
    createdAt: numeric('createdAt')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    type: text('type').notNull(),
    target: text('target').notNull(),
    secret: text('secret').notNull(),
    algorithm: text('algorithm').notNull(),
    digits: integer('digits').notNull(),
    period: integer('period').notNull(),
    charSet: text('charSet').notNull(),
    expiresAt: numeric('expiresAt'),
  },
  (table) => {
    return {
      target_type_key: uniqueIndex('Verification_target_type_key').on(
        table.target,
        table.type,
      ),
    }
  },
)

export const Connection = sqliteTable(
  'Connection',
  {
    id: text('id').primaryKey().notNull(),
    providerName: text('providerName').notNull(),
    providerId: text('providerId').notNull(),
    createdAt: numeric('createdAt')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: numeric('updatedAt').notNull(),
    userId: text('userId')
      .notNull()
      .references(() => User.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => {
    return {
      providerName_providerId_key: uniqueIndex(
        'Connection_providerName_providerId_key',
      ).on(table.providerName, table.providerId),
    }
  },
)

export const _PermissionToRole = sqliteTable(
  '_PermissionToRole',
  {
    A: text('A')
      .notNull()
      .references(() => Permission.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    B: text('B')
      .notNull()
      .references(() => Role.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => {
    return {
      B_idx: index('PermissionToRoleRoleIdx').on(table.B),
      AB_unique: uniqueIndex('_PermissionToRole_AB_unique').on(
        table.A,
        table.B,
      ),
    }
  },
)

export const _RoleToUser = sqliteTable(
  '_RoleToUser',
  {
    A: text('A')
      .notNull()
      .references(() => Role.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    B: text('B')
      .notNull()
      .references(() => User.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => {
    return {
      B_idx: index('RoleToUserUserIndex').on(table.B),
      AB_unique: uniqueIndex('_RoleToUser_AB_unique').on(table.A, table.B),
    }
  },
)

export type SelectNote = typeof Note.$inferSelect
