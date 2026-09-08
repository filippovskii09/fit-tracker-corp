import { DICTIONARY } from '@locales';
import type { IFilterDefinition } from './types';

const { level, goal, gear, days } = DICTIONARY.routineFilters;

// Static placeholder options per the routine-filters-ui task constraints —
// no API loading, no shared constants module (see design.md).
export const FILTER_DEFINITIONS: readonly IFilterDefinition[] = [
  {
    id: 'level',
    label: level.label,
    options: [
      { value: 'any', label: level.options.any },
      { value: 'beginner', label: level.options.beginner },
      { value: 'intermediate', label: level.options.intermediate },
      { value: 'advanced', label: level.options.advanced },
    ],
  },
  {
    id: 'goal',
    label: goal.label,
    options: [
      { value: 'any', label: goal.options.any },
      { value: 'hypertrophy', label: goal.options.hypertrophy },
      { value: 'strength', label: goal.options.strength },
      { value: 'conditioning', label: goal.options.conditioning },
      { value: 'fatLoss', label: goal.options.fatLoss },
    ],
  },
  {
    id: 'gear',
    label: gear.label,
    options: [
      { value: 'any', label: gear.options.any },
      { value: 'bodyweight', label: gear.options.bodyweight },
      { value: 'dumbbells', label: gear.options.dumbbells },
      { value: 'barbell', label: gear.options.barbell },
      { value: 'fullGym', label: gear.options.fullGym },
    ],
  },
  {
    id: 'days',
    label: days.label,
    options: [
      { value: 'any', label: days.options.any },
      { value: 'three', label: days.options.three },
      { value: 'four', label: days.options.four },
      { value: 'five', label: days.options.five },
      { value: 'six', label: days.options.six },
    ],
  },
];
