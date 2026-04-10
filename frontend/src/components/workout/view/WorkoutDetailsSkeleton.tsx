import { Skeleton } from '@mui/material';

const skeletonCards = Array.from({ length: 3 }, (_, index) => index);
const skeletonSets = Array.from({ length: 3 }, (_, index) => index);
const skeletonBgColor = 'var(--color-skeleton)';

const ExerciseCardSkeleton = () => (
  <div className="bg-secondary p-4 rounded-2xl mb-4 border border-white/5">
    <div className="flex justify-between items-center mb-4">
      <div className="flex-1">
        <Skeleton
          variant="text"
          width="52%"
          height={32}
          sx={{ bgcolor: skeletonBgColor }}
        />
        <Skeleton
          variant="text"
          width={56}
          height={18}
          sx={{ bgcolor: skeletonBgColor }}
        />
      </div>
    </div>

    <div className="space-y-3">
      {skeletonSets.map((setIndex) => (
        <div key={setIndex} className="flex gap-3 items-center">
          <Skeleton
            variant="text"
            width={24}
            height={24}
            sx={{ bgcolor: skeletonBgColor }}
          />
          <Skeleton
            variant="rounded"
            className="flex-1"
            height={60}
            sx={{ bgcolor: skeletonBgColor, borderRadius: '0.75rem' }}
          />
          <Skeleton
            variant="rounded"
            className="flex-1"
            height={60}
            sx={{ bgcolor: skeletonBgColor, borderRadius: '0.75rem' }}
          />
        </div>
      ))}
    </div>
  </div>
);

export const WorkoutDetailsSkeleton = () => {
  return (
    <div
      className="min-h-screen bg-main text-white pb-6"
      data-testid="workout-details-skeleton"
    >
      <div className="sticky top-0 z-20 bg-main/80 backdrop-blur-md border-b border-white/5 px-4 py-4 flex items-center gap-4">
        <Skeleton
          variant="circular"
          width={24}
          height={24}
          sx={{ bgcolor: skeletonBgColor, flexShrink: 0 }}
        />
        <div className="flex-1">
          <Skeleton
            variant="text"
            width="58%"
            height={36}
            sx={{ bgcolor: skeletonBgColor }}
          />
          <Skeleton
            variant="text"
            width={120}
            height={18}
            sx={{ bgcolor: skeletonBgColor }}
          />
        </div>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto">
        {skeletonCards.map((cardIndex) => (
          <ExerciseCardSkeleton key={cardIndex} />
        ))}
      </div>
    </div>
  );
};
