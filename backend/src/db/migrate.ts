import dataSource from './data-source';

/**
 * Deterministic release migration step. Runs compiled migrations against the
 * same DataSource/table (`migrations`) used by the `migration:*` CLI, then
 * exits. Intended to run once, before the app starts (see Dockerfile), so a
 * failed migration blocks container start instead of running stale schema.
 */
async function main() {
  await dataSource.initialize();
  try {
    const applied = await dataSource.runMigrations();
    // eslint-disable-next-line no-console
    console.log(
      `[migrate] applied ${applied.length} migration(s): ${
        applied.map((m) => m.name).join(', ') || 'none'
      }`,
    );
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[migrate] failed', error);
  process.exit(1);
});
