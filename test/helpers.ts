import { createPet } from '../src/pet/pet.js';
import type { ActivityEvent, ActivityKind, PetState } from '../src/pet/types.js';

export const TZ = 'UTC';

export function at(day: string, hour = 12): string {
  return `${day}T${String(hour).padStart(2, '0')}:00:00.000Z`;
}

let counter = 0;
export function ev(kind: ActivityKind, day: string, count = 1, hour = 12): ActivityEvent {
  return { id: `t${counter++}`, kind, at: at(day, hour), count };
}

export function newPet(today = '2026-03-01'): PetState {
  return createPet('Nova', today);
}

export function noon(day: string): Date {
  return new Date(at(day, 18));
}
