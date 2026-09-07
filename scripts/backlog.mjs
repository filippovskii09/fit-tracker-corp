import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { parse } from 'yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRIORITIES = ['high', 'medium', 'low'];
const WORKFLOWS = ['frontend', 'backend', 'fullstack'];
export const STAGES = [
  'selected', 'proposal_created', 'proposal_reviewed', 'implementing',
  'implementation_approved', 'verified', 'committed', 'pushed', 'pr_created', 'done'
];
const METADATA = {
  change: 'change', branch: 'branch', base: 'baseBranch',
  commit: 'commitSha', pr: 'prNumber', 'pr-url': 'prUrl'
};
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isText = (value) => typeof value === 'string' && value.trim().length > 0;
const hasTask = (tasks, id) => Object.hasOwn(tasks, id);

class BacklogError extends Error {
  constructor(errors) {
    super(errors.join('; '));
    this.errors = errors;
  }
}

function fail(message) {
  throw new BacklogError([message]);
}

function readYaml(filename) {
  try {
    return parse(fs.readFileSync(filename, 'utf8'));
  } catch {
    fail(`Cannot read valid YAML: ${filename}`);
  }
}

function readBacklog(root) {
  const directory = path.join(root, 'docs/backlog');
  const index = readYaml(path.join(directory, 'index.yaml'));
  if (!isObject(index) || !Array.isArray(index.tasks)) fail('tasks must be an array');
  const errors = [];
  const tasks = new Map();
  for (const [position, task] of index.tasks.entries()) {
    const label = `tasks[${position}]`;
    if (!isObject(task)) {
      errors.push(`${label} must be an object`);
      continue;
    }
    for (const field of ['id', 'title', 'workflow', 'status', 'priority', 'path']) {
      if (!isText(task[field])) errors.push(`${label}.${field} must be a non-empty string`);
    }
    if (!WORKFLOWS.includes(task.workflow)) errors.push(`${label}: invalid workflow`);
    if (!PRIORITIES.includes(task.priority)) errors.push(`${label}: invalid priority`);
    if (!Array.isArray(task.dependencies) || !task.dependencies.every(isText)) {
      errors.push(`${label}.dependencies must be an array of IDs`);
    }
    if (isText(task.id)) {
      if (tasks.has(task.id)) errors.push(`Duplicate task ID: ${task.id}`);
      else tasks.set(task.id, task);
    }
    if (isText(task.path)) {
      const filename = path.resolve(directory, task.path);
      if (path.basename(filename) !== 'task.yaml') errors.push(`${label}.path must point to task.yaml`);
      try {
        const detail = readYaml(filename);
        if (!isObject(detail) || detail.id !== task.id) errors.push(`${label}: task/index ID mismatch`);
      } catch (error) {
        errors.push(...error.errors);
      }
    }
  }
  for (const [id, task] of tasks) {
    if (!Array.isArray(task.dependencies)) continue;
    for (const dependency of task.dependencies) {
      if (dependency === id) errors.push(`Self dependency: ${id}`);
      else if (!tasks.has(dependency)) errors.push(`Missing dependency: ${id} -> ${dependency}`);
    }
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) {
      errors.push(`Dependency cycle at: ${id}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    const dependencies = tasks.get(id).dependencies;
    if (Array.isArray(dependencies)) {
      for (const dependency of dependencies) if (tasks.has(dependency)) visit(dependency);
    }
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of tasks.keys()) visit(id);
  if (errors.length) throw new BacklogError(errors);
  return index.tasks;
}

function readState(root) {
  let state;
  try {
    state = JSON.parse(fs.readFileSync(path.join(root, '.orchestrator/state.json'), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return { version: 1, tasks: {} };
    fail('Cannot read valid runtime state JSON');
  }
  if (!isObject(state) || state.version !== 1 || !isObject(state.tasks)) fail('Invalid runtime state schema');
  for (const [id, task] of Object.entries(state.tasks)) {
    if (!isObject(task) || !STAGES.includes(task.stage)) fail(`Invalid runtime stage: ${id}`);
    if (Object.hasOwn(task, 'blocked') && !isText(task.blocked)) fail(`Invalid blocked reason: ${id}`);
    if (task.blocked && ['pr_created', 'done'].includes(task.stage)) fail(`Terminal task cannot be blocked: ${id}`);
    for (const field of Object.values(METADATA)) {
      if (!Object.hasOwn(task, field)) continue;
      if (field === 'prNumber') {
        if (!Number.isSafeInteger(task[field]) || task[field] <= 0) fail(`Invalid prNumber: ${id}`);
      } else if (!isText(task[field])) fail(`Invalid ${field}: ${id}`);
    }
  }
  return state;
}

function activeTask(root) {
  let owner;
  try { owner = JSON.parse(fs.readFileSync(path.join(root, '.orchestrator/run.lock'), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; fail('Cannot read run lock'); }
  if (!Number.isSafeInteger(owner.pid) || owner.pid <= 0) fail('Invalid run lock owner');
  try { process.kill(owner.pid, 0); return owner.taskId ?? null; }
  catch (error) { if (error.code === 'ESRCH') return null; throw error; }
}

function resolveBase(task, state) {
  const unresolved = [];
  for (const id of task.dependencies) {
    if (!hasTask(state.tasks, id)) fail(`Unknown dependency state: ${id}`);
    const dependency = state.tasks[id];
    if (dependency.stage === 'done') continue;
    if (dependency.stage !== 'pr_created') fail(`Dependency has no open PR: ${id}`);
    if (!isText(dependency.branch)) fail(`Missing dependency branch: ${id}`);
    if (!dependency.prNumber && !dependency.prUrl) fail(`Missing dependency PR metadata: ${id}`);
    unresolved.push(dependency);
  }
  if (unresolved.length > 1) fail('More than one unmerged dependency');
  return { baseBranch: unresolved[0]?.branch ?? 'main' };
}

function checkpoint(root, id, values) {
  if (!STAGES.includes(values.stage)) fail('Invalid or missing checkpoint stage');
  const update = { stage: values.stage };
  for (const [option, field] of Object.entries(METADATA)) {
    if (values[option] === undefined) continue;
    if (!isText(values[option])) fail(`Empty --${option}`);
    if (option === 'pr') {
      const number = Number(values.pr);
      if (!/^[1-9]\d*$/.test(values.pr) || !Number.isSafeInteger(number)) fail('Invalid --pr number');
      update[field] = number;
    } else update[field] = values[option];
  }
  const directory = path.join(root, '.orchestrator');
  fs.mkdirSync(directory, { recursive: true });
  const lock = path.join(directory, 'state.lock');
  let descriptor;
  try {
    descriptor = fs.openSync(lock, 'wx');
  } catch (error) {
    if (error.code === 'EEXIST') fail('Runtime state is locked; retry after the current checkpoint finishes');
    throw error;
  }
  const temporary = path.join(directory, 'state.json.tmp');
  try {
    const state = readState(root);
    const previous = hasTask(state.tasks, id) ? state.tasks[id] : {};
    const task = { ...previous, ...update };
    if (values.blocked !== undefined) {
      if (!isText(values.blocked)) fail('Empty --blocked reason');
      if (['pr_created', 'done'].includes(task.stage)) fail('Terminal task cannot be blocked');
      task.blocked = values.blocked;
    } else delete task.blocked;
    // Computed property names also handle IDs such as "__proto__" safely.
    state.tasks = { ...state.tasks, [id]: task };
    fs.writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, { flag: 'wx' });
    fs.renameSync(temporary, path.join(directory, 'state.json'));
    return { ok: true, taskId: id, ...task };
  } finally {
    fs.rmSync(temporary, { force: true });
    fs.closeSync(descriptor);
    fs.unlinkSync(lock);
  }
}

export function run(args, root = ROOT) {
  try {
    const [command, ...rest] = args;
    if (!['validate', 'select', 'status', 'resolve-base', 'checkpoint'].includes(command)) fail('Unknown command');
    const options = command === 'checkpoint'
      ? Object.fromEntries(['stage', 'blocked', ...Object.keys(METADATA)].map((name) => [name, { type: 'string' }]))
      : {};
    const { values, positionals } = parseArgs({ args: rest, options, allowPositionals: true });
    const needsTask = ['resolve-base', 'checkpoint'].includes(command);
    if (positionals.length !== (needsTask ? 1 : 0)) fail(`Invalid arguments for ${command}`);
    const tasks = readBacklog(root);
    const state = readState(root);
    for (const id of Object.keys(state.tasks)) {
      if (!tasks.some((task) => task.id === id)) fail(`Unknown runtime task: ${id}`);
    }
    if (command === 'validate') return { ok: true, taskCount: tasks.length };
    const task = needsTask ? tasks.find(({ id }) => id === positionals[0]) : null;
    if (needsTask && !task) fail(`Unknown task: ${positionals[0]}`);
    if (command === 'checkpoint') return checkpoint(root, task.id, values);
    if (command === 'status') {
      const active = activeTask(root);
      return { tasks: tasks.map(({ id, status }) => {
      const progress = hasTask(state.tasks, id) ? state.tasks[id] : null;
      return { taskId: id, ...progress, status: progress?.blocked ? 'BLOCKED'
        : progress?.stage === 'done' ? 'DONE'
          : progress?.stage === 'pr_created' ? 'PR_CREATED'
            : progress ? active === id ? 'ACTIVE' : 'RESUMABLE'
              : status === 'blocked' ? 'BLOCKED' : 'NOT_STARTED' };
      }) };
    }
    if (command === 'resolve-base') return resolveBase(task, state);
    const candidates = tasks.filter(({ id, status, dependencies }) =>
      status === 'ready' && (!hasTask(state.tasks, id) ||
        (!state.tasks[id].blocked && !['pr_created', 'done'].includes(state.tasks[id].stage))) && dependencies.every((dependency) =>
        hasTask(state.tasks, dependency) && ['pr_created', 'done'].includes(state.tasks[dependency].stage)
      )
    );
    candidates.sort((left, right) => Number(hasTask(state.tasks, right.id)) - Number(hasTask(state.tasks, left.id)) ||
      PRIORITIES.indexOf(left.priority) - PRIORITIES.indexOf(right.priority));
    return { taskId: candidates[0]?.id ?? null };
  } catch (error) {
    return { ok: false, errors: error.errors ?? [error.code ? `${error.code}: ${error.message}` : error.message] };
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = run(process.argv.slice(2));
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (result.ok === false) process.exitCode = 1;
}
