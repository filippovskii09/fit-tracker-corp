import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';

import { run } from './backlog.mjs';

function task(id, overrides = {}) {
  return { id, title: id, workflow: 'frontend', status: 'ready', priority: 'high',
    dependencies: [], path: `./${id}/task.yaml`, ...overrides };
}

function fixture(context, tasks = [task('parent'), task('child', { dependencies: ['parent'] })]) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'backlog-test-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const entry of tasks) {
    const filename = path.join(root, 'docs/backlog', entry.path);
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, stringify({ id: entry.id }));
  }
  const index = path.join(root, 'docs/backlog/index.yaml');
  fs.mkdirSync(path.dirname(index), { recursive: true });
  fs.writeFileSync(index, stringify({ tasks }));
  const stateFile = path.join(root, '.orchestrator/state.json');
  return {
    root, index, stateFile,
    run: (...args) => run(args, root),
    state: () => JSON.parse(fs.readFileSync(stateFile, 'utf8')),
    setState: (state) => {
      fs.mkdirSync(path.dirname(stateFile), { recursive: true });
      fs.writeFileSync(stateFile, JSON.stringify(state));
    }
  };
}

function expectError(result, pattern) {
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => pattern.test(error)), JSON.stringify(result));
}

test('validates a backlog without modifying YAML', (context) => {
  const backlog = fixture(context);
  const before = fs.readFileSync(backlog.index, 'utf8');
  assert.deepEqual(backlog.run('validate'), { ok: true, taskCount: 2 });
  assert.equal(fs.readFileSync(backlog.index, 'utf8'), before);
});

for (const [name, tasks, pattern] of [
  ['duplicate ID', [task('parent'), task('parent')], /Duplicate task ID/],
  ['missing dependency', [task('child', { dependencies: ['missing'] })], /Missing dependency/],
  ['self dependency', [task('parent', { dependencies: ['parent'] })], /Self dependency/],
  ['dependency cycle', [task('parent', { dependencies: ['child'] }), task('child', { dependencies: ['parent'] })], /Dependency cycle/],
  ['invalid workflow', [task('parent', { workflow: 'other' })], /invalid workflow/],
  ['invalid priority', [task('parent', { priority: 'urgent' })], /invalid priority/],
  ['invalid dependencies', [task('parent', { dependencies: 'child' })], /dependencies must be an array/]
]) {
  test(`rejects ${name}`, (context) => {
    const backlog = fixture(context, tasks);
    expectError(backlog.run('validate'), pattern);
    expectError(backlog.run('resolve-base', tasks[0].id), pattern);
  });
}

for (const field of ['id', 'title', 'workflow', 'status', 'priority', 'dependencies', 'path']) {
  test(`rejects missing ${field}`, (context) => {
    const backlog = fixture(context);
    const entry = task('parent');
    delete entry[field];
    fs.writeFileSync(backlog.index, stringify({ tasks: [entry] }));
    expectError(backlog.run('validate'), new RegExp(field));
  });
}

test('rejects broken path and task/index ID mismatch', (context) => {
  const backlog = fixture(context);
  const filename = path.join(backlog.root, 'docs/backlog/parent/task.yaml');
  fs.writeFileSync(filename, 'id: other\n');
  expectError(backlog.run('validate'), /ID mismatch/);
  fs.unlinkSync(filename);
  expectError(backlog.run('validate'), /Cannot read valid YAML/);
});

for (const yaml of ['tasks: [', 'tasks: {}', 'tasks: []\ntasks: []', 'null']) {
  test(`rejects invalid index: ${JSON.stringify(yaml)}`, (context) => {
    const backlog = fixture(context);
    fs.writeFileSync(backlog.index, yaml);
    assert.equal(backlog.run('validate').ok, false);
  });
}

test('selects by priority then index order', (context) => {
  const backlog = fixture(context, [
    task('low', { priority: 'low' }), task('medium', { priority: 'medium' }),
    task('first'), task('second')
  ]);
  assert.deepEqual(backlog.run('select'), { taskId: 'first' });
  backlog.run('checkpoint', 'first', '--stage', 'done');
  assert.deepEqual(backlog.run('select'), { taskId: 'second' });
  backlog.run('checkpoint', 'second', '--stage', 'selected');
  assert.deepEqual(backlog.run('select'), { taskId: 'second' });
  backlog.run('checkpoint', 'second', '--stage', 'selected', '--blocked', 'Missing design');
  assert.deepEqual(backlog.run('select'), { taskId: 'medium' });
});

test('blocks child until dependency reaches pr_created, then permits stacked work', (context) => {
  const backlog = fixture(context, [task('child', { dependencies: ['parent'] }), task('parent')]);
  assert.deepEqual(backlog.run('select'), { taskId: 'parent' });
  backlog.run('checkpoint', 'parent', '--stage', 'pushed');
  assert.deepEqual(backlog.run('select'), { taskId: 'parent' });
  backlog.run('checkpoint', 'parent', '--stage', 'pr_created', '--branch', 'feat/parent', '--pr', '42');
  assert.deepEqual(backlog.run('select'), { taskId: 'child' });
  backlog.run('checkpoint', 'parent', '--stage', 'done');
  assert.deepEqual(backlog.run('select'), { taskId: 'child' });
});

test('skips non-ready tasks and handles empty backlogs', (context) => {
  const backlog = fixture(context, [task('draft', { status: 'draft' })]);
  assert.deepEqual(backlog.run('select'), { taskId: null });
  fs.writeFileSync(backlog.index, 'tasks: []');
  assert.deepEqual(backlog.run('validate'), { ok: true, taskCount: 0 });
  assert.deepEqual(backlog.run('select'), { taskId: null });
});

test('resolves main, unknown dependency, open PR branch, and merged dependency', (context) => {
  const backlog = fixture(context);
  assert.deepEqual(backlog.run('resolve-base', 'parent'), { baseBranch: 'main' });
  expectError(backlog.run('resolve-base', 'child'), /Unknown dependency state/);
  backlog.run('checkpoint', 'parent', '--stage', 'pushed', '--branch', 'feat/parent');
  expectError(backlog.run('resolve-base', 'child'), /no open PR/);
  backlog.run('checkpoint', 'parent', '--stage', 'pr_created');
  expectError(backlog.run('resolve-base', 'child'), /Missing dependency PR/);
  backlog.run('checkpoint', 'parent', '--stage', 'pr_created', '--pr', '42');
  assert.deepEqual(backlog.run('resolve-base', 'child'), { baseBranch: 'feat/parent' });
  backlog.run('checkpoint', 'parent', '--stage', 'done');
  assert.deepEqual(backlog.run('resolve-base', 'child'), { baseBranch: 'main' });
});

test('rejects missing branch metadata', (context) => {
  const backlog = fixture(context);
  backlog.run('checkpoint', 'parent', '--stage', 'pr_created', '--pr', '42');
  expectError(backlog.run('resolve-base', 'child'), /Missing dependency branch/);
});

test('rejects multiple unmerged dependencies, accepts one or all merged', (context) => {
  const backlog = fixture(context, [task('one'), task('two'), task('child', { dependencies: ['one', 'two'] })]);
  for (const id of ['one', 'two']) {
    backlog.run('checkpoint', id, '--stage', 'pr_created', '--branch', `feat/${id}`, '--pr', '42');
  }
  expectError(backlog.run('resolve-base', 'child'), /More than one unmerged dependency/);
  backlog.run('checkpoint', 'one', '--stage', 'done');
  assert.deepEqual(backlog.run('resolve-base', 'child'), { baseBranch: 'feat/two' });
  backlog.run('checkpoint', 'two', '--stage', 'done');
  assert.deepEqual(backlog.run('resolve-base', 'child'), { baseBranch: 'main' });
});

test('checkpoint preserves metadata and other tasks and is idempotent', (context) => {
  const backlog = fixture(context);
  const before = fs.readFileSync(backlog.index, 'utf8');
  backlog.run('checkpoint', 'child', '--stage', 'selected');
  backlog.run('checkpoint', 'parent', '--stage', 'committed', '--change', 'parent',
    '--branch', 'feat/parent', '--base', 'main', '--commit', 'abc123');
  const args = ['checkpoint', 'parent', '--stage', 'pr_created', '--pr', '42', '--pr-url', 'https://example.test/pr/42'];
  const first = backlog.run(...args);
  const persisted = fs.readFileSync(backlog.stateFile, 'utf8');
  assert.deepEqual(backlog.run(...args), first);
  assert.equal(fs.readFileSync(backlog.stateFile, 'utf8'), persisted);
  assert.deepEqual(backlog.state(), { version: 1, tasks: {
    child: { stage: 'selected' },
    parent: { stage: 'pr_created', change: 'parent', branch: 'feat/parent', baseBranch: 'main',
      commitSha: 'abc123', prNumber: 42, prUrl: 'https://example.test/pr/42' }
  } });
  assert.deepEqual(fs.readdirSync(path.dirname(backlog.stateFile)), ['state.json']);
  assert.equal(fs.readFileSync(backlog.index, 'utf8'), before);
});

test('invalid checkpoint and locked state leave persisted state intact', (context) => {
  const backlog = fixture(context);
  backlog.run('checkpoint', 'parent', '--stage', 'selected');
  const before = fs.readFileSync(backlog.stateFile, 'utf8');
  expectError(backlog.run('checkpoint', 'parent', '--stage', 'invalid'), /stage/);
  expectError(backlog.run('checkpoint', 'parent', '--stage', 'selected', '--pr', '4oops'), /pr/);
  expectError(backlog.run('checkpoint', 'missing', '--stage', 'selected'), /Unknown task/);
  fs.writeFileSync(path.join(backlog.root, '.orchestrator/state.lock'), '');
  expectError(backlog.run('checkpoint', 'parent', '--stage', 'done'), /locked/);
  assert.equal(fs.readFileSync(backlog.stateFile, 'utf8'), before);
});

test('failed atomic replacement preserves old state and releases the lock', (context) => {
  const backlog = fixture(context);
  backlog.run('checkpoint', 'parent', '--stage', 'selected');
  const before = fs.readFileSync(backlog.stateFile, 'utf8');
  fs.writeFileSync(path.join(backlog.root, '.orchestrator/state.json.tmp'), 'interrupted write');
  assert.equal(backlog.run('checkpoint', 'parent', '--stage', 'done').ok, false);
  assert.equal(fs.readFileSync(backlog.stateFile, 'utf8'), before);
  assert.equal(backlog.run('checkpoint', 'parent', '--stage', 'done').ok, true);
});

test('rejects corrupt or unknown runtime state without replacing it', (context) => {
  const backlog = fixture(context);
  for (const state of [{ version: 2, tasks: {} }, { version: 1, tasks: { parent: { stage: 'mystery' } } },
    { version: 1, tasks: { parent: { stage: 'pr_created', prNumber: '42' } } }]) {
    backlog.setState(state);
    assert.equal(backlog.run('select').ok, false);
    assert.equal(backlog.run('checkpoint', 'parent', '--stage', 'done').ok, false);
    assert.deepEqual(backlog.state(), state);
  }
  fs.writeFileSync(backlog.stateFile, '{');
  expectError(backlog.run('select'), /JSON/);
});

test('handles prototype-like task IDs as ordinary IDs', (context) => {
  const backlog = fixture(context, [task('__proto__'), task('constructor')]);
  assert.deepEqual(backlog.run('select'), { taskId: '__proto__' });
  assert.equal(backlog.run('checkpoint', '__proto__', '--stage', 'done').ok, true);
  assert.deepEqual(backlog.run('select'), { taskId: 'constructor' });
});

test('CLI returns only JSON and a nonzero exit code for invalid arguments', () => {
  const filename = fileURLToPath(new URL('./backlog.mjs', import.meta.url));
  for (const args of [[], ['unknown'], ['select', '--unknown'], ['resolve-base']]) {
    const result = spawnSync(process.execPath, [filename, ...args], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.equal(result.stderr, '');
    assert.equal(JSON.parse(result.stdout).ok, false);
  }
});


test('crashed checkpoints are resumable, blocked work is explicit, retry preserves metadata', (context) => {
  const backlog = fixture(context);
  assert.equal(backlog.run('status').tasks[0].status, 'NOT_STARTED');
  backlog.run('checkpoint', 'parent', '--stage', 'implementing', '--branch', 'feat/parent', '--base', 'main');
  assert.equal(backlog.run('status').tasks[0].status, 'RESUMABLE');
  assert.equal(backlog.run('select').taskId, 'parent');
  backlog.run('checkpoint', 'parent', '--stage', 'implementing', '--blocked', 'Missing requirement');
  assert.equal(backlog.run('status').tasks[0].status, 'BLOCKED');
  assert.equal(backlog.run('select').taskId, null);
  backlog.run('checkpoint', 'parent', '--stage', 'implementing');
  assert.equal(backlog.run('select').taskId, 'parent');
  assert.equal(backlog.run('status').tasks[0].branch, 'feat/parent');
  backlog.run('checkpoint', 'parent', '--stage', 'pr_created');
  assert.equal(backlog.run('status').tasks[0].status, 'PR_CREATED');
  backlog.run('checkpoint', 'parent', '--stage', 'done');
  assert.equal(backlog.run('status').tasks[0].status, 'DONE');
});

test('validate checks runtime corruption and removed task state', (context) => {
  const backlog = fixture(context);
  for (const tasks of [{ removed: { stage: 'selected' } }, { parent: { stage: 'selected', blocked: '' } }]) {
    backlog.setState({ version: 1, tasks });
    assert.equal(backlog.run('validate').ok, false);
    assert.equal(backlog.run('select').ok, false);
  }
});
