import { Suspense, type ComponentType } from 'react';

export const LazyRoute = ({
  component: Component,
}: {
  component: ComponentType;
}) => (
  <Suspense fallback={<div />}>
    <Component />
  </Suspense>
);
