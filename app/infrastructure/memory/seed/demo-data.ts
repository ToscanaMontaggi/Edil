import type {
  Client,
  DateKey,
  Employee,
  EmployeeRate,
  Expense,
  ExpenseCategory,
  FixedExpense,
  Invoice,
  ScheduleEntry,
  Site,
  SitePhase,
  Worklog,
} from '~/core/domain'
import {
  DEFAULT_SITE_PHASES,
  DateKeys,
  Duration,
  Money,
  MonthKeys,
  calculateLaborCost,
  rateAt,
  snapshotRate,
} from '~/core/domain'
import { EMPTY_RATE_SNAPSHOT } from '~/core/domain'
import { createRandom } from './random'

/**
 * Dati dimostrativi di un'impresa edile.
 *
 * Servono a vedere l'interfaccia con numeri credibili prima che esista il
 * backend: cantieri in stati diversi, ore di squadra su piu' mesi, costi
 * distribuiti sulle categorie e SAL gia' emessi. Quando si collega Firestore
 * questo file si cancella e basta, perche' nient'altro lo importa se non il
 * contenitore delle dipendenze.
 */

export interface DemoData {
  clients: Client[]
  employees: Employee[]
  sites: Site[]
  phases: SitePhase[]
  worklogs: Worklog[]
  schedule: ScheduleEntry[]
  expenses: Expense[]
  fixedExpenses: FixedExpense[]
  invoices: Invoice[]
}

const SEED = 20260815

function timestamps(): { createdAt: string, updatedAt: string } {
  const iso = new Date('2025-09-01T08:00:00.000Z').toISOString()
  return { createdAt: iso, updatedAt: iso }
}

// ---------------------------------------------------------------- clienti

function buildClients(): Client[] {
  const base = timestamps()
  return [
    {
      id: 'cli-1', ...base,
      name: 'Immobiliare Verdi Srl', type: 'azienda',
      vatNumber: '02451870983', taxCode: '02451870983',
      address: 'Via Mazzini 14', city: 'Brescia', province: 'BS', postalCode: '25121',
      email: 'amministrazione@immobiliareverdi.it', phone: '030 2451870',
      contactName: 'Ing. Paolo Verdi', notes: 'Pagamenti a 60 giorni data fattura.', active: true,
    },
    {
      id: 'cli-2', ...base,
      name: 'Comune di Castelnuovo', type: 'pubblico',
      vatNumber: '00512340172', taxCode: '00512340172',
      address: 'Piazza Municipio 1', city: 'Castelnuovo', province: 'BS', postalCode: '25014',
      email: 'lavoripubblici@comune.castelnuovo.bs.it', phone: '030 9871234',
      contactName: 'Geom. Franca Belotti', notes: 'Fatturazione elettronica PA, split payment.', active: true,
    },
    {
      id: 'cli-3', ...base,
      name: 'Bianchi Marco', type: 'privato',
      vatNumber: '', taxCode: 'BNCMRC78E12B157K',
      address: 'Via delle Rose 8', city: 'Rezzato', province: 'BS', postalCode: '25086',
      email: 'marco.bianchi78@gmail.com', phone: '335 4471290',
      contactName: 'Marco Bianchi', notes: 'Detrazione 50%, servono bonifici parlanti.', active: true,
    },
    {
      id: 'cli-4', ...base,
      name: 'Costruzioni Rossi SpA', type: 'azienda',
      vatNumber: '01887650170', taxCode: '01887650170',
      address: 'Via dell Industria 45', city: 'Montichiari', province: 'BS', postalCode: '25018',
      email: 'ufficio.tecnico@costruzionirossi.it', phone: '030 9612340',
      contactName: 'Geom. Sergio Rossi', notes: 'Lavoriamo in subappalto. Reverse charge.', active: true,
    },
    {
      id: 'cli-5', ...base,
      name: 'Condominio Via Roma 42', type: 'privato',
      vatNumber: '', taxCode: '98076540179',
      address: 'Via Roma 42', city: 'Brescia', province: 'BS', postalCode: '25122',
      email: 'studio.ferri@amministrazioni.it', phone: '030 3701122',
      contactName: 'Amm. Giulia Ferri', notes: 'Delibera assembleare per ogni variante.', active: true,
    },
  ]
}

// ---------------------------------------------------------------- operai

interface EmployeeSpec {
  id: string
  firstName: string
  lastName: string
  taxCode: string
  qualification: string
  level: Employee['level']
  contract: Employee['contract']
  status: Employee['status']
  hireDate: string
  hourlyEuro: number
  /** Aumento intervenuto durante il periodo, per mostrare lo storico tariffe. */
  raise?: { from: string, hourlyEuro: number }
}

const EMPLOYEE_SPECS: EmployeeSpec[] = [
  { id: 'emp-1', firstName: 'Mario', lastName: 'Rossi', taxCode: 'RSSMRA75L03B157X', qualification: 'Capo cantiere', level: '4', contract: 'indeterminato', status: 'attivo', hireDate: '2012-03-05', hourlyEuro: 33.5 },
  { id: 'emp-2', firstName: 'Giuseppe', lastName: 'Esposito', taxCode: 'SPSGPP82M14F839J', qualification: 'Muratore specializzato', level: '3', contract: 'indeterminato', status: 'attivo', hireDate: '2015-06-01', hourlyEuro: 29.2, raise: { from: '2026-01-01', hourlyEuro: 30.4 } },
  { id: 'emp-3', firstName: 'Luca', lastName: 'Ferrari', taxCode: 'FRRLCU88T22B157P', qualification: 'Carpentiere', level: '3', contract: 'indeterminato', status: 'attivo', hireDate: '2017-09-11', hourlyEuro: 28.8 },
  { id: 'emp-4', firstName: 'Antonio', lastName: 'Romano', taxCode: 'RMNNTN90A18F205Q', qualification: 'Muratore', level: '2', contract: 'indeterminato', status: 'attivo', hireDate: '2019-04-15', hourlyEuro: 26.1 },
  { id: 'emp-5', firstName: 'Stefano', lastName: 'Colombo', taxCode: 'CLMSFN85R09B157M', qualification: 'Gruista', level: '3', contract: 'indeterminato', status: 'attivo', hireDate: '2018-02-19', hourlyEuro: 29.6 },
  { id: 'emp-6', firstName: 'Nicola', lastName: 'Bruno', taxCode: 'BRNNCL95H27F839T', qualification: 'Manovale', level: '1', contract: 'determinato', status: 'attivo', hireDate: '2024-03-04', hourlyEuro: 23.4 },
  { id: 'emp-7', firstName: 'Alessandro', lastName: 'Ricci', taxCode: 'RCCLSN91D12B157L', qualification: 'Muratore', level: '2', contract: 'indeterminato', status: 'attivo', hireDate: '2020-10-05', hourlyEuro: 26.4, raise: { from: '2026-03-01', hourlyEuro: 27.5 } },
  { id: 'emp-8', firstName: 'Salvatore', lastName: 'Greco', taxCode: 'GRCSVT87P30F839V', qualification: 'Ferraiolo', level: '3', contract: 'indeterminato', status: 'attivo', hireDate: '2016-11-21', hourlyEuro: 29.0 },
  { id: 'emp-9', firstName: 'Davide', lastName: 'Marino', taxCode: 'MRNDVD04S15B157F', qualification: 'Apprendista muratore', level: '1', contract: 'apprendistato', status: 'attivo', hireDate: '2025-09-01', hourlyEuro: 19.8 },
  { id: 'emp-10', firstName: 'Ivan', lastName: 'Costa', taxCode: 'CSTVNI83B24F839H', qualification: 'Muratore', level: '2', contract: 'determinato', status: 'cessato', hireDate: '2023-05-02', hourlyEuro: 25.9 },
]

function buildEmployees(): Employee[] {
  const base = timestamps()

  return EMPLOYEE_SPECS.map((spec) => {
    const rates: EmployeeRate[] = [{
      validFrom: spec.hireDate as DateKey,
      hourlyCostCents: Money.fromEuro(spec.hourlyEuro),
      overtimeMultiplier: 1.3,
      travelAllowanceCents: Money.fromEuro(spec.level === '4' ? 22 : 18),
    }]

    if (spec.raise) {
      rates.unshift({
        validFrom: spec.raise.from as DateKey,
        hourlyCostCents: Money.fromEuro(spec.raise.hourlyEuro),
        overtimeMultiplier: 1.3,
        travelAllowanceCents: Money.fromEuro(spec.level === '4' ? 22 : 18),
      })
    }

    return {
      id: spec.id, ...base,
      firstName: spec.firstName,
      lastName: spec.lastName,
      taxCode: spec.taxCode,
      phone: `3${33 + Number(spec.id.split('-')[1])} ${1000000 + Number(spec.id.split('-')[1]) * 74213}`,
      email: `${spec.firstName.toLowerCase()}.${spec.lastName.toLowerCase()}@dinellisrl.it`,
      hireDate: spec.hireDate as DateKey,
      endDate: spec.status === 'cessato' ? ('2026-02-28' as DateKey) : null,
      qualification: spec.qualification,
      level: spec.level,
      contract: spec.contract,
      status: spec.status,
      rates,
      notes: '',
    }
  })
}

// ---------------------------------------------------------------- cantieri

interface SiteSpec {
  id: string
  clientId: string
  code: string
  name: string
  address: string
  city: string
  budgetEuro: number
  startDate: string
  expectedEndDate: string | null
  actualEndDate: string | null
  status: Site['status']
  /** Squadra tipica assegnata, per generare le ore. */
  crew: string[]
  /** Quota di giorni lavorativi in cui il cantiere e' davvero attivo. */
  intensity: number
  /**
   * Quanto del preventivo risulta consumato a fine periodo.
   *
   * I costi vengono generati per centrare questo valore invece che a caso: un
   * insieme di dati in cui quasi tutti i cantieri sfondano il preventivo del
   * 50% non assomiglia a nessuna impresa reale e renderebbe inutile l'avviso
   * di sforamento, che e' proprio la cosa da mettere alla prova.
   */
  targetRatio: number
}

const SITE_SPECS: SiteSpec[] = [
  {
    id: 'site-1', clientId: 'cli-1', code: 'C-2025-008',
    name: 'Ristrutturazione Palazzo Verdi', address: 'Via Mazzini 14', city: 'Brescia',
    budgetEuro: 285000, startDate: '2025-10-06', expectedEndDate: '2026-11-30', actualEndDate: null,
    status: 'attivo', crew: ['emp-1', 'emp-2', 'emp-4', 'emp-6'], intensity: 0.72, targetRatio: 0.78,
  },
  {
    id: 'site-2', clientId: 'cli-3', code: 'C-2026-001',
    name: 'Villa Bianchi', address: 'Via delle Rose 8', city: 'Rezzato',
    budgetEuro: 145000, startDate: '2026-01-13', expectedEndDate: '2026-09-30', actualEndDate: null,
    status: 'attivo', crew: ['emp-3', 'emp-7', 'emp-9'], intensity: 0.62, targetRatio: 0.86,
  },
  {
    id: 'site-3', clientId: 'cli-2', code: 'C-2026-003',
    name: 'Scuola Elementare Castelnuovo', address: 'Via Diaz 3', city: 'Castelnuovo',
    budgetEuro: 420000, startDate: '2026-03-02', expectedEndDate: '2027-02-28', actualEndDate: null,
    status: 'attivo', crew: ['emp-1', 'emp-5', 'emp-8', 'emp-2', 'emp-6'], intensity: 0.68, targetRatio: 0.42,
  },
  {
    id: 'site-4', clientId: 'cli-4', code: 'C-2025-011',
    name: 'Capannone industriale Rossi', address: 'Via dell Industria 45', city: 'Montichiari',
    budgetEuro: 310000, startDate: '2025-09-15', expectedEndDate: '2026-04-30', actualEndDate: '2026-05-14',
    status: 'chiuso', crew: ['emp-5', 'emp-8', 'emp-3', 'emp-10'], intensity: 0.7, targetRatio: 0.94,
  },
  {
    id: 'site-5', clientId: 'cli-5', code: 'C-2026-005',
    name: 'Rifacimento facciate Via Roma', address: 'Via Roma 42', city: 'Brescia',
    budgetEuro: 95000, startDate: '2026-05-04', expectedEndDate: '2026-10-15', actualEndDate: null,
    status: 'attivo', crew: ['emp-4', 'emp-7', 'emp-9'], intensity: 0.55, targetRatio: 0.71,
  },
  {
    id: 'site-6', clientId: 'cli-1', code: 'C-2026-007',
    name: 'Nuova costruzione Lotto B', address: 'Via Industriale 12', city: 'Ghedi',
    budgetEuro: 520000, startDate: '2026-10-01', expectedEndDate: '2027-12-20', actualEndDate: null,
    status: 'preventivo', crew: [], intensity: 0, targetRatio: 0.0,
  },
  {
    id: 'site-7', clientId: 'cli-3', code: 'C-2025-004',
    name: 'Rifacimento tetto abitazione', address: 'Via Trento 21', city: 'Rezzato',
    budgetEuro: 68000, startDate: '2025-09-08', expectedEndDate: '2025-12-19', actualEndDate: '2025-12-11',
    status: 'chiuso', crew: ['emp-3', 'emp-2', 'emp-6'], intensity: 0.6, targetRatio: 1.08,
  },
  {
    id: 'site-8', clientId: 'cli-4', code: 'C-2026-002',
    name: 'Muro di contenimento', address: 'Strada Provinciale 24', city: 'Nave',
    budgetEuro: 42000, startDate: '2026-02-10', expectedEndDate: '2026-06-30', actualEndDate: null,
    status: 'sospeso', crew: ['emp-8', 'emp-6'], intensity: 0.35, targetRatio: 1.16,
  },
]

function buildSites(): Site[] {
  const base = timestamps()
  return SITE_SPECS.map(spec => ({
    id: spec.id, ...base,
    clientId: spec.clientId,
    code: spec.code,
    name: spec.name,
    address: spec.address,
    city: spec.city,
    province: 'BS',
    budgetCents: Money.fromEuro(spec.budgetEuro),
    startDate: spec.startDate as DateKey,
    expectedEndDate: spec.expectedEndDate as DateKey | null,
    actualEndDate: spec.actualEndDate as DateKey | null,
    status: spec.status,
    notes: '',
  }))
}

function buildPhases(): SitePhase[] {
  const base = timestamps()
  const phases: SitePhase[] = []

  for (const spec of SITE_SPECS) {
    DEFAULT_SITE_PHASES.forEach((name, index) => {
      phases.push({
        id: `${spec.id}-ph-${index + 1}`, ...base,
        siteId: spec.id,
        name,
        order: index,
        budgetCents: null,
        completed: spec.status === 'chiuso' || index < 2,
      })
    })
  }

  return phases
}

// ---------------------------------------------------------------- ore

function isWorkingDay(date: Date): boolean {
  const day = date.getDay()
  return day !== 0 && day !== 6
}

/** Ferragosto e feriali natalizie: in cantiere non si lavora. */
function isHoliday(key: DateKey): boolean {
  const monthDay = key.slice(5)
  return ['01-01', '01-06', '04-25', '05-01', '06-02', '08-15', '11-01', '12-08', '12-25', '12-26']
    .includes(monthDay)
}

function buildWorklogs(employees: Employee[], phases: SitePhase[], today: DateKey): Worklog[] {
  const random = createRandom(SEED)
  const worklogs: Worklog[] = []
  const employeeById = new Map(employees.map(employee => [employee.id, employee]))
  let counter = 0

  for (const spec of SITE_SPECS) {
    if (spec.crew.length === 0) continue

    const sitePhases = phases.filter(phase => phase.siteId === spec.id)
    const lastDay = (spec.actualEndDate ?? today) as DateKey
    let cursor = spec.startDate as DateKey

    while (cursor <= lastDay) {
      const date = DateKeys.toDate(cursor)

      if (isWorkingDay(date) && !isHoliday(cursor) && random.chance(spec.intensity)) {
        // Chi c'e' oggi: quasi sempre la squadra al completo, ogni tanto uno manca.
        const present = spec.crew.filter(() => random.chance(0.88))

        // La fase avanza con il cantiere invece di essere estratta a caso.
        const progress = sitePhases.length
          ? Math.min(
              sitePhases.length - 1,
              Math.floor(
                (DateKeys.daysUntil(cursor, spec.startDate as DateKey)
                  / Math.max(1, DateKeys.daysUntil(lastDay, spec.startDate as DateKey)))
                * sitePhases.length,
              ),
            )
          : 0

        for (const employeeId of present) {
          const employee = employeeById.get(employeeId)
          if (!employee) continue
          if (employee.endDate && cursor > employee.endDate) continue
          if (cursor < employee.hireDate) continue

          const rate = rateAt(employee, cursor)
          const snapshot = rate ? snapshotRate(rate) : EMPTY_RATE_SNAPSHOT

          const ordinaryMinutes = Duration.fromHours(random.chance(0.9) ? 8 : random.pick([4, 6, 7]))
          const overtimeMinutes = random.chance(0.18)
            ? Duration.fromHours(random.pick([1, 1.5, 2]))
            : Duration.zero
          const travelAllowance = spec.city !== 'Brescia' && random.chance(0.6)

          const cost = calculateLaborCost({ ordinaryMinutes, overtimeMinutes, travelAllowance, rate: snapshot })

          counter += 1
          worklogs.push({
            id: `wl-${counter}`,
            createdAt: `${cursor}T18:30:00.000Z`,
            updatedAt: `${cursor}T18:30:00.000Z`,
            date: cursor,
            employeeId,
            siteId: spec.id,
            phaseId: sitePhases[progress]?.id ?? null,
            ordinaryMinutes,
            overtimeMinutes,
            travelAllowance,
            notes: '',
            rate: snapshot,
            laborCostCents: cost.totalCents,
          })
        }
      }

      cursor = DateKeys.addDays(cursor, 1)
    }
  }

  return worklogs
}

// ---------------------------------------------------------------- programmazione

/**
 * Programmazione futura: qualche settimana di previsioni sui cantieri attivi.
 * A differenza delle ore, guarda avanti nel tempo invece che indietro.
 */
function buildScheduleEntries(today: DateKey): ScheduleEntry[] {
  const random = createRandom(SEED + 17)
  const entries: ScheduleEntry[] = []
  let counter = 0

  const horizon = DateKeys.addDays(today, 42)

  for (const spec of SITE_SPECS) {
    if (spec.status !== 'attivo' || spec.crew.length === 0) continue

    let cursor = today
    while (cursor <= horizon) {
      const date = DateKeys.toDate(cursor)

      if (isWorkingDay(date) && !isHoliday(cursor) && random.chance(spec.intensity)) {
        counter += 1
        const plannedHours = random.pick([4, 6, 7, 8, 8, 8])
        entries.push({
          id: `sch-${counter}`,
          createdAt: `${today}T07:00:00.000Z`,
          updatedAt: `${today}T07:00:00.000Z`,
          date: cursor,
          siteId: spec.id,
          plannedMinutes: Duration.fromHours(plannedHours),
          notes: '',
        })
      }

      cursor = DateKeys.addDays(cursor, 1)
    }
  }

  return entries
}

// ---------------------------------------------------------------- costi

const SUPPLIERS: Record<ExpenseCategory, string[]> = {
  materiali: ['Edilmarket Brescia', 'Cementi Lombardi Srl', 'Ferramenta Bonomi', 'Laterizi Valtrompia'],
  carburante: ['Q8 Rezzato', 'Eni Station Montichiari', 'IP Castelnuovo'],
  smaltimenti: ['Ecoservizi Brescia', 'Smaltimenti Valle Srl'],
  noleggi: ['Noleggi Bresciani', 'Rent Cantiere Spa', 'Autogru Zanetti'],
  attrezzature: ['Utensileria Moretti', 'Hilti Store Brescia'],
  subappalti: ['Impianti Elettrici Fontana', 'Idraulica Belotti Snc', 'Cartongessi Sala'],
  varie: ['Assicurazioni Generali', 'Studio Tecnico Manzoni', 'Cancelleria Ufficio'],
}

const DESCRIPTIONS: Record<ExpenseCategory, string[]> = {
  materiali: ['Cemento e inerti', 'Blocchi in laterizio', 'Ferro per armature', 'Malta e collanti', 'Isolante termico'],
  carburante: ['Gasolio mezzi di cantiere', 'Rifornimento furgone', 'Gasolio escavatore'],
  smaltimenti: ['Smaltimento macerie', 'Container inerti', 'Conferimento in discarica'],
  noleggi: ['Noleggio ponteggi', 'Noleggio escavatore', 'Autogru giornata', 'Piattaforma aerea'],
  attrezzature: ['Utensili elettrici', 'Ricambi betoniera', 'DPI e caschi'],
  subappalti: ['Impianto elettrico', 'Impianto idraulico', 'Controsoffitti in cartongesso'],
  varie: ['Polizza cantiere', 'Pratica edilizia', 'Spese amministrative'],
}

/** Peso relativo delle categorie: i materiali pesano molto piu' della cancelleria. */
const CATEGORY_WEIGHTS: Array<{ category: ExpenseCategory, weight: number, min: number, max: number }> = [
  { category: 'materiali', weight: 34, min: 800, max: 9500 },
  { category: 'subappalti', weight: 16, min: 2500, max: 18000 },
  { category: 'noleggi', weight: 15, min: 400, max: 4200 },
  { category: 'carburante', weight: 12, min: 120, max: 850 },
  { category: 'smaltimenti', weight: 10, min: 300, max: 2600 },
  { category: 'attrezzature', weight: 8, min: 150, max: 1800 },
  { category: 'varie', weight: 5, min: 90, max: 1200 },
]

function pickCategory(random: ReturnType<typeof createRandom>) {
  const total = CATEGORY_WEIGHTS.reduce((sum, entry) => sum + entry.weight, 0)
  let roll = random.next() * total
  for (const entry of CATEGORY_WEIGHTS) {
    roll -= entry.weight
    if (roll <= 0) return entry
  }
  return CATEGORY_WEIGHTS[0]!
}

/**
 * Costi di cantiere.
 *
 * Prima si decide quanto deve spendere il cantiere (preventivo per la quota
 * indicata nella specifica, meno la manodopera gia' generata), poi si
 * distribuisce quella cifra su movimenti sparsi nel periodo con importi
 * proporzionati alla categoria. Generando gli importi a caso senza guardare il
 * preventivo si otteneva un'azienda in cui quasi ogni cantiere sfondava del
 * 50%, che non somiglia alla realta' e rende inutile l'avviso di sforamento.
 */
function buildExpenses(phases: SitePhase[], worklogs: Worklog[], today: DateKey): Expense[] {
  const random = createRandom(SEED + 7)
  const expenses: Expense[] = []
  let counter = 0

  const laborBySite = new Map<string, number>()
  for (const worklog of worklogs) {
    laborBySite.set(worklog.siteId, (laborBySite.get(worklog.siteId) ?? 0) + worklog.laborCostCents)
  }

  for (const spec of SITE_SPECS) {
    if (spec.status === 'preventivo') continue

    const sitePhases = phases.filter(phase => phase.siteId === spec.id)
    const lastDay = (spec.actualEndDate ?? today) as DateKey

    const targetCents = Money.fromEuro(spec.budgetEuro * spec.targetRatio)
    const laborCents = laborBySite.get(spec.id) ?? 0
    const budgetForExpenses = Math.max(0, targetCents - laborCents)
    if (budgetForExpenses === 0) continue

    // Prima passata: si scelgono le date e le categorie, senza ancora gli importi.
    const planned: Array<{ date: DateKey, entry: ReturnType<typeof pickCategory>, weight: number }> = []
    let cursor = spec.startDate as DateKey

    while (cursor <= lastDay) {
      const date = DateKeys.toDate(cursor)
      if (isWorkingDay(date) && !isHoliday(cursor) && random.chance(spec.intensity * 0.32)) {
        const entry = pickCategory(random)
        planned.push({ date: cursor, entry, weight: random.int(entry.min, entry.max) })
      }
      cursor = DateKeys.addDays(cursor, 1)
    }

    if (planned.length === 0) continue

    // Seconda passata: si riscalano i pesi perche' la somma centri il bersaglio.
    const totalWeight = planned.reduce((sum, item) => sum + item.weight, 0)
    const scale = budgetForExpenses / totalWeight

    for (const item of planned) {
      counter += 1
      expenses.push({
        id: `exp-${counter}`,
        createdAt: `${item.date}T12:00:00.000Z`,
        updatedAt: `${item.date}T12:00:00.000Z`,
        date: item.date,
        siteId: spec.id,
        phaseId: random.chance(0.7) ? (random.pick(sitePhases)?.id ?? null) : null,
        category: item.entry.category,
        description: random.pick(DESCRIPTIONS[item.entry.category]),
        // Arrotondato all'euro: nessun fornitore fattura 1.234,57 di ghiaia.
        amountCents: Money.fromEuro(Math.max(20, Math.round((item.weight * scale) / 100))),
        supplier: random.pick(SUPPLIERS[item.entry.category]),
        documentRef: `FT ${random.int(100, 9999)}/${DateKeys.year(item.date)}`,
        attachments: [],
        notes: '',
      })
    }
  }

  return expenses
}

// ---------------------------------------------------------------- fatture

function buildInvoices(today: DateKey): Invoice[] {
  const random = createRandom(SEED + 13)
  const invoices: Invoice[] = []
  let counter = 0

  for (const spec of SITE_SPECS) {
    if (spec.status === 'preventivo') continue

    const closed = spec.status === 'chiuso'
    const lastDay = (spec.actualEndDate ?? today) as DateKey
    const spanDays = Math.max(1, DateKeys.daysUntil(lastDay, spec.startDate as DateKey))
    // Un SAL ogni due mesi circa, piu' il saldo sui cantieri chiusi.
    const salCount = Math.max(1, Math.floor(spanDays / 60))

    for (let index = 0; index < salCount; index += 1) {
      const issueDate = DateKeys.addDays(spec.startDate as DateKey, Math.floor((spanDays / salCount) * (index + 1)))
      if (issueDate > today) continue

      counter += 1
      const dueDate = DateKeys.addDays(issueDate, 60)
      const amountEuro = Math.round((spec.budgetEuro * 1.18) / (salCount + (closed ? 1 : 2)))

      invoices.push({
        id: `inv-${counter}`,
        createdAt: `${issueDate}T09:00:00.000Z`,
        updatedAt: `${issueDate}T09:00:00.000Z`,
        clientId: spec.clientId,
        siteId: spec.id,
        number: `${counter}/${DateKeys.year(issueDate)}`,
        date: issueDate,
        dueDate,
        type: 'sal',
        description: `SAL n. ${index + 1} — ${spec.name}`,
        amountCents: Money.fromEuro(amountEuro),
        vatRate: spec.clientId === 'cli-3' ? 10 : 22,
        paidDate: dueDate < today && random.chance(0.82) ? DateKeys.addDays(dueDate, random.int(-5, 18)) : null,
        notes: '',
      })
    }

    if (closed && spec.actualEndDate) {
      counter += 1
      const issueDate = DateKeys.addDays(spec.actualEndDate as DateKey, 10)
      const dueDate = DateKeys.addDays(issueDate, 60)

      invoices.push({
        id: `inv-${counter}`,
        createdAt: `${issueDate}T09:00:00.000Z`,
        updatedAt: `${issueDate}T09:00:00.000Z`,
        clientId: spec.clientId,
        siteId: spec.id,
        number: `${counter}/${DateKeys.year(issueDate)}`,
        date: issueDate,
        dueDate,
        type: 'saldo',
        description: `Saldo finale — ${spec.name}`,
        amountCents: Money.fromEuro(Math.round(spec.budgetEuro * 0.22)),
        vatRate: spec.clientId === 'cli-3' ? 10 : 22,
        paidDate: dueDate < today ? DateKeys.addDays(dueDate, random.int(0, 20)) : null,
        notes: '',
      })
    }
  }

  return invoices
}

// ---------------------------------------------------------------- spese fisse

/** Canoni ricorrenti dell'impresa: stesso importo ogni mese, per gli ultimi 12 mesi. */
const RECURRING_FIXED_EXPENSES: Array<{ category: FixedExpense['category'], description: string, supplier: string, amountEuro: number }> = [
  { category: 'affitto', description: 'Canone deposito e uffici', supplier: 'Immobiliare Brixia Srl', amountEuro: 1450 },
  { category: 'utenze', description: 'Energia elettrica e gas deposito', supplier: 'Enel Energia', amountEuro: 380 },
  { category: 'assicurazioni', description: 'Polizza RC aziendale', supplier: 'Assicurazioni Generali', amountEuro: 290 },
  { category: 'leasing', description: 'Rata leasing furgoni', supplier: 'Leasys Spa', amountEuro: 620 },
  { category: 'personale', description: 'Stipendio amministrazione', supplier: 'Studio Paghe Ferrari', amountEuro: 1850 },
]

function buildFixedExpenses(today: DateKey): FixedExpense[] {
  const random = createRandom(SEED + 11)
  const expenses: FixedExpense[] = []
  let counter = 0

  for (const month of MonthKeys.lastMonths(12, DateKeys.month(today))) {
    for (const item of RECURRING_FIXED_EXPENSES) {
      counter += 1
      // Data la piu' o meno lo stesso giorno del mese, con qualche giorno di scarto.
      const date = DateKeys.addDays(MonthKeys.firstDay(month), random.int(0, 4)) as DateKey
      if (date > today) continue

      expenses.push({
        id: `fexp-${counter}`,
        createdAt: `${date}T09:00:00.000Z`,
        updatedAt: `${date}T09:00:00.000Z`,
        date,
        category: item.category,
        description: item.description,
        supplier: item.supplier,
        // Piccola variazione mensile: le utenze e la benzina non sono mai identiche.
        amountCents: Money.fromEuro(Math.round(item.amountEuro * (0.94 + random.next() * 0.12))),
        documentRef: `FT ${random.int(100, 9999)}/${DateKeys.year(date)}`,
        notes: '',
      })
    }
  }

  return expenses
}

// ---------------------------------------------------------------- assemblaggio

export function buildDemoData(today: DateKey = DateKeys.today()): DemoData {
  const clients = buildClients()
  const employees = buildEmployees()
  const sites = buildSites()
  const phases = buildPhases()

  // Le ore vanno generate per prime: i costi si dimensionano su quanto e' gia'
  // stato speso in manodopera, per centrare la quota di preventivo voluta.
  const worklogs = buildWorklogs(employees, phases, today)

  return {
    clients,
    employees,
    sites,
    phases,
    worklogs,
    schedule: buildScheduleEntries(today),
    expenses: buildExpenses(phases, worklogs, today),
    fixedExpenses: buildFixedExpenses(today),
    invoices: buildInvoices(today),
  }
}
