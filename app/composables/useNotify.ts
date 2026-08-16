/**
 * Notifiche e conferme.
 *
 * Incapsula Toast e ConfirmDialog di PrimeVue dietro poche funzioni con testi
 * gia' in italiano. I componenti chiamano `notify.saved()` invece di ripetere
 * ogni volta severita', titolo e durata: i messaggi restano coerenti in tutta
 * l'applicazione e si cambiano da un punto solo.
 */
export function useNotify() {
  const toast = useToast()

  return {
    saved(detail = 'Modifiche salvate.') {
      toast.add({ severity: 'success', summary: 'Fatto', detail, life: 2600 })
    },

    deleted(detail = 'Elemento eliminato.') {
      toast.add({ severity: 'success', summary: 'Eliminato', detail, life: 2600 })
    },

    error(detail = 'Operazione non riuscita. Riprova.') {
      toast.add({ severity: 'error', summary: 'Errore', detail, life: 5000 })
    },

    info(detail: string, summary = 'Informazione') {
      toast.add({ severity: 'info', summary, detail, life: 3200 })
    },

    warn(detail: string, summary = 'Attenzione') {
      toast.add({ severity: 'warn', summary, detail, life: 4000 })
    },
  }
}

export interface ConfirmDeleteOptions {
  /** Cosa si sta per eliminare, gia' scritto per esteso: "il cantiere Villa Bianchi". */
  what: string
  /** Avviso aggiuntivo quando l'eliminazione trascina con se' altri dati. */
  consequence?: string
}

/**
 * Chiede conferma prima di un'eliminazione.
 * Ritorna una promessa che si risolve solo se l'utente conferma, cosi' chi
 * chiama scrive `if (await confirmDelete(...))` invece di gestire callback.
 */
export function useConfirmDelete() {
  const confirm = useConfirm()

  return function confirmDelete(options: ConfirmDeleteOptions): Promise<boolean> {
    return new Promise((resolve) => {
      confirm.require({
        header: 'Confermi eliminazione?',
        message: options.consequence
          ? `Stai per eliminare ${options.what}. ${options.consequence}`
          : `Stai per eliminare ${options.what}. L'operazione non si puo' annullare.`,
        icon: 'pi pi-exclamation-triangle',
        rejectProps: { label: 'Annulla', severity: 'secondary', outlined: true },
        acceptProps: { label: 'Elimina', severity: 'danger' },
        accept: () => resolve(true),
        reject: () => resolve(false),
        onHide: () => resolve(false),
      })
    })
  }
}
