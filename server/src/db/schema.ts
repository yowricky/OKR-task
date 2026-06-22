import { pgTable, uuid, varchar, text, integer, real, timestamp, pgEnum, boolean } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'worker']);
export const taskStatusEnum = pgEnum('task_status', ['pending', 'in_progress', 'completed', 'accepted']);
export const priorityEnum = pgEnum('priority', ['high', 'medium', 'low']);
export const eventTypeEnum = pgEnum('event_type', ['event', 'task']);
export const riskLevelEnum = pgEnum('risk_level', ['high', 'medium', 'low']);
export const riskStatusEnum = pgEnum('risk_status', ['open', 'investigating', 'resolved']);

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  parentId: uuid('parent_id'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  account: varchar('account', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 200 }).notNull(),
  passwordHash: varchar('password_hash', { length: 200 }).notNull(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  role: userRoleEnum('role').notNull().default('worker'),
  skillTags: text('skill_tags').array(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const objectives = pgTable('objectives', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  period: varchar('period', { length: 20 }).notNull(),
  periodLabel: varchar('period_label', { length: 100 }).notNull(),
  weight: real('weight').default(1),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const keyResults = pgTable('key_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  objectiveId: uuid('objective_id').notNull().references(() => objectives.id),
  targetValue: real('target_value').notNull(),
  currentValue: real('current_value').default(0),
  unit: varchar('unit', { length: 50 }).notNull(),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  progress: real('progress').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  status: taskStatusEnum('status').notNull().default('pending'),
  priority: priorityEnum('priority').notNull().default('medium'),
  planStartDate: timestamp('plan_start_date'),
  dueDate: timestamp('due_date'),
  actualEndDate: timestamp('actual_end_date'),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  krId: uuid('kr_id').references(() => keyResults.id),
  parentId: uuid('parent_id'),
  projectId: uuid('project_id'),
  tags: text('tags').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const calendarEvents = pgTable('calendar_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  type: eventTypeEnum('type').notNull().default('event'),
  taskId: uuid('task_id').references(() => tasks.id),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  isAllDay: boolean('is_all_day').default(false),
  recurrence: text('recurrence'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const riskItems = pgTable('risk_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => tasks.id),
  level: riskLevelEnum('level').notNull(),
  description: text('description').notNull(),
  rootCause: text('root_cause'),
  suggestedAction: text('suggested_action'),
  status: riskStatusEnum('status').notNull().default('open'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
