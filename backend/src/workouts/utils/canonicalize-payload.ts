import { createHash } from 'crypto';

import { CreateWorkoutDto } from '../dto';

/**
 * Canonicalizes the idempotency-relevant part of a create-workout payload:
 * object keys are sorted so key order never affects the hash, but
 * exercise/set array order is preserved verbatim (order is meaningful data,
 * not incidental JSON formatting).
 */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value !== null && typeof value === 'object') {
    const sortedKeys = Object.keys(value as Record<string, unknown>).sort();
    const result: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      result[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return result;
  }

  return value;
}

export function hashWorkoutPayload(dto: CreateWorkoutDto): string {
  const { name, date, exercises } = dto;
  const canonical = canonicalize({ name, date, exercises });

  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}
