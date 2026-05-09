import { lazy, type ComponentType } from 'react';

import { render, screen, waitFor } from '@testUtils';
import { APP_ROUTES } from '@constants';
import { SEO } from './constant';
import { LazyRoute } from './LazyRoute';

const PAGE_HEADING = 'Lazy route page';
const WORKOUT_ROUTE_PATH = `${APP_ROUTES.WORKOUTS.ROOT}/42`;

const Page = () => <h1>{PAGE_HEADING}</h1>;

const renderLazyRoute = (component: ComponentType = Page) =>
  render(<LazyRoute component={component} />, {});

const getCanonicalLink = () =>
  document.head.querySelector('link[rel="canonical"]');

const getMeta = (selector: string) => document.head.querySelector(selector);

describe('LazyRoute', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.title = '';
  });

  it('should render the provided route component after it loads', async () => {
    const LazyPage = lazy(() => Promise.resolve({ default: Page }));

    renderLazyRoute(LazyPage);

    expect(
      await screen.findByRole('heading', {
        name: PAGE_HEADING,
      }),
    ).toBeInTheDocument();
  });

  it('should apply SEO props for the route', async () => {
    render(
      <LazyRoute
        component={Page}
        title={SEO.viewWorkout.title}
        description={SEO.viewWorkout.description}
        path={WORKOUT_ROUTE_PATH}
        noIndex
      />,
      {},
    );

    await waitFor(() => {
      expect(document.title).toBe(SEO.viewWorkout.title);
    });

    expect(getCanonicalLink()).toHaveAttribute(
      'href',
      `${window.location.origin}${WORKOUT_ROUTE_PATH}`,
    );
    expect(getMeta('meta[name="description"]')).toHaveAttribute(
      'content',
      SEO.viewWorkout.description,
    );
    expect(getMeta('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    );
    expect(getMeta('meta[property="og:title"]')).toHaveAttribute(
      'content',
      SEO.viewWorkout.title,
    );
  });
});
