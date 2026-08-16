import type { Cents } from '../value-objects/money'
import { Money } from '../value-objects/money'
import type { DateKey } from '../value-objects/date-key'
import { DateKeys } from '../value-objects/date-key'
import type { ClientId } from './client'
import type { Entity, EntityId, SelectOption } from './common'

/**
 * Tipo di documento emesso al cliente.
 * Il SAL (Stato Avanzamento Lavori) e' l'acconto tipico dell'edilizia: si
 * fattura a stati di avanzamento e non a fine lavori.
 */
export type InvoiceType = 'sal' | 'acconto' | 'saldo' | 'nota_credito'

export type InvoiceStatus = 'emessa' | 'incassata' | 'scaduta'

export interface Invoice extends Entity {
  clientId: ClientId
  /** Un documento e' quasi sempre legato a un cantiere, ma non e' obbligatorio. */
  siteId: EntityId | null
  number: string
  date: DateKey
  dueDate: DateKey | null
  type: InvoiceType
  description: string
  /** Imponibile. Il margine si calcola su questo, non sul totale con IVA. */
  amountCents: Cents
  /** Aliquota in percentuale: 22, 10, 4 per l'edilizia agevolata, 0 per reverse charge. */
  vatRate: number
  paidDate: DateKey | null
  notes: string
}

export type InvoiceId = EntityId

export function invoiceVatCents(invoice: Pick<Invoice, 'amountCents' | 'vatRate'>): Cents {
  return Money.multiply(invoice.amountCents, invoice.vatRate / 100)
}

export function invoiceTotalCents(invoice: Pick<Invoice, 'amountCents' | 'vatRate'>): Cents {
  return Money.add(invoice.amountCents, invoiceVatCents(invoice))
}

/**
 * Le note di credito valgono in negativo nei totali fatturato.
 * Si tiene il segno positivo nel dato e si inverte qui, cosi' l'importo
 * inserito nel form e' sempre un numero positivo.
 */
export function invoiceSignedAmount(invoice: Pick<Invoice, 'amountCents' | 'type'>): Cents {
  return invoice.type === 'nota_credito' ? Money.negate(invoice.amountCents) : invoice.amountCents
}

/**
 * Stato derivato, non salvato: dipende da oggi.
 * Salvarlo vorrebbe dire doverlo aggiornare ogni notte con un job.
 */
export function invoiceStatus(invoice: Invoice, today: DateKey = DateKeys.today()): InvoiceStatus {
  if (invoice.paidDate) return 'incassata'
  if (invoice.dueDate && invoice.dueDate < today) return 'scaduta'
  return 'emessa'
}

export function isInvoicePaid(invoice: Invoice): boolean {
  return invoice.paidDate !== null
}

export const INVOICE_TYPE_OPTIONS: SelectOption<InvoiceType>[] = [
  { label: 'SAL', value: 'sal' },
  { label: 'Acconto', value: 'acconto' },
  { label: 'Saldo', value: 'saldo' },
  { label: 'Nota di credito', value: 'nota_credito' },
]

export const INVOICE_STATUS_OPTIONS: SelectOption<InvoiceStatus>[] = [
  { label: 'Emessa', value: 'emessa', severity: 'info' },
  { label: 'Incassata', value: 'incassata', severity: 'success' },
  { label: 'Scaduta', value: 'scaduta', severity: 'danger' },
]

export const VAT_RATE_OPTIONS: SelectOption<number>[] = [
  { label: '22%  ordinaria', value: 22 },
  { label: '10%  ristrutturazione', value: 10 },
  { label: '4%  prima casa', value: 4 },
  { label: '0%  reverse charge', value: 0 },
]
