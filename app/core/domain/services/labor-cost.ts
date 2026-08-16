import type { Cents } from '../value-objects/money'
import { Money } from '../value-objects/money'
import type { Minutes } from '../value-objects/duration'
import { Duration } from '../value-objects/duration'
import type { Employee, EmployeeRate } from '../entities/employee'
import { rateAt } from '../entities/employee'
import type { DateKey } from '../value-objects/date-key'
import type { Worklog, WorklogRateSnapshot } from '../entities/worklog'

/**
 * Calcolo del costo della manodopera.
 *
 * Funzioni pure, senza dipendenze da Vue, Pinia o Firebase: sono la regola di
 * business dell'azienda e devono poter essere lette, testate e verificate da
 * sole. Se un consuntivo non torna, il posto dove guardare e' questo file.
 */

export interface LaborCostBreakdown {
  ordinaryCents: Cents
  overtimeCents: Cents
  travelCents: Cents
  totalCents: Cents
}

/**
 * Scompone il costo di una giornata.
 *
 * Le ore ordinarie vanno al costo pieno, gli straordinari al costo pieno
 * moltiplicato per la maggiorazione, la trasferta e' un forfait giornaliero
 * che non dipende dalle ore fatte.
 */
export function calculateLaborCost(input: {
  ordinaryMinutes: Minutes
  overtimeMinutes: Minutes
  travelAllowance: boolean
  rate: WorklogRateSnapshot
}): LaborCostBreakdown {
  const { ordinaryMinutes, overtimeMinutes, travelAllowance, rate } = input

  const ordinaryCents = Money.multiply(rate.hourlyCostCents, Duration.toHours(ordinaryMinutes))

  const overtimeCents = Money.multiply(
    rate.hourlyCostCents,
    Duration.toHours(overtimeMinutes) * rate.overtimeMultiplier,
  )

  const travelCents = travelAllowance ? rate.travelAllowanceCents : Money.zero

  return {
    ordinaryCents,
    overtimeCents,
    travelCents,
    totalCents: Money.sum([ordinaryCents, overtimeCents, travelCents]),
  }
}

/**
 * Congela la tariffa dell'operaio nel formato che finisce dentro la riga ore.
 * Da chiamare una volta sola, quando la registrazione viene creata.
 */
export function snapshotRate(rate: EmployeeRate): WorklogRateSnapshot {
  return {
    hourlyCostCents: rate.hourlyCostCents,
    overtimeMultiplier: rate.overtimeMultiplier,
    travelAllowanceCents: rate.travelAllowanceCents,
  }
}

/** Snapshot usato quando un operaio non ha ancora una tariffa: costo zero, esplicito. */
export const EMPTY_RATE_SNAPSHOT: WorklogRateSnapshot = {
  hourlyCostCents: Money.zero,
  overtimeMultiplier: 1,
  travelAllowanceCents: Money.zero,
}

/**
 * Tariffa da applicare a una registrazione in fase di creazione.
 * Se l'operaio non ha una tariffa valida a quella data si torna lo snapshot
 * vuoto: la registrazione si salva comunque, ma con costo zero e ben visibile,
 * invece di bloccare l'inserimento delle ore a fine giornata.
 */
export function resolveRateFor(employee: Employee, date: DateKey): WorklogRateSnapshot {
  const rate = rateAt(employee, date)
  return rate ? snapshotRate(rate) : EMPTY_RATE_SNAPSHOT
}

/** Ricalcola il costo di una riga a partire dallo snapshot che porta con se'. */
export function worklogCost(worklog: Worklog): LaborCostBreakdown {
  return calculateLaborCost({
    ordinaryMinutes: worklog.ordinaryMinutes,
    overtimeMinutes: worklog.overtimeMinutes,
    travelAllowance: worklog.travelAllowance,
    rate: worklog.rate,
  })
}

/** Somma dei costi manodopera di un insieme di righe. */
export function sumLaborCost(worklogs: readonly Worklog[]): Cents {
  return Money.sum(worklogs.map(worklog => worklog.laborCostCents))
}

export function sumOrdinaryMinutes(worklogs: readonly Worklog[]): Minutes {
  return Duration.sum(worklogs.map(worklog => worklog.ordinaryMinutes))
}

export function sumOvertimeMinutes(worklogs: readonly Worklog[]): Minutes {
  return Duration.sum(worklogs.map(worklog => worklog.overtimeMinutes))
}

export function sumTotalMinutes(worklogs: readonly Worklog[]): Minutes {
  return Duration.sum(worklogs.map(worklog => (worklog.ordinaryMinutes + worklog.overtimeMinutes) as Minutes))
}
