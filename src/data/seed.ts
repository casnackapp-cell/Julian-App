/**
 * Con qué arranca la app.
 *
 * No hay onboarding (decisión 7.5) y no se crean cuentas por adelantado (2.1):
 * Julián abre y ve un estado vacío que le explica qué hacer. Lo único que sí se
 * siembra son las categorías base, que puede editar y borrar todas.
 */

import { baseCategories, brand } from '../config/brand'
import { newId } from '../lib/id'
import type { Category, DataSnapshot, Profile } from './types'

export function defaultProfile(now: number = Date.now()): Profile {
  return {
    userName: brand.defaultUserName,
    theme: 'system',
    hideBalance: false,
    createdAt: now,
  }
}

export function seedCategories(now: number = Date.now()): Category[] {
  return baseCategories.map((c, i) => ({
    id: newId(),
    name: c.name,
    emoji: c.emoji,
    color: c.color,
    kind: c.kind,
    order: i,
    createdAt: now,
  }))
}

export function emptySnapshot(now: number = Date.now()): DataSnapshot {
  return {
    profile: defaultProfile(now),
    accounts: [],
    categories: seedCategories(now),
    movements: [],
    reminders: [],
    notes: [],
    goals: [],
  }
}

/**
 * Completa un snapshot al que le faltan campos.
 *
 * Hace falta porque los datos guardados pueden venir de una versión anterior de
 * la app: si se agrega una colección nueva, los usuarios existentes no la tienen
 * y sin esto la UI reventaría al leer `undefined.map`.
 */
export function mergeSnapshot(raw: Partial<DataSnapshot> | null | undefined): DataSnapshot {
  const base = emptySnapshot()
  if (!raw) return base

  return {
    profile: { ...base.profile, ...(raw.profile ?? {}) },
    accounts: Array.isArray(raw.accounts) ? raw.accounts : base.accounts,
    // Ojo: si el usuario borró todas sus categorías, se respeta el array vacío.
    categories: Array.isArray(raw.categories) ? raw.categories : base.categories,
    movements: Array.isArray(raw.movements) ? raw.movements : base.movements,
    reminders: Array.isArray(raw.reminders) ? raw.reminders : base.reminders,
    notes: Array.isArray(raw.notes) ? raw.notes : base.notes,
    goals: Array.isArray(raw.goals) ? raw.goals : base.goals,
  }
}
