import { bigint, boolean, date, index, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

/**
 * Schema Postgres.
 *
 * Una tabella per entita' del dominio (`app/core/domain`), con gli stessi nomi
 * di campo in camelCase: Drizzle mappa automaticamente verso le colonne
 * snake_case sottostanti, quindi le righe che tornano dalle query hanno gia'
 * la forma delle interfacce di dominio, senza bisogno di un livello di
 * traduzione manuale.
 *
 * Gli importi sono sempre `bigint` in centesimi (mai `numeric`/float), le date
 * sono `date` in formato "YYYY-MM-DD", gli audit field sono `timestamptz`.
 */

export const clients = pgTable('clients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  vatNumber: text('vat_number').notNull().default(''),
  taxCode: text('tax_code').notNull().default(''),
  address: text('address').notNull().default(''),
  city: text('city').notNull().default(''),
  province: text('province').notNull().default(''),
  postalCode: text('postal_code').notNull().default(''),
  email: text('email').notNull().default(''),
  phone: text('phone').notNull().default(''),
  contactName: text('contact_name').notNull().default(''),
  notes: text('notes').notNull().default(''),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const employees = pgTable('employees', {
  id: text('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  taxCode: text('tax_code').notNull().default(''),
  phone: text('phone').notNull().default(''),
  email: text('email').notNull().default(''),
  hireDate: date('hire_date').notNull(),
  endDate: date('end_date'),
  qualification: text('qualification').notNull().default(''),
  level: text('level').notNull(),
  contract: text('contract').notNull(),
  status: text('status').notNull(),
  rates: jsonb('rates').notNull().default([]),
  notes: text('notes').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const sites = pgTable('sites', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id),
  code: text('code').notNull(),
  name: text('name').notNull(),
  address: text('address').notNull().default(''),
  city: text('city').notNull().default(''),
  province: text('province').notNull().default(''),
  budgetCents: bigint('budget_cents', { mode: 'number' }).notNull().default(0),
  startDate: date('start_date').notNull(),
  expectedEndDate: date('expected_end_date'),
  actualEndDate: date('actual_end_date'),
  status: text('status').notNull(),
  notes: text('notes').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index('sites_client_id_idx').on(table.clientId),
])

export const sitePhases = pgTable('site_phases', {
  id: text('id').primaryKey(),
  siteId: text('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  order: integer('order').notNull().default(0),
  budgetCents: bigint('budget_cents', { mode: 'number' }),
  completed: boolean('completed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index('site_phases_site_id_idx').on(table.siteId),
])

export const worklogs = pgTable('worklogs', {
  id: text('id').primaryKey(),
  date: date('date').notNull(),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  siteId: text('site_id').notNull().references(() => sites.id),
  phaseId: text('phase_id').references(() => sitePhases.id),
  ordinaryMinutes: integer('ordinary_minutes').notNull().default(0),
  overtimeMinutes: integer('overtime_minutes').notNull().default(0),
  travelAllowance: boolean('travel_allowance').notNull().default(false),
  notes: text('notes').notNull().default(''),
  rate: jsonb('rate').notNull(),
  laborCostCents: bigint('labor_cost_cents', { mode: 'number' }).notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index('worklogs_site_id_idx').on(table.siteId),
  index('worklogs_employee_id_idx').on(table.employeeId),
  index('worklogs_date_idx').on(table.date),
])

export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  date: date('date').notNull(),
  siteId: text('site_id').notNull().references(() => sites.id),
  phaseId: text('phase_id').references(() => sitePhases.id),
  category: text('category').notNull(),
  description: text('description').notNull().default(''),
  amountCents: bigint('amount_cents', { mode: 'number' }).notNull().default(0),
  supplier: text('supplier').notNull().default(''),
  documentRef: text('document_ref').notNull().default(''),
  attachments: jsonb('attachments').notNull().default([]),
  notes: text('notes').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index('expenses_site_id_idx').on(table.siteId),
  index('expenses_date_idx').on(table.date),
])

export const invoices = pgTable('invoices', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id),
  siteId: text('site_id').references(() => sites.id),
  number: text('number').notNull(),
  date: date('date').notNull(),
  dueDate: date('due_date'),
  type: text('type').notNull(),
  description: text('description').notNull().default(''),
  amountCents: bigint('amount_cents', { mode: 'number' }).notNull().default(0),
  vatRate: integer('vat_rate').notNull().default(22),
  paidDate: date('paid_date'),
  notes: text('notes').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index('invoices_client_id_idx').on(table.clientId),
  index('invoices_site_id_idx').on(table.siteId),
])
