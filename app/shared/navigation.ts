/**
 * Voci di navigazione dell'applicazione.
 *
 * Un elenco unico consumato da tutti i punti che mostrano navigazione: barra
 * laterale, menu a scomparsa su telefono e griglia di icone della home.
 * Aggiungere un modulo significa aggiungere una riga qui, non modificare tre
 * componenti diversi e scoprire dopo una settimana che uno dei tre e' rimasto
 * indietro.
 */
export interface NavigationItem {
  label: string
  /** Descrizione mostrata sotto l'icona nella griglia della home. */
  description: string
  icon: string
  to: string
  /** Le voci principali compaiono anche nella barra inferiore del telefono. */
  primary?: boolean
}

export const NAVIGATION: readonly NavigationItem[] = [
  {
    label: 'Dashboard',
    description: 'Andamento generale e scadenze',
    icon: 'pi pi-chart-pie',
    to: '/',
    primary: true,
  },
  {
    label: 'Ore',
    description: 'Registrazione ore di cantiere',
    icon: 'pi pi-clock',
    to: '/ore',
    primary: true,
  },
  {
    label: 'Cantieri',
    description: 'Commesse, fasi e consuntivi',
    icon: 'pi pi-building-columns',
    to: '/cantieri',
    primary: true,
  },
  {
    label: 'Operai',
    description: 'Anagrafica e costi orari',
    icon: 'pi pi-users',
    to: '/operai',
    primary: true,
  },
  {
    label: 'Costi',
    description: 'Materiali, noleggi e subappalti',
    icon: 'pi pi-euro',
    to: '/costi',
  },
  {
    label: 'Spese fisse',
    description: 'Costi generali da ammortizzare sui cantieri',
    icon: 'pi pi-building',
    to: '/spese-fisse',
  },
  {
    label: 'Fatture',
    description: 'SAL, saldi e incassi',
    icon: 'pi pi-file-check',
    to: '/fatture',
  },
  {
    label: 'Clienti',
    description: 'Anagrafica committenti',
    icon: 'pi pi-id-card',
    to: '/clienti',
  },
  {
    label: 'Report',
    description: 'Consuntivi ed esportazioni',
    icon: 'pi pi-file-export',
    to: '/report',
  },
  {
    label: 'Impostazioni',
    description: 'Configurazione del gestionale',
    icon: 'pi pi-cog',
    to: '/impostazioni',
  },
]

/** Le voci che compaiono nella barra inferiore su telefono. */
export const PRIMARY_NAVIGATION = NAVIGATION.filter(item => item.primary)
