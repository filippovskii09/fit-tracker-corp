export const workoutLocales = {
  create: {
    success: 'Workout saved!',
    error: 'Failed to save workout',
    retryableError:
      'Connection issue — your draft is safe, please try saving again.',
    idempotencyConflict:
      'An earlier version of this workout was already saved. Opening it now.',
    titlePlaceholder: 'Workout Name...',
    addExercise: 'Add Exercise',
    buttonLoading: 'Saving...',
    submitButton: 'Finish Workout',
    addSet: 'Add another Set',
    removeExercise: 'Remove exercise',
    removeSet: 'Remove set',
    goBack: 'Go back',
    draft: {
      recoveredMessage:
        'We found a saved draft of this workout. Restore it or start fresh.',
      restore: 'Restore',
      discard: 'Discard',
      recoveredIndicator: 'Draft restored',
    },
  },
  view: {
    idAllowed: 'ID undefined',
    notFound: 'Workout not found',
    error: 'Failed to load workout',
  },
  remove: {
    ariaLabel: 'Open delete workout modal',
    success: 'Workout deleted successfully',
    error: 'Failed to delete workout',
    removing: 'Removing workout...',
  },
  weight: 'Weight',
  reps: 'Reps',
  kg: 'kg',
  sets: 'sets',
  placeholder: {
    soon: 'Soon',
  },
} as const;
