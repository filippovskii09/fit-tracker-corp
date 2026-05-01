export const workoutLocales = {
  create: {
    success: 'Workout saved!',
    error: 'Failed to save workout',
    titlePlaceholder: 'Workout Name...',
    addExercise: 'Add Exercise',
    buttonLoading: 'Saving...',
    submitButton: 'Finish Workout',
    addSet: 'Add another Set',
    removeExercise: 'Remove exercise',
    removeSet: 'Remove set',
  },
  view: {
    idAllowed: 'ID undefined',
    notFound: 'Workout not found',
    error: 'Failed to load workout',
  },
  weight: 'Weight',
  reps: 'Reps',
  kg: 'kg',
  sets: 'sets',
} as const;
