import { Suspense, type ComponentType } from 'react';

import { Loader } from '@components';

export const LazyRoute = ({
  component: Component,
}: {
  component: ComponentType;
}) => (
  <Suspense fallback={<Loader />}>
    <Component />
  </Suspense>
);
