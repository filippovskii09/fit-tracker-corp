# E2E — Playwright

Use E2E for critical user journeys and behavior that requires confidence across
real browser, routing, storage, network, and application boundaries.

## Use for

- authentication/session-critical flows;
- core create/edit/delete journeys;
- navigation across pages/routes;
- browser-dependent behavior;
- cross-system flows that lower-level tests cannot prove with comparable confidence.

Do not move ordinary component permutations into E2E.

## Rules

- Test user-visible behavior.
- Keep each test isolated; do not depend on another test's state or order.
- Prefer role/text/test-id locators over CSS/XPath selectors.
- Prefer Playwright web-first assertions and auto-waiting.
- Do not use `waitForTimeout` as synchronization.
- Reuse fixtures and authenticated storage state when the project provides them.
- Use setup APIs/fixtures to create prerequisite data when that makes the test
  faster and more deterministic than reproducing unrelated UI flows.
- Avoid testing third-party sites/services directly.
- Keep flows focused; one E2E should not become an end-to-end tour of the product.
- Preserve traces/screenshots/videos according to project CI policy for
  diagnosing failures.

## Browser coverage

Run the browser matrix required by the project. Critical compatibility flows may
need Chromium, Firefox, and WebKit; do not multiply the matrix without a product
compatibility requirement.

## Flake rule

A retry may help diagnose environment instability, but retries do not make a
flaky test correct. Fix the nondeterminism or quarantine it explicitly according
to project policy.

## Accessibility regression checks

If the project already uses Playwright E2E and the changed flow is
accessibility-sensitive:

- use `@axe-core/playwright`;
- run axe after the page/component is in the relevant rendered state;
- cover critical states such as opened dialogs, forms with validation,
  assessments, menus, and dynamic content;
- treat axe violations as test failures;
- reuse a shared AxeBuilder/configuration instead of configuring scans ad hoc;
- do not use `exclude()` or disable axe rules merely to make the test pass;
- scope scans to meaningful pages/states rather than scanning every E2E step;
- keep keyboard/focus assertions separate where axe cannot verify behavior.

If Playwright E2E is not configured, do not introduce it solely for axe checks.
