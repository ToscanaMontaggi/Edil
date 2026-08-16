/**
 * Generatore pseudocasuale con seme fisso (mulberry32).
 *
 * I dati dimostrativi devono essere sempre gli stessi a ogni avvio: se i numeri
 * cambiassero a ogni reload sarebbe impossibile capire se una differenza in
 * dashboard viene da una modifica al codice o dal caso. Math.random non lo
 * permette, questo si.
 */
export interface Random {
  /** Float in [0, 1). */
  next(): number
  /** Intero fra min e max, estremi inclusi. */
  int(min: number, max: number): number
  /** Vero con la probabilita' indicata (0..1). */
  chance(probability: number): boolean
  /** Un elemento a caso dell'array. */
  pick<T>(items: readonly T[]): T
  /** N elementi distinti presi a caso. */
  sample<T>(items: readonly T[], count: number): T[]
}

export function createRandom(seed: number): Random {
  let state = seed >>> 0

  function next(): number {
    state = (state + 0x6D2B79F5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  function int(min: number, max: number): number {
    return Math.floor(next() * (max - min + 1)) + min
  }

  return {
    next,
    int,
    chance: probability => next() < probability,
    pick: items => items[int(0, items.length - 1)]!,
    sample<T>(items: readonly T[], count: number): T[] {
      const pool = [...items]
      const picked: T[] = []
      const total = Math.min(count, pool.length)
      for (let index = 0; index < total; index += 1) {
        picked.push(pool.splice(int(0, pool.length - 1), 1)[0]!)
      }
      return picked
    },
  }
}
