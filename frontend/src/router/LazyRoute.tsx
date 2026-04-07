import { Suspense, type ComponentType } from 'react';

import { Seo } from '@components';

export const LazyRoute = ({
  component: Component,
  title,
  description,
  path,
  noIndex,
}: {
  component: ComponentType;
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}) => (
  <>
    <Seo
      title={title}
      description={description}
      path={path}
      noIndex={noIndex}
    />
    <Suspense fallback={<div />}>
      <Component />
    </Suspense>
  </>
);
