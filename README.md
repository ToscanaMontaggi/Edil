# Gestionale Dinelli Srl

Gestionale interno per la gestione di cantieri, operai, ore, costi e fatture.

Al momento **non c'è nessun backend collegato**: i dati sono generati in locale
all'avvio. L'interfaccia è completa e navigabile, e il collegamento a Firebase
riguarderà un solo file.

```bash
npm install
npm run dev
```

Accesso dimostrativo: qualunque email valida con una password di almeno sei
caratteri.

---

## Come è fatto

Le dipendenze puntano tutte verso l'interno: le pagine conoscono gli store, gli
store conoscono le porte, le porte non conoscono nessuno. L'infrastruttura sta
fuori e si sostituisce senza toccare il resto.

```
app/
├── core/                     regole di business, zero dipendenze da framework
│   ├── domain/
│   │   ├── value-objects/    Money, Duration, DateKey
│   │   ├── entities/         Client, Employee, Site, Worklog, Expense, Invoice
│   │   └── services/         calcolo costi, consuntivi, aggregazioni
│   └── ports/                interfacce dei repository e dell'autenticazione
│
├── infrastructure/
│   └── memory/               implementazione finta + dati dimostrativi
│
├── features/                 logica delle singole schermate
├── stores/                   stato Pinia
├── components/               componenti riutilizzabili
├── composables/              formattazione, notifiche, dialog CRUD
├── pages/ layouts/ middleware/
```

### Le tre decisioni che contano

**Gli importi sono interi.** I soldi si rappresentano in centesimi e le ore in
minuti, mai con la virgola. Sommare centinaia di costi in euro con i decimali
produce scostamenti di qualche centesimo che poi non fanno quadrare i
consuntivi. Vedi `core/domain/value-objects/money.ts`.

**Le ore congelano il costo.** Ogni riga di ore copia dentro di sé la tariffa
dell'operaio valida quel giorno, invece di puntarci. Se domani aumenti la paga a
un operaio, i consuntivi dei cantieri già chiusi restano identici a ieri, perché
quel lavoro è costato quello che è costato. Vedi `entities/worklog.ts` e
`services/labor-cost.ts`.

**Le date sono stringhe.** `"2026-08-15"`, non `Date`. Ordinabili, filtrabili
con `>=` e `<=`, e soprattutto senza fuso orario: una giornata di cantiere è un
giorno di calendario, non un istante. Non si usa mai `toISOString()`, che
convertendo in UTC farebbe finire al giorno prima le registrazioni serali.

### Riuso

- `defineCrudStore` — un solo store CRUD per tutte le entità, estendibile per i
  casi particolari (inserimento massivo ore, riordino fasi)
- `useCrudDialog` — apertura, salvataggio ed eliminazione dei form di anagrafica
- `AppDataTable`, `AppFormDialog`, `AppStatCard`, `AppChart` — involucri sottili
  su PrimeVue che fissano una volta sola le scelte comuni

---

## Collegare Firebase

Serve creare `app/infrastructure/firebase/` con la stessa firma già usata dai
mock, e cambiare **una riga** in `app/plugins/01.data-source.ts`:

```ts
const dataSource = createFirebaseDataSource()  // al posto di createMemoryDataSource()
```

Store, componenti e pagine non cambiano: conoscono solo l'interfaccia
`DataSource` definita in `core/ports/`.

### Cosa sapere prima

Autenticazione, Firestore e Hosting rientrano nel piano Spark gratuito.
**Cloud Storage no**: dal 3 febbraio 2026 creare un bucket richiede un account
di fatturazione collegato, quindi il piano Blaze. Serve solo per gli allegati
(documenti degli operai, foto, PDF delle fatture), che non sono nella prima
versione.

### Aggregati

I consuntivi sono calcolati in memoria dai servizi di dominio. Con Firestore
vanno precalcolati da una Cloud Function su `sites/{id}/totals` e
`aggregates/{YYYY-MM}`: leggere tutte le righe ore dal client per disegnare la
dashboard diventa lento e costoso già dal secondo anno. Le funzioni
`calculateSiteSummary` e `calculatePeriodTotals` producono già la forma esatta
che dovranno avere quei documenti, quindi si spostano dentro la Function senza
riscriverle e le pagine non se ne accorgono.

### Query

I filtri dei repository finti sono scritti in modo da corrispondere a query
Firestore realmente eseguibili — uguaglianza su un campo, oppure intervallo sul
campo data — per non costruire l'interfaccia su ricerche che il database poi non
saprebbe fare senza scaricare l'intera collection.

---

## Comandi

```bash
npm run dev         # sviluppo
npm run typecheck   # controllo dei tipi
npm run generate    # build statica in .output/public
```

Il deploy su Firebase Hosting è il caricamento del contenuto di
`.output/public`.

---

## Da fare

- Collegamento a Firebase (Auth, Firestore, security rules)
- Cloud Function per gli aggregati
- Esportazione PDF ed Excel dei report
- Allegati ai costi e ai documenti degli operai, con scadenze e semaforo
- PWA installabile e modalità offline

I report e gli allegati conviene farli **dopo** aver usato l'applicazione per un
mese vero: costruirli adesso su dati finti significherebbe rifarli quando sarà
chiaro quali colonne servono davvero.
