import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import type { AtsReview, FitReview } from '../features/resume/review'
import { jobStatuses } from '../lib/job-status'

export const jobStatus = pgEnum('job_status', jobStatuses)

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 320 }).notNull(),
    name: varchar('name', { length: 120 }),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    headline: varchar('headline', { length: 160 }),
    location: varchar('location', { length: 160 }),
    linkedinUrl: text('linkedin_url'),
    githubUrl: text('github_url'),
    portfolioLinks: jsonb('portfolio_links').$type<{ label: string; url: string }[]>().notNull().default([]),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex('users_email_unique').on(table.email)],
)

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index('sessions_user_idx').on(table.userId)])

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  password: text('password'),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index('accounts_user_idx').on(table.userId),
  uniqueIndex('accounts_provider_identity_unique').on(table.providerId, table.accountId),
])

export const verifications = pgTable('verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index('verifications_identifier_idx').on(table.identifier)])

export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 200 }).notNull(),
    company: varchar('company', { length: 200 }).notNull(),
    location: varchar('location', { length: 200 }),
    url: text('url'),
    normalizedUrl: text('normalized_url'),
    description: text('description'),
    status: jobStatus('status').notNull().default('saved'),
    notes: text('notes'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('jobs_user_id_idx').on(table.userId),
    index('jobs_status_idx').on(table.status),
    uniqueIndex('jobs_user_normalized_url_unique').on(table.userId, table.normalizedUrl),
  ],
)

export const resumes = pgTable('resumes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  filename: varchar('filename', { length: 255 }).notNull(),
  content: text('content').notNull(),
  review: jsonb('review').$type<AtsReview>(),
  createdAt: createdAt(),
})

export const jobReviews = pgTable('job_reviews', {
  resumeId: uuid('resume_id').notNull().references(() => resumes.id, { onDelete: 'cascade' }),
  jobId: uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  review: jsonb('review').$type<FitReview>().notNull(),
}, (table) => [
  primaryKey({ columns: [table.resumeId, table.jobId] }),
  index('job_reviews_job_idx').on(table.jobId),
])

export const usersRelations = relations(users, ({ many }) => ({
  jobs: many(jobs),
}))

export const jobsRelations = relations(jobs, ({ one }) => ({
  owner: one(users, {
    fields: [jobs.userId],
    references: [users.id],
  }),
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Job = typeof jobs.$inferSelect
export type NewJob = typeof jobs.$inferInsert
