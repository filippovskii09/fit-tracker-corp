import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { parse } from 'yaml';

import { run as backlog, STAGES } from './backlog.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REQUIRED_FILES = [
  'CLAUDE.md', '.claude/settings.json', '.claude/rules/autonomous-git.md',
  '.claude/skills/feature-runner/SKILL.md', '.claude/agents/feature-runner.md',
  '.claude/agents/proposal-reviewer.md', '.claude/skills/proposal-review/SKILL.md',
  '.claude/skills/proposal-review/references/output-contract.md',
  '.claude/skills/proposal-review/references/review-checklist.md',
  '.claude/skills/frontend-development-workflow/SKILL.md',
  '.claude/skills/backend-development-workflow/SKILL.md',
  '.claude/skills/openspec-propose/SKILL.md',
  '.claude/skills/openspec-apply-change/SKILL.md',
  '.claude/skills/pr-description-generator/SKILL.md', 'openspec/config.yaml',
  ...['fe-implementer', 'fe-reviewer', 'be-implementer', 'be-reviewer',
    'test-writer', 'test-reviewer', 'test-fixer'].map((name) => `.claude/agents/${name}.md`)
];
export const REQUIRED_TOOLS = ['frontend', 'backend'].flatMap((scope) =>
  ['eslint', 'jest', 'tsc', scope === 'frontend' ? 'vite' : 'nest']
    .map((name) => `${scope}/node_modules/.bin/${name}`));
const CLAUDE_FLAGS = ['--output-format', 'json', '--permission-mode', 'dontAsk',
  '--permission-prompts', 'none', '--setting-sources', 'project', '--no-session-persistence'];
const text = (value) => typeof value === 'string' && value.trim().length > 0;
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

export function parseOptions(args) {
  const { values } = parseArgs({ args, options: {
    'dry-run': { type: 'boolean', default: false }, 'max-tasks': { type: 'string' }
  } });
  const limit = values['max-tasks'];
  ensure(limit === undefined || (/^[1-9]\d*$/.test(limit) && Number.isSafeInteger(Number(limit))),
    '--max-tasks must be a positive integer');
  return { dryRun: values['dry-run'], maxTasks: limit === undefined ? Infinity : Number(limit) };
}

function alive(pid) {
  try { process.kill(pid, 0); return true; }
  catch (error) { if (error.code === 'ESRCH') return false; throw error; }
}

// Never steal a stale lock: a crashed parent may still have a modifying child.
export function acquireLock(root) {
  const directory = path.join(root, '.orchestrator');
  fs.mkdirSync(directory, { recursive: true });
  const filename = path.join(directory, 'run.lock');
  let descriptor;
  try { descriptor = fs.openSync(filename, 'wx', 0o600); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    throw new Error('Run lock exists. Inspect run.lock owner and child process group; remove only after both have exited and Git/state are safe.');
  }
  const owner = { pid: process.pid, childPid: null, taskId: null };
  function update(values) {
    Object.assign(owner, values);
    fs.ftruncateSync(descriptor, 0);
    fs.writeSync(descriptor, JSON.stringify(owner), 0, 'utf8');
    fs.fsyncSync(descriptor);
  }
  update({});
  return {
    update,
    release() {
      fs.closeSync(descriptor);
      if (owner.childPid && alive(-owner.childPid)) return false;
      fs.unlinkSync(filename);
      return true;
    }
  };
}

// Each call creates a new OS process, without a shell or conversation reuse.
export function execute(command, args, { root, signal, onSpawn, timeout = 30000 } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Error('Interrupted'));
    const child = spawn(command, args, { cwd: root, detached: true,
      stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
    let stdout = '';
    let stopped = false;
    let killTimer;
    function terminate() {
      if (stopped) return;
      stopped = true;
      try { process.kill(-child.pid, 'SIGTERM'); } catch { /* Already exited. */ }
      killTimer = setTimeout(() => {
        try { process.kill(-child.pid, 'SIGKILL'); } catch { /* Already exited. */ }
      }, 5000);
    }
    const timer = setTimeout(terminate, timeout);
    signal?.addEventListener('abort', terminate, { once: true });
    child.once('spawn', () => {
      try { onSpawn?.(child.pid); } catch { terminate(); }
    });
    child.stdout.on('data', (chunk) => {
      if (stopped) return;
      stdout += chunk;
      if (Buffer.byteLength(stdout) > 8 * 1024 * 1024) terminate();
    });
    // Drain stderr but never persist arbitrary command/model output (may contain secrets).
    child.stderr.resume();
    child.once('error', (error) => {
      clearTimeout(timer);
      clearTimeout(killTimer);
      signal?.removeEventListener('abort', terminate);
      reject(new Error(`${command}: ${error.code ?? 'spawn failed'}`));
    });
    child.once('close', (code) => {
      clearTimeout(timer);
      clearTimeout(killTimer);
      signal?.removeEventListener('abort', terminate);
      if (!child.pid) return;
      if (alive(-child.pid)) {
        try { process.kill(-child.pid, 'SIGKILL'); } catch { /* Already exited. */ }
        return reject(new Error(`${command}: descendants still active; inspect lock before restart`));
      }
      if (stopped || signal?.aborted) return reject(new Error(`${command}: interrupted, timeout or output limit`));
      resolve({ code, stdout });
    });
  });
}

export function unwrapClaude(output) {
  let envelope;
  try { envelope = JSON.parse(output); } catch { throw new Error('Malformed Claude JSON envelope'); }
  ensure(object(envelope) && envelope.type === 'result' && envelope.subtype === 'success' &&
    envelope.is_error === false && typeof envelope.result === 'string', 'Claude did not return a successful result envelope');
  ensure(Array.isArray(envelope.permission_denials) && envelope.permission_denials.length === 0,
    'Claude permission denied; configure the specific required project permission');
  return envelope.result;
}

export function parseResult(output, taskId, baseBranch) {
  let result;
  const body = unwrapClaude(output).trim();
  try {
    const fenced = /^```(?:yaml|json)\n([\s\S]*?)\n```$/.exec(body);
    result = parse(fenced ? fenced[1] : body);
  } catch { throw new Error('Invalid feature contract YAML/JSON'); }
  const keys = ['status', 'task_id', 'change', 'stage', 'branch', 'base_branch', 'pr_number', 'pr_url', 'reason'];
  ensure(object(result) && Object.keys(result).length === keys.length && keys.every((key) => Object.hasOwn(result, key)),
    'Missing or unexpected feature contract fields');
  ensure(['PR_CREATED', 'BLOCKED', 'FAILED'].includes(result.status) && STAGES.includes(result.stage), 'Invalid feature status/stage');
  ensure(result.task_id === taskId && result.base_branch === baseBranch, 'Feature task/base mismatch');
  for (const key of ['change', 'branch', 'pr_url', 'reason']) {
    ensure(result[key] === null || text(result[key]), `Invalid feature ${key}`);
  }
  ensure(result.pr_number === null || (Number.isSafeInteger(result.pr_number) && result.pr_number > 0), 'Invalid PR number');
  if (result.status === 'PR_CREATED') ensure(result.stage === 'pr_created' && text(result.branch) &&
    text(result.change) && result.pr_number !== null && text(result.pr_url) && result.reason === null, 'Incomplete PR_CREATED contract');
  else ensure(text(result.reason), 'Failure/blocked reason is required');
  return result;
}

function skillArgs(argumentsText) {
  return ['-p', `/feature-runner ${argumentsText}`, ...CLAUDE_FLAGS];
}

export function preflightArgs() {
  return [...skillArgs('--preflight'), '--tools', 'Read,Glob,Grep,Skill'];
}

export function parsePreflight(output) {
  const body = unwrapClaude(output).trim();
  let result;
  try {
    const fenced = /^```(?:yaml|json)\n([\s\S]*?)\n```$/.exec(body);
    result = parse(fenced ? fenced[1] : body);
  } catch { throw new Error('Malformed feature-runner preflight contract'); }
  ensure(object(result) && Object.keys(result).length === 2 &&
    result.status === 'PRECHECK_OK' && result.skill === 'feature-runner',
  'Invalid feature-runner preflight contract');
  return result;
}

export function backendSmokeArgs() {
  return ['-p', 'From the repository root, use Bash to execute exactly npm run test --prefix backend -- --runInBand. Do not prefix or rewrite the command. Do not modify files or run other commands. Return only BACKEND_TEST_OK if the command actually exits 0; otherwise return BACKEND_TEST_FAILED.',
    ...CLAUDE_FLAGS, '--tools', 'Bash'];
}

export function featureArgs(taskId, baseBranch) {
  return skillArgs(`\ntask_id: ${JSON.stringify(taskId)}\nbase_branch: ${JSON.stringify(baseBranch)}\nExecute exactly this feature and return only its completion contract. Read authoritative repository context yourself.`);
}

export async function runOrchestrator({ root = ROOT, command = execute, cli = backlog,
  progress = console.log, signal, dryRun = false, maxTasks = Infinity } = {}) {
  const report = { result: 'STOPPED', completed: [], blocked: [], started: 0, stop_reason: null };
  let lock;
  let heartbeat;
  const checkSignal = () => ensure(!signal?.aborted, 'Interrupted');
  const call = async (name, args, options = {}) => {
    checkSignal();
    const result = await command(name, args, { root, signal, ...options });
    checkSignal();
    ensure(result.code === 0, `${name} ${args[0]} exited ${result.code}`);
    return result.stdout.trim();
  };
  const state = (...args) => {
    checkSignal();
    const result = cli(args, root);
    ensure(result.ok !== false, `Backlog ${args[0]} failed: ${(result.errors ?? []).join('; ')}`);
    return result;
  };
  async function safeRepository() {
    ensure(fs.realpathSync(await call('git', ['rev-parse', '--show-toplevel'])) === fs.realpathSync(root), 'Unexpected Git repository');
    ensure((await call('git', ['status', '--porcelain', '--untracked-files=all'])) === '', 'Working tree is dirty');
    for (const name of ['MERGE_HEAD', 'REBASE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply', 'sequencer', 'BISECT_LOG']) {
      const filename = await call('git', ['rev-parse', '--git-path', name]);
      ensure(!fs.existsSync(path.resolve(root, filename)), `Git operation in progress: ${name}`);
    }
  }
  async function verifyPR(saved, repository) {
    ensure(text(saved.branch) && text(saved.baseBranch) && text(saved.change) &&
      Number.isSafeInteger(saved.prNumber) && saved.prNumber > 0 && !saved.blocked,
    'Incomplete saved PR checkpoint; inspect and repair metadata');
    ensure(saved.branch !== 'main' && saved.branch !== saved.baseBranch, 'Unexpected saved feature branch');
    await call('git', ['check-ref-format', '--branch', saved.branch]);
    await call('git', ['check-ref-format', '--branch', saved.baseBranch]);
    await call('git', ['merge-base', '--is-ancestor', saved.baseBranch, saved.branch]);
    const head = await call('git', ['rev-parse', `refs/heads/${saved.branch}`]);
    const pr = JSON.parse(await call('gh', ['pr', 'view', String(saved.prNumber), '--repo', repository,
      '--json', 'state,url,headRefName,baseRefName,headRefOid,isCrossRepository']));
    ensure(pr.state === 'OPEN' && (!saved.prUrl || pr.url === saved.prUrl) && pr.headRefName === saved.branch &&
      pr.baseRefName === saved.baseBranch && pr.headRefOid === head && pr.isCrossRepository === false,
    'Remote PR does not match feature result; merged PRs require an explicit done checkpoint');
  }
  try {
    lock = acquireLock(root);
    await safeRepository();
    state('validate');
    for (const filename of ['state.lock', 'state.json.tmp']) {
      ensure(!fs.existsSync(path.join(root, '.orchestrator', filename)),
        `Unfinished checkpoint file ${filename}; inspect before restart`);
    }
    for (const filename of REQUIRED_FILES) ensure(fs.statSync(path.join(root, filename)).isFile(), `Missing project file: ${filename}`);
    for (const filename of REQUIRED_TOOLS) ensure(fs.existsSync(path.join(root, filename)),
      `Missing installed project tool: ${filename}; install dependencies before running`);
    for (const filename of REQUIRED_FILES.filter((name) => name.startsWith('.claude/agents/'))) {
      const source = fs.readFileSync(path.join(root, filename), 'utf8');
      const header = /^---\n([\s\S]*?)\n---/.exec(source);
      ensure(header && text(parse(header[1]).name), `Invalid agent configuration: ${filename}`);
    }
    const settings = JSON.parse(fs.readFileSync(path.join(root, '.claude/settings.json'), 'utf8'));
    ensure(settings.permissions?.defaultMode === 'dontAsk', 'Project must configure dontAsk permissions');
    const remote = await call('git', ['remote', 'get-url', 'origin']);
    const project = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const expected = project.repository.url.replace(/^git\+/, '').replace(/\.git$/, '');
    ensure(remote.replace(/\.git$/, '') === expected, 'Origin differs from package repository');
    await call('gh', ['auth', 'status']);
    const repository = JSON.parse(await call('gh', ['repo', 'view', remote, '--json', 'nameWithOwner,url,viewerPermission']));
    ensure(repository.url === expected && ['ADMIN', 'MAINTAIN', 'WRITE'].includes(repository.viewerPermission), 'GitHub repository write access required');
    await call('git', ['ls-remote', '--exit-code', 'origin', 'HEAD']);
    for (const saved of state('status').tasks.filter((task) => task.stage === 'pr_created')) {
      await verifyPR(saved, repository.nameWithOwner);
    }
    await call('openspec', ['--version']);
    await call('claude', ['--version']);
    const help = await call('claude', ['--help']);
    for (const flag of ['--print', ...CLAUDE_FLAGS.filter((arg) => arg.startsWith('--'))]) {
      ensure(help.includes(flag), `Installed Claude lacks ${flag}`);
    }
    if (!dryRun) {
      const output = await call('claude', preflightArgs(), { timeout: 120000 });
      parsePreflight(output);
      const backendOutput = await call('claude', backendSmokeArgs(), { timeout: 300000 });
      ensure(unwrapClaude(backendOutput).trim() === 'BACKEND_TEST_OK', 'Claude backend test smoke failed');
      await safeRepository();
    }
    progress('[preflight] OK');
    while (true) {
      checkSignal();
      state('validate');
      const selected = state('select');
      report.blocked = state('status').tasks.filter((task) => task.status === 'BLOCKED')
        .map((task) => ({ task: task.taskId, reason: task.blocked ?? 'Backlog task is blocked' }));
      if (selected.taskId === null) {
        const pending = state('status').tasks.some((task) => task.status === 'RESUMABLE');
        report.result = report.blocked.length || pending ? 'PARTIAL' : 'COMPLETE';
        break;
      }
      if (report.started >= maxTasks) { report.result = 'PARTIAL'; break; }
      const taskId = selected.taskId;
      const { baseBranch } = state('resolve-base', taskId);
      ensure(text(baseBranch), 'Missing resolved base');
      await call('git', ['check-ref-format', '--branch', baseBranch]);
      await call('git', ['rev-parse', '--verify', `refs/heads/${baseBranch}`]);
      progress(`[task] ${JSON.stringify(taskId)}\n[base] ${JSON.stringify(baseBranch)}`);
      const previous = state('status').tasks.find((task) => task.taskId === taskId);
      ensure(!previous.baseBranch || previous.baseBranch === baseBranch, 'Resume base changed; inspect branch ancestry before retry');
      if (dryRun) {
        report.launch = { task_id: taskId, base_branch: baseBranch, command: 'claude', args: featureArgs(taskId, baseBranch) };
        report.result = 'PARTIAL';
        progress('[dry-run] Would launch a fresh feature-runner; inference smoke omitted');
        break;
      }
      if (!previous.stage) state('checkpoint', taskId, '--stage', 'selected', '--base', baseBranch);
      lock.update({ taskId });
      checkSignal();
      report.started += 1;
      progress('[claude] started');
      heartbeat = setInterval(() => progress('[claude] still running'), 60000);
      let output;
      try {
        output = await call('claude', featureArgs(taskId, baseBranch), {
          timeout: 4 * 60 * 60 * 1000, onSpawn: (childPid) => lock.update({ childPid })
        });
      } finally {
        clearInterval(heartbeat);
        if (!signal?.aborted) await safeRepository();
      }
      lock.update({ childPid: null });
      state('validate');
      const result = parseResult(output, taskId, baseBranch);
      ensure(result.status !== 'FAILED', 'Feature returned FAILED; inspect checkpoint and repository');
      if (result.status === 'PR_CREATED') {
        const saved = state('status').tasks.find((task) => task.taskId === taskId);
        ensure(saved.stage === 'pr_created' && saved.branch === result.branch && saved.baseBranch === baseBranch &&
          saved.prNumber === result.pr_number && saved.change === result.change && !saved.blocked, 'PR contract/checkpoint mismatch');
        ensure(await call('git', ['symbolic-ref', '--short', 'HEAD']) === result.branch && result.branch !== 'main' && result.branch !== baseBranch, 'Unexpected feature branch');
        await verifyPR({ ...saved, prUrl: result.pr_url }, repository.nameWithOwner);
        report.completed.push({ task: taskId, pr: result.pr_url });
        progress(`[feature] PR_CREATED #${result.pr_number}`);
      } else {
        const saved = state('status').tasks.find((task) => task.taskId === taskId);
        ensure(saved.stage === result.stage && !['pr_created', 'done'].includes(saved.stage), 'Blocked checkpoint mismatch');
        state('checkpoint', taskId, '--stage', saved.stage, '--blocked', result.reason);
        progress('[feature] BLOCKED');
      }
      await safeRepository();
      lock.update({ taskId: null });
    }
  } catch (error) {
    report.result = 'STOPPED';
    report.stop_reason = error.message;
    if (report.started === 0) progress('[preflight] STOP BEFORE FIRST FEATURE');
  } finally {
    clearInterval(heartbeat);
    if (lock && !lock.release()) {
      report.result = 'STOPPED';
      report.stop_reason = 'Child process group still active; run lock retained';
    }
  }
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const controller = new AbortController();
  const interrupt = () => controller.abort();
  process.on('SIGINT', interrupt);
  process.on('SIGTERM', interrupt);
  try {
    const report = await runOrchestrator({ ...parseOptions(process.argv.slice(2)), signal: controller.signal });
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.result === 'STOPPED' ? 1 : report.result === 'PARTIAL' ? 2 : 0;
  } catch (error) {
    console.error(JSON.stringify({ result: 'STOPPED', stop_reason: error.message }));
    process.exitCode = 1;
  } finally {
    process.off('SIGINT', interrupt);
    process.off('SIGTERM', interrupt);
  }
}
