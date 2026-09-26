import { execFileSync } from 'child_process';
import { join } from 'path';

import dataSource from '@src/db/data-source';

/**
 * Proves the actual migration path (up/down/up) against real PostgreSQL,
 * and that the entity metadata never drifts from what the migrations
 * produce (schema:log reports nothing pending).
 */
describe('migrations (PostgreSQL integration)', () => {
  afterAll(async () => {
    if (dataSource.isInitialized) await dataSource.destroy();
  });

  it('runs up, reverts, and re-runs cleanly against a real database', async () => {
    await dataSource.initialize();

    const before = await dataSource.runMigrations();
    expect(Array.isArray(before)).toBe(true);

    await dataSource.undoLastMigration();
    const rerun = await dataSource.runMigrations();
    expect(rerun.length).toBeGreaterThanOrEqual(1);

    await dataSource.destroy();
  });

  it('reports no pending schema-sync queries (entities match migrations exactly)', () => {
    const output = execFileSync(
      'node',
      [
        '-r',
        'tsconfig-paths/register',
        '-r',
        'ts-node/register',
        join(__dirname, '../../node_modules/typeorm/cli.js'),
        'schema:log',
        '-d',
        'src/db/data-source.ts',
      ],
      {
        cwd: join(__dirname, '../..'),
        encoding: 'utf-8',
        env: process.env,
      },
    );

    expect(output).toMatch(/schema is up to date/i);
  });
});
