import { useEffect, useRef } from 'react';
import { Formik, Form } from 'formik';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { createWorkoutInitialValues, createWorkoutSchema } from './schemas';
import { useCreateWorkout } from './hooks';
import { useWorkoutDraft } from './useWorkoutDraft';
import type { CreateWorkoutFormValues } from '@types';
import {
  DraftRecoveryBanner,
  FormExercisesList,
  StickyHeader,
  SubmitButtonBlock,
} from '@components';
import { APP_ROUTES } from '@constants';
import { DICTIONARY } from '@locales';

const AUTOSAVE_DEBOUNCE_MS = 500;

// Debounced autosave, isolated so it can watch `values` from inside the
// Formik render prop without re-rendering the whole page on every keystroke
// (design.md D6). Gated on `dirty` so an
// untouched default value is never written as a draft — on mount, and again
// right after Discard resets the pending decision.
const DraftAutosave = ({
  values,
  dirty,
  enabled,
  onSave,
}: {
  values: CreateWorkoutFormValues;
  dirty: boolean;
  enabled: boolean;
  onSave: (values: CreateWorkoutFormValues) => void;
}) => {
  useEffect(() => {
    if (!enabled || !dirty) {
      return;
    }
    const timer = setTimeout(() => onSave(values), AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [values, dirty, enabled, onSave]);

  return null;
};

// The first edit made while a recovery banner is still pending a decision
// is treated as an implicit Discard (design.md D6 —
// human-decided): the old draft is dropped and a fresh `clientRequestId` is
// issued so the new content is never entangled with the stale one. The
// stored draft's `clientRequestId` is only ever reused via explicit Restore.
const ImplicitDiscardOnEdit = ({
  active,
  onImplicitDiscard,
}: {
  active: boolean;
  onImplicitDiscard: () => void;
}) => {
  useEffect(() => {
    if (active) {
      onImplicitDiscard();
    }
    // Only fires on the active:false -> true transition; once discarded,
    // `active` becomes false again and the effect is inert until a new
    // pending draft (a different date/session) appears.
  }, [active, onImplicitDiscard]);

  return null;
};

// Keyed by `date` in the exported component below: the `date` query param
// can change without a route/component identity change,
// so remounting this subtree per date is what guarantees `useWorkoutDraft`
// (and every piece of local form state) always belongs to the *current*
// date instead of carrying over a previous date's pending draft/request id.
const CreateWorkoutPageForDate = ({ date }: { date: string }) => {
  const nameInputRef = useRef<HTMLInputElement>(null);

  const draft = useWorkoutDraft(date);
  const handleSubmit = useCreateWorkout({
    clientRequestId: draft.clientRequestId,
    ownerUserId: draft.ownerUserId,
    onConfirmedCreate: draft.clearAfterSuccess,
    onIdempotencyConflict: draft.clearAfterSuccess,
  });

  // The draft lookup is synchronous (a lazy `useState` initializer), so a
  // blank default can never overwrite — or render ahead of — a stored draft
  // (design.md D6): `draft` already reflects the mount-time check by the
  // time this first renders.
  const initialValues = createWorkoutInitialValues(date);

  const focusNameInput = () => {
    // Deferred so it runs after Formik's own state update settles.
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  return (
    <main>
      <Formik<CreateWorkoutFormValues>
        initialValues={initialValues}
        validationSchema={createWorkoutSchema}
        onSubmit={handleSubmit}
        validateOnMount
      >
        {({
          values,
          dirty,
          handleChange,
          isSubmitting,
          isValid,
          errors,
          submitCount,
          setValues,
        }) => (
          <Form className="min-h-screen bg-main text-white pb-32">
            {draft.hasPendingDraft && (
              <>
                <DraftRecoveryBanner
                  onRestore={() => {
                    const recoveredValues = draft.restore();
                    if (recoveredValues) {
                      void setValues(recoveredValues);
                    }
                    focusNameInput();
                  }}
                  onDiscard={() => {
                    draft.discard();
                    focusNameInput();
                  }}
                />
                <ImplicitDiscardOnEdit
                  active={dirty}
                  onImplicitDiscard={draft.discard}
                />
              </>
            )}

            {draft.recovered && (
              <p
                role="status"
                className="mx-4 mt-2 text-xs font-medium uppercase tracking-wider text-primary"
              >
                {DICTIONARY.workout.create.draft.recoveredIndicator}
              </p>
            )}

            <DraftAutosave
              values={values}
              dirty={dirty}
              enabled={!draft.hasPendingDraft}
              onSave={draft.saveDraft}
            />

            <StickyHeader
              name={values.name}
              date={date}
              handleChange={handleChange}
              nameError={submitCount > 0 ? errors.name : undefined}
              nameInputRef={nameInputRef}
            />

            <FormExercisesList />

            <SubmitButtonBlock
              isSubmitting={isSubmitting}
              isValid={isValid && values.exercises.length > 0}
            />
          </Form>
        )}
      </Formik>
    </main>
  );
};

const CreateWorkoutPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date');

  if (!date) {
    navigate(APP_ROUTES.DASHBOARD);
    return null;
  }

  return <CreateWorkoutPageForDate key={date} date={date} />;
};

export default CreateWorkoutPage;
