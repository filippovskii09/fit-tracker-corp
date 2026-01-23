import { ThemeProvider } from '@emotion/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  render,
  renderHook,
  type RenderHookOptions,
  type RenderOptions,
} from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, Routes } from 'react-router-dom';

import { appTheme } from '@theme';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
}

export const renderWithProviders = (
  ui: ReactElement,
  options: ExtendedRenderOptions,
) => {
  const { route = '/', ...renderOptions } = options;

  const Wrapper = ({ children }: { children: ReactNode }) => {
    const queryClient = createTestQueryClient();

    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={appTheme}>
          <MemoryRouter initialEntries={[route]}>
            <Routes></Routes>
            {children}
          </MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

export const renderHookWithProviders = <Result, Props>(
  render: (initialProps: Props) => Result,
  options: RenderHookOptions<Props> = {},
) => {
  const Wrapper = ({ children }: { children: ReactNode }) => {
    const queryClient = createTestQueryClient();
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={appTheme}>
          <MemoryRouter>{children}</MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>
    );
  };

  return renderHook(render, { wrapper: Wrapper, ...options });
};

// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';
export { renderWithProviders as render };
export { renderHookWithProviders as renderHook };
