// Production builds always use the relative, same-origin path and rely on
// the first-party Netlify `/api/*` proxy (netlify.toml, design.md D1) so the
// refresh cookie stays host-only — `VITE_API_URL` is deliberately ignored in
// a production build  so a leftover/misconfigured value
// can never re-introduce a third-party API origin. Development/LAN testing
// keeps the explicit `VITE_API_URL` override (docs/mobile-testing.md) to
// point at a local/LAN backend.
export const config = {
  api: {
    baseURL: import.meta.env.PROD
      ? '/api/v1'
      : import.meta.env.VITE_API_URL || '/api/v1',
  },
} as const;
