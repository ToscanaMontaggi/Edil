import type { Entity, EntityId } from './common'

export type ClientType = 'privato' | 'azienda' | 'pubblico'

export interface Client extends Entity {
  /** Ragione sociale per le aziende, nome e cognome per i privati. */
  name: string
  type: ClientType
  vatNumber: string
  taxCode: string
  address: string
  city: string
  province: string
  postalCode: string
  email: string
  phone: string
  /** Persona di riferimento con cui si parla in cantiere. */
  contactName: string
  notes: string
  active: boolean
}

export function clientAddressLine(client: Client): string {
  return [client.address, client.postalCode, client.city, client.province && `(${client.province})`]
    .filter(Boolean)
    .join(' ')
    .trim()
}

/** Identificativo fiscale da mostrare in lista: P.IVA se c'e', altrimenti CF. */
export function clientFiscalId(client: Client): string {
  return client.vatNumber || client.taxCode || '—'
}

export type ClientId = EntityId
