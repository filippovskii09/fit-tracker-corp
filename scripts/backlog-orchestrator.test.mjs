import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';

import { run as backlog } from './backlog.mjs';
import { acquireLock, execute, featureArgs, preflightArgs, backendSmokeArgs, parsePreflight, parseOptions, parseResult, REQUIRED_FILES, REQUIRED_TOOLS, runOrchestrator } from './backlog-orchestrator.mjs';

const SOURCE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPOSITORY = 'https://github.com/filippovskii09/fit-tracker-corp';
const envelope = (result, changes = {}) => JSON.stringify({ type: 'result', subtype: 'success',
  is_error: false, ...(typeof result === 'string' ? { result } : { structured_output: result }),
  permission_denials: [], ...changes });
const preflight = { status: 'PRECHECK_OK', skill: 'feature-runner' };
const contract = (id, base = 'main', overrides = {}) => ({ status: 'PR_CREATED', task_id: id,
  change: id, stage: 'pr_created', branch: `feat/${id}`, base_branch: base, pr_number: 42,
  pr_url: `${REPOSITORY}/pull/42`, reason: null, ...overrides });

function fixture(context, tasks = [{ id: 'first' }], options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'outer-backlog-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const name of [...REQUIRED_FILES, 'package.json']) {
    const target = path.join(root, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(SOURCE, name), target);
  }
  for (const name of REQUIRED_TOOLS) {
    const target = path.join(root, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, 'fixture tool');
  }
  const entries = tasks.map((task) => ({ title: task.id, workflow: 'frontend', status: 'ready',
    priority: 'high', dependencies: [], path: `./${task.id}/task.yaml`, ...task }));
  fs.mkdirSync(path.join(root, 'docs/backlog'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/backlog/index.yaml'), stringify({ tasks: entries }));
  for (const task of entries) {
    const target = path.join(root, 'docs/backlog', task.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, stringify({ id: task.id }));
  }
  const calls = [];
  const features = [];
  let current;
  let dirty = options.dirty;
  const cli = (...args) => backlog(args, root);
  async function command(name, args, execution) {
    calls.push({ name, args });
    const custom = await options.command?.(name, args, execution);
    if (custom) return custom;
    const success = (stdout = '') => ({ code: 0, stdout });
    if (name === 'git') {
      if (args[0] === 'status') return success(dirty ? ' M source.js' : '');
      if (args[0] === 'rev-parse' && args[1] === '--show-toplevel') return success(root);
      if (args[0] === 'rev-parse' && args[1] === '--git-path') return success(`.git/${args[2]}`);
      if (args[0] === 'remote') return success(`${REPOSITORY}.git`);
      if (args[0] === 'symbolic-ref') return success(current.branch);
      if (args[0] === 'rev-parse') return success('abc123');
      return success('head');
    }
    if (name === 'gh') {
      if (args[0] === 'repo') return success(JSON.stringify({ nameWithOwner: 'filippovskii09/fit-tracker-corp',
        url: REPOSITORY, viewerPermission: 'WRITE' }));
      if (args[0] === 'pr') return success(JSON.stringify({ state: 'OPEN', url: current.pr_url,
        headRefName: current.branch, baseRefName: current.base_branch, headRefOid: 'abc123', isCrossRepository: false,
        ...options.remotePR }));
      return success();
    }
    if (name === 'openspec') return success('1.8.0');
    if (name === 'claude') {
      if (args[0] === '--version') return success('2.1.263');
      if (args[0] === '--help') return success('--print --json-schema --output-format --permission-mode --permission-prompts --setting-sources --no-session-persistence');
      if (args[1] === '/feature-runner --preflight') return success(envelope(preflight));
      if (args[1] === backendSmokeArgs()[1]) return success(envelope('BACKEND_TEST_OK'));
      const id = JSON.parse(/task_id: (.*)/.exec(args[1])[1]);
      const base = JSON.parse(/base_branch: (.*)/.exec(args[1])[1]);
      features.push({ id, base, args });
      current = contract(id, base, options.results?.[id]);
      if (options.childExit) return { code: options.childExit, stdout: '' };
      if (current.status === 'PR_CREATED' && !options.noCheckpoint) {
        cli('checkpoint', id, '--stage', 'pr_created', '--change', id, '--branch', current.branch,
          '--base', base, '--pr', '42', '--pr-url', current.pr_url);
      }
      dirty = options.dirtyAfter;
      return success(options.malformed ? envelope('I finished it!') : envelope(current));
    }
    throw new Error(`Unexpected command ${name}`);
  }
  return { root, calls, features, cli, run: (overrides = {}) => runOrchestrator({ root, command,
    progress: () => {}, ...overrides }), lockExists: () => fs.existsSync(path.join(root, '.orchestrator/run.lock')) };
}

test('empty backlog completes without a feature process and releases lock', async (context) => {
  const setup = fixture(context, []);
  const result = await setup.run();
  assert.equal(result.result, 'COMPLETE');
  assert.equal(result.started, 0);
  assert.deepEqual(setup.features, []);
  assert.equal(setup.lockExists(), false);
});

test('each task gets a distinct fresh process invocation with exact CLI-resolved stacked base', async (context) => {
  const setup = fixture(context, [{ id: 'first' }, { id: 'child', dependencies: ['first'] }, { id: 'independent' }]);
  const result = await setup.run();
  assert.equal(result.result, 'COMPLETE', result.stop_reason);
  assert.deepEqual(setup.features.map(({ id, base }) => ({ id, base })), [
    { id: 'first', base: 'main' }, { id: 'child', base: 'feat/first' }, { id: 'independent', base: 'main' }
  ]);
  assert.equal(new Set(setup.features.map(({ args }) => args)).size, 3);
  for (const { args } of setup.features) {
    assert.ok(!args.includes('--resume') && !args.includes('--continue'));
    assert.ok(!args[1].includes('previous'));
  }
  assert.equal(result.completed.length, 3);
});

test('max-tasks 1 limits modifying processes and preserves next runnable task', async (context) => {
  const setup = fixture(context, [{ id: 'first' }, { id: 'second' }]);
  const result = await setup.run({ maxTasks: 1 });
  assert.equal(result.result, 'PARTIAL');
  assert.equal(setup.features.length, 1);
  assert.equal(setup.cli('select').taskId, 'second');
});

test('dry run validates/selects/resolves without inference, checkpoint or Git mutation', async (context) => {
  const setup = fixture(context);
  const result = await setup.run({ dryRun: true });
  assert.deepEqual({ id: result.launch.task_id, base: result.launch.base_branch }, { id: 'first', base: 'main' });
  assert.equal(setup.calls.some(({ name, args }) => name === 'claude' && args[0] === '-p'), false);
  assert.equal(fs.existsSync(path.join(setup.root, '.orchestrator/state.json')), false);
  assert.equal(setup.calls.some(({ args }) => ['switch', 'push', 'checkout', 'commit', 'add'].includes(args[0])), false);
});

test('blocked feature persists its reason, allows independent work, and ends PARTIAL', async (context) => {
  const setup = fixture(context, [{ id: 'first' }, { id: 'child', dependencies: ['first'] }, { id: 'second' }], {
    results: { first: { status: 'BLOCKED', stage: 'selected', reason: 'Missing design', pr_number: null, pr_url: null } }
  });
  const result = await setup.run();
  assert.equal(result.result, 'PARTIAL', result.stop_reason);
  assert.deepEqual(setup.features.map(({ id }) => id), ['first', 'second']);
  assert.deepEqual(result.blocked, [{ task: 'first', reason: 'Missing design' }]);
  assert.equal(setup.cli('select').taskId, null);
  assert.equal((await setup.run()).result, 'PARTIAL');
});

for (const [name, options, pattern] of [
  ['FAILED', { results: { first: { status: 'FAILED', stage: 'selected', reason: 'Verification failed' } } }, /FAILED/],
  ['malformed output', { malformed: true }, /contract/],
  ['nonzero exit', { childExit: 7 }, /exited 7/],
  ['dirty checkout after feature', { dirtyAfter: true }, /dirty/],
  ['missing PR checkpoint', { noCheckpoint: true }, /checkpoint mismatch/],
  ['wrong remote head', { remotePR: { headRefOid: 'other' } }, /Remote PR/],
  ['closed PR', { remotePR: { state: 'CLOSED' } }, /Remote PR/]
]) {
  test(`${name} stops before a second feature`, async (context) => {
    const setup = fixture(context, [{ id: 'first' }, { id: 'second' }], options);
    const result = await setup.run();
    assert.equal(result.result, 'STOPPED');
    assert.match(result.stop_reason, pattern);
    assert.equal(setup.features.length, 1);
    assert.equal(setup.lockExists(), false);
  });
}

for (const [name, options] of [
  ['dirty tree', { dirty: true }],
  ['failed gh auth', { command: (name, args) => name === 'gh' && args[0] === 'auth' ? { code: 1, stdout: '' } : null }],
  ['missing Claude', { command: (name) => { if (name === 'claude') throw new Error('ENOENT'); } }],
  ['read-only repository access', { command: (name, args) => name === 'gh' && args[0] === 'repo' ? {
    code: 0, stdout: JSON.stringify({ url: REPOSITORY, viewerPermission: 'READ' }) } : null }],
  ['permission denied smoke', { command: (name, args) => name === 'claude' && args.includes('--tools') ? {
    code: 0, stdout: envelope(preflight, { permission_denials: [{ tool_name: 'Read' }] }) } : null }]
]) {
  test(`preflight rejects ${name}`, async (context) => {
    const setup = fixture(context, undefined, options);
    assert.equal((await setup.run()).result, 'STOPPED');
    assert.equal(setup.features.length, 0);
    assert.equal(setup.cli('status').tasks[0].status, 'NOT_STARTED');
    assert.equal(setup.lockExists(), false);
  });
}

test('preflight rejects corrupt backlog and Git operation', async (context) => {
  const setup = fixture(context);
  fs.writeFileSync(path.join(setup.root, 'docs/backlog/index.yaml'), 'tasks: [');
  assert.match((await setup.run()).stop_reason, /Backlog validate/);
  const merging = fixture(context);
  fs.mkdirSync(path.join(merging.root, '.git'));
  fs.writeFileSync(path.join(merging.root, '.git/MERGE_HEAD'), 'abc');
  assert.match((await merging.run()).stop_reason, /operation in progress/);
  assert.equal(merging.features.length, 0);
});

test('crash before child completion keeps a selected task resumable on restart', async (context) => {
  const setup = fixture(context, undefined, { childExit: 1 });
  await setup.run();
  assert.equal(setup.cli('select').taskId, 'first');
  assert.equal(setup.cli('status').tasks[0].status, 'RESUMABLE');
  const result = await setup.run({ dryRun: true });
  assert.equal(result.launch.task_id, 'first');
});

test('resume preserves an advanced checkpoint until the child reports completion', async (context) => {
  const setup = fixture(context);
  setup.cli('checkpoint', 'first', '--stage', 'pushed', '--branch', 'feat/first', '--base', 'main');
  const observed = [];
  const result = await setup.run({ cli: (args, root) => { observed.push(args); return backlog(args, root); } });
  assert.equal(result.result, 'COMPLETE', result.stop_reason);
  assert.equal(observed.some((args) => args[0] === 'checkpoint' && args.includes('selected')), false);
});

test('run lock rejects concurrent and stale owners without stealing state', async (context) => {
  const setup = fixture(context);
  const lock = acquireLock(setup.root);
  assert.match((await setup.run()).stop_reason, /Run lock exists/);
  assert.equal(setup.lockExists(), true);
  lock.release();
  fs.writeFileSync(path.join(setup.root, '.orchestrator/run.lock'), '{"pid":99999999}');
  assert.match((await setup.run()).stop_reason, /Run lock exists/);
  assert.equal(setup.lockExists(), true);
});

test('interruption waits for active child, preserves checkpoint and releases lock', async (context) => {
  const controller = new AbortController();
  const setup = fixture(context, [{ id: 'first' }, { id: 'second' }], {
    command: (name, args, options) => {
      if (name !== 'claude' || args[0] !== '-p' || args.includes('--tools')) return;
      return execute(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
        ...options, onSpawn: (pid) => { options.onSpawn(pid); controller.abort(); }
      });
    }
  });
  const result = await setup.run({ signal: controller.signal });
  assert.equal(result.result, 'STOPPED');
  assert.equal(result.started, 1);
  assert.equal(setup.lockExists(), false);
  assert.equal(setup.cli('select').taskId, 'first');
});

test('execute launches separate OS processes and reports missing executable', async () => {
  const first = await execute(process.execPath, ['-e', 'console.log(process.pid)']);
  const second = await execute(process.execPath, ['-e', 'console.log(process.pid)']);
  assert.notEqual(first.stdout, second.stdout);
  await assert.rejects(execute('missing-backlog-executable', []), /ENOENT/);
});

test('strict result parsing rejects prose, wrong identity, missing fields and permission denials', () => {
  const valid = contract('first');
  assert.deepEqual(parseResult(envelope(valid), 'first', 'main'), valid);
  for (const value of [{ ...valid, task_id: 'other' }, { ...valid, base_branch: 'other' },
    { ...valid, pr_number: '42' }, { ...valid, reason: 'unexpected' }, { status: 'PR_CREATED' }]) {
    assert.throws(() => parseResult(envelope(value), 'first', 'main'));
  }
  assert.throws(() => parseResult(envelope(valid, { permission_denials: [{}] }), 'first', 'main'), /permission/);
  assert.throws(() => parseResult('PR_CREATED', 'first', 'main'), /envelope/);
});

test('contracts consume structured_output only, independently of result text', () => {
  const valid = contract('first');
  for (const result of [undefined, '', 'Explanation before ```yaml\nstatus: FAILED\n```']) {
    assert.deepEqual(parsePreflight(envelope(preflight, { result })), preflight);
    assert.deepEqual(parseResult(envelope(valid, { result }), 'first', 'main'), valid);
  }
  for (const structured_output of [undefined, null, [], 'status: PRECHECK_OK', {}]) {
    assert.throws(() => parsePreflight(envelope(JSON.stringify(preflight), { structured_output })), /preflight contract/);
    assert.throws(() => parseResult(envelope(JSON.stringify(valid), { structured_output }), 'first', 'main'), /feature contract fields/);
  }
});

test('production structured contracts preserve status, field and metadata validation', () => {
  for (const status of ['BLOCKED', 'FAILED']) {
    const value = contract('first', 'main', { status, stage: 'implementing', reason: 'Missing dependency',
      change: null, branch: null, pr_number: null, pr_url: null });
    assert.deepEqual(parseResult(envelope(value), 'first', 'main'), value);
    assert.throws(() => parseResult(envelope({ ...value, reason: '  ' }), 'first', 'main'), /reason/);
  }
  for (const overrides of [
    { status: 'DONE' }, { stage: 'unknown' }, { stage: 'implementing' },
    { branch: null }, { branch: '  ' }, { change: null }, { pr_url: null },
    { pr_number: null }, { pr_number: 0 }, { pr_number: 1.5 }, { pr_number: Number.MAX_SAFE_INTEGER + 1 },
    { reason: 'Unexpected' }, { extra: true }
  ]) {
    assert.throws(() => parseResult(envelope(contract('first', 'main', overrides)), 'first', 'main'));
  }
});

for (const changes of [
  { subtype: 'error_max_structured_output_retries', is_error: true },
  { subtype: 'error_max_structured_output_retries', is_error: false },
  { is_error: true }, { permission_denials: [{}] }, { permission_denials: undefined }
]) {
  test(`unsuccessful envelope rejects structured contracts: ${JSON.stringify(changes)}`, () => {
    assert.throws(() => parsePreflight(envelope(preflight, changes)));
    assert.throws(() => parseResult(envelope(contract('first'), changes), 'first', 'main'));
  });
}

test('both skill invocations supply object schemas with production identity and field constraints', () => {
  const schemaFrom = (args) => JSON.parse(args[args.indexOf('--json-schema') + 1]);
  assert.deepEqual(schemaFrom(preflightArgs()), {
    type: 'object', properties: { status: { const: 'PRECHECK_OK' }, skill: { const: 'feature-runner' } },
    required: ['status', 'skill'], additionalProperties: false
  });
  const schema = schemaFrom(featureArgs('first', 'feature/base'));
  assert.equal(schema.type, 'object');
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(schema.required.sort(), Object.keys(contract('first')).sort());
  assert.deepEqual(schema.properties.task_id, { const: 'first' });
  assert.deepEqual(schema.properties.base_branch, { const: 'feature/base' });
  assert.deepEqual(schema.properties.status.enum, ['PR_CREATED', 'BLOCKED', 'FAILED']);
  assert.equal(Object.hasOwn(schema, 'anyOf'), false);
  for (const key of ['change', 'branch', 'pr_url', 'reason']) {
    assert.deepEqual(schema.properties[key], { anyOf: [{ type: 'string', pattern: '\\S' }, { type: 'null' }] });
  }
  assert.deepEqual(schema.properties.pr_number, {
    anyOf: [{ type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER }, { type: 'null' }]
  });
});

test('unsupported json-schema flag stops before inference', async (context) => {
  const setup = fixture(context, undefined, {
    command: (name, args) => name === 'claude' && args[0] === '--help'
      ? { code: 0, stdout: '--print --output-format' } : null
  });
  const result = await setup.run();
  assert.match(result.stop_reason, /Installed Claude lacks --json-schema/);
  assert.equal(setup.calls.some(({ name, args }) => name === 'claude' && args[0] === '-p'), false);
});

test('schema retry exhaustion logs diagnostics and stops before checkpointing', async (context) => {
  const messages = [];
  const setup = fixture(context, undefined, {
    command: (name, args) => name === 'claude' && args[1] === '/feature-runner --preflight'
      ? { code: 1, stdout: envelope('', { subtype: 'error_max_structured_output_retries', is_error: true }) } : null
  });
  const result = await setup.run({ progress: (message) => messages.push(message) });
  assert.equal(result.result, 'STOPPED');
  assert.equal(result.started, 0);
  assert.deepEqual(setup.features, []);
  assert.equal(fs.existsSync(path.join(setup.root, '.orchestrator/state.json')), false);
  assert.ok(messages.some((message) => message.includes('error_max_structured_output_retries')));
});

test('arguments keep backlog strings as data and reject unsupported CLI options', () => {
  const args = featureArgs('a; $(touch bad)', 'feat/base');
  assert.equal(args[0], '-p');
  assert.ok(args[1].includes('task_id: "a; $(touch bad)"'));
  assert.deepEqual(parseOptions(['--max-tasks', '1', '--dry-run']), { maxTasks: 1, dryRun: true });
  for (const args of [['--max-tasks', '0'], ['--max-tasks', '1oops'], ['--resume'], ['extra']]) {
    assert.throws(() => parseOptions(args));
  }
});


test('active lock identifies ownership without hiding resumable state after release', (context) => {
  const setup = fixture(context);
  setup.cli('checkpoint', 'first', '--stage', 'selected');
  const lock = acquireLock(setup.root);
  lock.update({ taskId: 'first' });
  assert.equal(setup.cli('status').tasks[0].status, 'ACTIVE');
  lock.release();
  assert.equal(setup.cli('status').tasks[0].status, 'RESUMABLE');
});

test('preflight rejects missing dependencies, invalid agent headers and unfinished state writes', async (context) => {
  for (const [name, corrupt, pattern] of [
    ['tool', (root) => fs.unlinkSync(path.join(root, REQUIRED_TOOLS[0])), /Missing installed project tool/],
    ['agent', (root) => fs.writeFileSync(path.join(root, '.claude/agents/proposal-reviewer.md'), '# Draft'), /Invalid agent/],
    ['state write', (root) => {
      fs.mkdirSync(path.join(root, '.orchestrator'), { recursive: true });
      fs.writeFileSync(path.join(root, '.orchestrator/state.lock'), '');
    }, /Unfinished checkpoint/]
  ]) {
    const setup = fixture(context);
    corrupt(setup.root);
    const result = await setup.run();
    assert.equal(result.started, 0, name);
    assert.match(result.stop_reason, pattern);
  }
});

test('restart reconciles saved PRs before selecting more work', async (context) => {
  const options = { remotePR: {} };
  const setup = fixture(context, [{ id: 'first' }, { id: 'second' }], options);
  assert.equal((await setup.run({ maxTasks: 1 })).result, 'PARTIAL');
  options.remotePR.state = 'CLOSED';
  const result = await setup.run();
  assert.equal(result.result, 'STOPPED');
  assert.match(result.stop_reason, /Remote PR/);
  assert.equal(result.started, 0);
  assert.equal(setup.cli('select').taskId, 'second');
});

test('changed saved base stops recovery before spawning another feature', async (context) => {
  const setup = fixture(context);
  setup.cli('checkpoint', 'first', '--stage', 'implementing', '--base', 'old-base');
  const result = await setup.run();
  assert.equal(result.result, 'STOPPED');
  assert.match(result.stop_reason, /Resume base changed/);
  assert.equal(result.started, 0);
});

test('already interrupted run releases its lock without invoking external commands', async (context) => {
  const setup = fixture(context);
  const result = await setup.run({ signal: AbortSignal.abort() });
  assert.equal(result.result, 'STOPPED');
  assert.deepEqual(setup.calls, []);
  assert.equal(setup.lockExists(), false);
});

for (const [name, response, pattern] of [
  ['file existence alone', { code: 0, stdout: envelope('CONFIG_OK') }, /preflight contract/],
  ['unavailable skill', { code: 0, stdout: envelope('Unknown skill: feature-runner') }, /preflight contract/],
  ['malformed contract', { code: 0, stdout: envelope('status: [') }, /preflight contract/],
  ['wrong skill', { code: 0, stdout: envelope({ ...preflight, skill: 'other' }) }, /preflight contract/],
  ['missing dependency', { code: 0, stdout: envelope({ ...preflight, status: 'PRECHECK_FAILED', reason: 'Missing agent' }) }, /preflight contract/],
  ['permission denial', { code: 0, stdout: envelope(preflight, { permission_denials: [{ tool_name: 'Skill' }] }) }, /permission denied/],
  ['nonzero Claude exit', { code: 7, stdout: envelope(preflight) }, /exited 7/]
]) {
  test(`real skill preflight rejects ${name} before checkpoint or feature`, async (context) => {
    const setup = fixture(context, undefined, {
      command: (name, args) => name === 'claude' && args[1] === '/feature-runner --preflight' ? response : null
    });
    const result = await setup.run();
    assert.equal(result.result, 'STOPPED');
    assert.match(result.stop_reason, pattern);
    assert.equal(result.started, 0);
    assert.deepEqual(setup.features, []);
    assert.equal(fs.existsSync(path.join(setup.root, '.orchestrator/state.json')), false);
    assert.equal(setup.calls.some(({ args }) => ['switch', 'push', 'checkout', 'commit', 'add', 'new'].includes(args[0])), false);
  });
}

test('preflight uses the production skill entry point and only read tools without checkpointing', async (context) => {
  const setup = fixture(context);
  const result = await setup.run({ maxTasks: 0 });
  assert.equal(result.result, 'PARTIAL', result.stop_reason);
  const smoke = setup.calls.find(({ name, args }) => name === 'claude' && args[0] === '-p');
  assert.deepEqual(smoke.args, preflightArgs());
  assert.equal(smoke.args[1], '/feature-runner --preflight');
  assert.ok(featureArgs('first', 'main')[1].startsWith('/feature-runner '));
  assert.deepEqual(smoke.args.slice(2, -4), featureArgs('first', 'main').slice(2, -2));
  assert.equal(smoke.args.at(-1), 'Read,Glob,Grep,Skill');
  assert.equal(fs.existsSync(path.join(setup.root, '.orchestrator/state.json')), false);
  assert.deepEqual(setup.features, []);
  assert.equal(setup.calls.some(({ args }) => ['switch', 'push', 'checkout', 'commit', 'add', 'new'].includes(args[0])), false);
});

test('preflight contract rejects extra fields and missing success envelope', () => {
  assert.deepEqual(parsePreflight(envelope(preflight)), { status: 'PRECHECK_OK', skill: 'feature-runner' });
  assert.throws(() => parsePreflight(envelope({ ...preflight, reason: null })), /preflight contract/);
  assert.throws(() => parsePreflight('status: PRECHECK_OK\nskill: feature-runner'), /envelope/);
});

for (const [name, body] of [
  ['plain YAML', 'status: PRECHECK_OK\nskill: feature-runner'],
  ['fenced YAML', '```yaml\nstatus: PRECHECK_OK\nskill: feature-runner\n```'],
  ['unlabelled fence', '```\nstatus: PRECHECK_OK\nskill: feature-runner\n```'],
  ['CRLF yml fence', '```yml\r\nstatus: PRECHECK_OK\r\nskill: feature-runner\r\n```'],
  ['fenced JSON', '```json\n{"status":"PRECHECK_OK","skill":"feature-runner"}\n```']
]) {
  test(`preflight rejects legacy result containing ${name}`, () => {
    assert.throws(() => parsePreflight(envelope(body)), /preflight contract/);
  });
}

for (const body of [
  'Everything passed!\nstatus: PRECHECK_OK\nskill: feature-runner',
  'Here is the result:\n```yaml\nstatus: PRECHECK_OK\nskill: feature-runner\n```',
  '```yaml\nstatus: PRECHECK_OK\nskill: feature-runner\n```\nEverything passed!',
  'status: PRECHECK_OK\nskill: feature-runner\nEverything passed!',
  'status: [',
  '```yaml\nstatus: PRECHECK_OK\nskill: feature-runner',
  'status: PRECHECK_OK\nstatus: PRECHECK_OK\nskill: feature-runner'
]) {
  test(`preflight rejects prose or malformed result: ${JSON.stringify(body)}`, () => {
    assert.throws(() => parsePreflight(envelope(body)), /preflight contract/);
  });
}

test('preflight rejects permission denials even with a valid structured contract', () => {
  assert.throws(() => parsePreflight(envelope(preflight,
    { permission_denials: [{ tool_name: 'Read' }] })), /permission denied/);
});

test('preflight parse failure logs sanitized raw envelope before stopping', async (context) => {
  const messages = [];
  const body = 'Unexpected prose\nstatus: PRECHECK_OK\nskill: feature-runner\napi_key: "private-value"\nBearer private-bearer\nsk-ant-private-key\n\u001b[31m';
  const setup = fixture(context, undefined, {
    command: (name, args) => name === 'claude' && args[1] === '/feature-runner --preflight'
      ? { code: 0, stdout: envelope(body, { access_token: 'private-token' }) } : null
  });
  const result = await setup.run({ progress: (message) => messages.push(message) });
  assert.equal(result.result, 'STOPPED');
  assert.match(result.stop_reason, /preflight contract/);
  assert.equal(result.started, 0);
  assert.deepEqual(setup.features, []);
  const diagnostic = messages.find((message) => message.includes('Rejected Claude result'));
  assert.ok(diagnostic);
  assert.match(diagnostic, /Unexpected prose/);
  assert.match(diagnostic, /PRECHECK_OK/);
  assert.match(diagnostic, /"type":"result"/);
  assert.match(diagnostic, /\[REDACTED\]/);
  for (const secret of ['private-value', 'private-bearer', 'sk-ant-private-key', 'private-token', '\u001b']) {
    assert.equal(diagnostic.includes(secret), false);
  }
});

test('malformed outer JSON is logged with a bounded sanitized diagnostic', async (context) => {
  const messages = [];
  const setup = fixture(context, undefined, {
    command: (name, args) => name === 'claude' && args[1] === '/feature-runner --preflight'
      ? { code: 0, stdout: `api_key=private-value ${'x'.repeat(10000)}` } : null
  });
  const result = await setup.run({ progress: (message) => messages.push(message) });
  assert.match(result.stop_reason, /Malformed Claude JSON envelope/);
  const diagnostic = messages.find((message) => message.includes('Rejected Claude result'));
  assert.equal(diagnostic.includes('private-value'), false);
  assert.match(diagnostic, /\[truncated\]$/);
  assert.ok(diagnostic.length < 8400);
});

for (const response of [
  { code: 1, stdout: '' },
  { code: 0, stdout: envelope('BACKEND_TEST_FAILED') },
  { code: 0, stdout: envelope('BACKEND_TEST_OK', { permission_denials: [{ tool_name: 'Bash' }] }) }
]) {
  test('backend smoke failure stops before the first checkpoint', async (context) => {
    const setup = fixture(context, undefined, {
      command: (name, args) => name === 'claude' && args[1] === backendSmokeArgs()[1] ? response : null
    });
    const result = await setup.run();
    assert.equal(result.result, 'STOPPED');
    assert.equal(result.started, 0);
    assert.equal(fs.existsSync(path.join(setup.root, '.orchestrator/state.json')), false);
    assert.deepEqual(setup.features, []);
  });
}

test('feature-runner skill is sufficient without a separate runner agent', async (context) => {
  const setup = fixture(context);
  assert.equal(fs.existsSync(path.join(setup.root, '.claude/agents/feature-runner.md')), false);
  assert.equal(REQUIRED_FILES.includes('.claude/agents/feature-runner.md'), false);
  const source = fs.readFileSync(path.join(setup.root, '.claude/skills/feature-runner/SKILL.md'), 'utf8');
  assert.equal(source.includes('.claude/agents/feature-runner.md'), false);
  const result = await setup.run({ maxTasks: 0 });
  assert.equal(result.result, 'PARTIAL', result.stop_reason);
  assert.equal(result.started, 0);
  assert.ok(setup.calls.some(({ name, args }) => name === 'claude' && args[1] === '/feature-runner --preflight'));
});

test('project permits the exact backend command and retains destructive-command denials', () => {
  const { permissions } = JSON.parse(fs.readFileSync(path.join(SOURCE, '.claude/settings.json'), 'utf8'));
  assert.equal(permissions.defaultMode, 'dontAsk');
  assert.ok(permissions.allow.includes('Bash(npm run test --prefix backend -- --runInBand)'));
  assert.ok(!permissions.allow.includes('Bash(*)'));
  assert.ok(!permissions.allow.includes('Bash(npm *)'));
  for (const rule of ['Bash(git reset *)', 'Bash(git clean *)', 'Bash(git push *--force*)',
    'Bash(git push * -f*)', 'Bash(git push *main*)', 'Bash(git push *--delete*)',
    'Bash(git push *--mirror*)', 'Bash(git push *--all*)', 'Bash(git *--no-verify*)',
    'Bash(git config *)', 'Bash(gh pr merge *)', 'Bash(npm run *--watch*)']) {
    assert.ok(permissions.deny.includes(rule), rule);
  }
});
