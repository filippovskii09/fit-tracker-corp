import type { CreateWorkoutFormValues } from '@types';
import { generateUuid } from './uuid.utils';

// Versioned, user+date-scoped local draft (design.md D6, task 7.1). Bumping
// `WORKOUT_DRAFT_SCHEMA_VERSION` invalidates every previously stored draft
// instead of risking a shape mismatch being restored into Formik.
export const WORKOUT_DRAFT_SCHEMA_VERSION = 1;
export const WORKOUT_DRAFT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

const WORKOUT_DRAFT_KEY_PREFIX = 'fit-tracker:workout-draft';

export interface WorkoutDraft {
  version: number;
  userId: string;
  date: string;
  clientRequestId: string;
  updatedAt: number;
  values: CreateWorkoutFormValues;
}

const buildDraftKey = (userId: string, date: string): string =>
  `${WORKOUT_DRAFT_KEY_PREFIX}:${userId}:${date}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object';

// Formik leaves a cleared number input as `''`, not a number/undefined
// (a controlled input can't become uncontrolled) — the draft must restore
// exactly what the user had, so `''` is accepted alongside `number` for both
// fields instead of dropping the whole draft over an in-progress edit.
const isNumberOrEmptyString = (value: unknown): boolean =>
  typeof value === 'number' || value === '';

const isSetShape = (value: unknown): boolean =>
  isRecord(value) &&
  isNumberOrEmptyString(value.weight) &&
  isNumberOrEmptyString(value.reps);

const isExerciseShape = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }
  if (typeof value.exerciseId !== 'string') {
    return false;
  }
  if (!Array.isArray(value.sets)) {
    return false;
  }
  return value.sets.every(isSetShape);
};

/**
 * Validates the full nested draft form shape — not just
 * "an object" — so a corrupted/unexpected payload is dropped instead of
 * being handed to Formik as `initialValues`.
 */
const isCreateWorkoutFormValuesShape = (
  value: unknown,
): value is CreateWorkoutFormValues => {
  if (!isRecord(value)) {
    return false;
  }
  if (typeof value.name !== 'string' || typeof value.date !== 'string') {
    return false;
  }
  if (!Array.isArray(value.exercises)) {
    return false;
  }
  return value.exercises.every(isExerciseShape);
};

const isWorkoutDraftShape = (value: unknown): value is WorkoutDraft => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.version === WORKOUT_DRAFT_SCHEMA_VERSION &&
    typeof value.userId === 'string' &&
    typeof value.date === 'string' &&
    typeof value.clientRequestId === 'string' &&
    typeof value.updatedAt === 'number' &&
    isCreateWorkoutFormValuesShape(value.values)
  );
};

const isExpired = (draft: WorkoutDraft): boolean =>
  Date.now() - draft.updatedAt > WORKOUT_DRAFT_EXPIRY_MS;

export const readWorkoutDraft = (
  userId: string,
  date: string,
): WorkoutDraft | null => {
  const key = buildDraftKey(userId, date);
  const raw = localStorage.getItem(key);

  if (!raw) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    localStorage.removeItem(key);
    return null;
  }

  if (
    !isWorkoutDraftShape(parsed) ||
    parsed.userId !== userId ||
    parsed.date !== date
  ) {
    localStorage.removeItem(key);
    return null;
  }

  if (isExpired(parsed)) {
    localStorage.removeItem(key);
    return null;
  }

  return parsed;
};

export const writeWorkoutDraft = (
  userId: string,
  date: string,
  values: CreateWorkoutFormValues,
  clientRequestId: string,
): void => {
  const draft: WorkoutDraft = {
    version: WORKOUT_DRAFT_SCHEMA_VERSION,
    userId,
    date,
    clientRequestId,
    updatedAt: Date.now(),
    values,
  };

  localStorage.setItem(buildDraftKey(userId, date), JSON.stringify(draft));
};

export const clearWorkoutDraft = (userId: string, date: string): void => {
  localStorage.removeItem(buildDraftKey(userId, date));
};

/**
 * Removes every draft belonging to a given user, regardless of date
 * explicit logout clears that user's local
 * workout drafts; a terminal session expiry never calls this.
 */
export const clearWorkoutDraftsForUser = (userId: string): void => {
  const prefix = `${WORKOUT_DRAFT_KEY_PREFIX}:${userId}:`;
  const keysToRemove: string[] = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
};

export const createDraftClientRequestId = (): string => generateUuid();

/** Removes every expired/malformed draft, regardless of user or date. */
export const purgeStaleWorkoutDrafts = (): void => {
  const keysToCheck: string[] = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(`${WORKOUT_DRAFT_KEY_PREFIX}:`)) {
      keysToCheck.push(key);
    }
  }

  keysToCheck.forEach((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!isWorkoutDraftShape(parsed) || isExpired(parsed)) {
        localStorage.removeItem(key);
      }
    } catch {
      localStorage.removeItem(key);
    }
  });
};
