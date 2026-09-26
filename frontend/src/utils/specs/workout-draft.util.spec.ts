import type { CreateWorkoutFormValues } from '@types';
import {
  WORKOUT_DRAFT_EXPIRY_MS,
  WORKOUT_DRAFT_SCHEMA_VERSION,
  clearWorkoutDraft,
  clearWorkoutDraftsForUser,
  createDraftClientRequestId,
  purgeStaleWorkoutDrafts,
  readWorkoutDraft,
  writeWorkoutDraft,
} from '../workout-draft.util';

const values: CreateWorkoutFormValues = {
  name: 'Push Day',
  date: '2024-01-01',
  exercises: [],
};

describe('workout-draft.util', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it('returns null when no draft is stored', () => {
    expect(readWorkoutDraft('user-1', '2024-01-01')).toBeNull();
  });

  it('round-trips a written draft for the same user and date', () => {
    writeWorkoutDraft('user-1', '2024-01-01', values, 'req-1');

    const draft = readWorkoutDraft('user-1', '2024-01-01');
    expect(draft).toMatchObject({
      version: WORKOUT_DRAFT_SCHEMA_VERSION,
      userId: 'user-1',
      date: '2024-01-01',
      clientRequestId: 'req-1',
      values,
    });
  });

  it('never returns a draft belonging to another user', () => {
    writeWorkoutDraft('user-1', '2024-01-01', values, 'req-1');
    expect(readWorkoutDraft('user-2', '2024-01-01')).toBeNull();
  });

  it('never returns a draft for a different date', () => {
    writeWorkoutDraft('user-1', '2024-01-01', values, 'req-1');
    expect(readWorkoutDraft('user-1', '2024-01-02')).toBeNull();
  });

  it('expires and removes a draft older than 7 days', () => {
    writeWorkoutDraft('user-1', '2024-01-01', values, 'req-1');

    const future = Date.now() + WORKOUT_DRAFT_EXPIRY_MS + 1000;
    jest.spyOn(Date, 'now').mockReturnValue(future);

    expect(readWorkoutDraft('user-1', '2024-01-01')).toBeNull();
  });

  it('discards a malformed/older-schema draft instead of restoring it', () => {
    localStorage.setItem(
      'fit-tracker:workout-draft:user-1:2024-01-01',
      JSON.stringify({ version: 0, values }),
    );

    expect(readWorkoutDraft('user-1', '2024-01-01')).toBeNull();
  });

  it('discards unparsable JSON without throwing', () => {
    localStorage.setItem(
      'fit-tracker:workout-draft:user-1:2024-01-01',
      '{not json',
    );

    expect(readWorkoutDraft('user-1', '2024-01-01')).toBeNull();
  });

  it('clears a draft explicitly', () => {
    writeWorkoutDraft('user-1', '2024-01-01', values, 'req-1');
    clearWorkoutDraft('user-1', '2024-01-01');
    expect(readWorkoutDraft('user-1', '2024-01-01')).toBeNull();
  });

  it('purges stale drafts across users while keeping fresh ones', () => {
    writeWorkoutDraft('user-1', '2024-01-01', values, 'req-1');
    writeWorkoutDraft('user-2', '2024-01-02', values, 'req-2');

    const future = Date.now() + WORKOUT_DRAFT_EXPIRY_MS + 1000;
    jest.spyOn(Date, 'now').mockReturnValue(future);
    writeWorkoutDraft('user-3', '2024-01-03', values, 'req-3');

    purgeStaleWorkoutDrafts();

    expect(
      localStorage.getItem('fit-tracker:workout-draft:user-1:2024-01-01'),
    ).toBeNull();
    expect(
      localStorage.getItem('fit-tracker:workout-draft:user-2:2024-01-02'),
    ).toBeNull();
    expect(
      localStorage.getItem('fit-tracker:workout-draft:user-3:2024-01-03'),
    ).not.toBeNull();
  });

  it('creates a stable-looking UUID client request id', () => {
    const id = createDraftClientRequestId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('removes every draft for a given user across dates, leaving other users untouched', () => {
    writeWorkoutDraft('user-1', '2024-01-01', values, 'req-1');
    writeWorkoutDraft('user-1', '2024-01-02', values, 'req-2');
    writeWorkoutDraft('user-2', '2024-01-01', values, 'req-3');

    clearWorkoutDraftsForUser('user-1');

    expect(readWorkoutDraft('user-1', '2024-01-01')).toBeNull();
    expect(readWorkoutDraft('user-1', '2024-01-02')).toBeNull();
    expect(readWorkoutDraft('user-2', '2024-01-01')).not.toBeNull();
  });

  describe('schema version drift', () => {
    it.each([
      WORKOUT_DRAFT_SCHEMA_VERSION - 1,
      WORKOUT_DRAFT_SCHEMA_VERSION + 1,
    ])(
      'discards and removes an otherwise-valid draft at version %i',
      (version) => {
        const key = 'fit-tracker:workout-draft:user-1:2024-01-01';
        localStorage.setItem(
          key,
          JSON.stringify({
            version,
            userId: 'user-1',
            date: '2024-01-01',
            clientRequestId: 'req-1',
            updatedAt: Date.now(),
            values,
          }),
        );

        expect(readWorkoutDraft('user-1', '2024-01-01')).toBeNull();
        expect(localStorage.getItem(key)).toBeNull();
      },
    );
  });

  describe('full nested-shape validation', () => {
    const baseDraft = {
      version: WORKOUT_DRAFT_SCHEMA_VERSION,
      userId: 'user-1',
      date: '2024-01-01',
      clientRequestId: 'req-1',
      updatedAt: Date.now(),
    };
    const key = 'fit-tracker:workout-draft:user-1:2024-01-01';

    it('accepts a fully valid nested exercises/sets shape', () => {
      const validValues: CreateWorkoutFormValues = {
        name: 'Push Day',
        date: '2024-01-01',
        exercises: [
          {
            exerciseId: 'ex-1',
            sets: [{ weight: 40, reps: 10, order: 0, isCompleted: false }],
          },
        ],
      };
      localStorage.setItem(
        key,
        JSON.stringify({ ...baseDraft, values: validValues }),
      );

      expect(readWorkoutDraft('user-1', '2024-01-01')).toMatchObject({
        values: validValues,
      });
    });

    it('accepts a cleared number input (Formik leaves it as "", not a number) — orchestrator decision', () => {
      const valuesWithClearedWeight = {
        name: 'Push Day',
        date: '2024-01-01',
        exercises: [
          {
            exerciseId: 'ex-1',
            sets: [{ weight: '', reps: 10, order: 0, isCompleted: false }],
          },
        ],
      };
      localStorage.setItem(
        key,
        JSON.stringify({ ...baseDraft, values: valuesWithClearedWeight }),
      );

      expect(readWorkoutDraft('user-1', '2024-01-01')).toMatchObject({
        values: valuesWithClearedWeight,
      });
    });

    it.each([
      ['non-object values', { ...baseDraft, values: 'not-an-object' }],
      [
        'exercises not an array',
        {
          ...baseDraft,
          values: { name: 'x', date: '2024-01-01', exercises: {} },
        },
      ],
      [
        'exercise missing exerciseId',
        {
          ...baseDraft,
          values: {
            name: 'x',
            date: '2024-01-01',
            exercises: [{ sets: [] }],
          },
        },
      ],
      [
        'set with a non-numeric weight',
        {
          ...baseDraft,
          values: {
            name: 'x',
            date: '2024-01-01',
            exercises: [
              { exerciseId: 'ex-1', sets: [{ weight: 'forty', reps: 10 }] },
            ],
          },
        },
      ],
      [
        'set with a non-numeric reps',
        {
          ...baseDraft,
          values: {
            name: 'x',
            date: '2024-01-01',
            exercises: [
              { exerciseId: 'ex-1', sets: [{ weight: 40, reps: null }] },
            ],
          },
        },
      ],
    ])('drops a draft with %s', (_label, malformed) => {
      localStorage.setItem(key, JSON.stringify(malformed));

      expect(readWorkoutDraft('user-1', '2024-01-01')).toBeNull();
      expect(localStorage.getItem(key)).toBeNull();
    });
  });
});
