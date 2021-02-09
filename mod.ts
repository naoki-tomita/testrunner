type Runnable = () => void | Promise<void>;

interface Test {
  name: string;
  test: Runnable;
}

interface Spec {
  name: string;
  before: Runnable[];
  execution: Array<Spec | Test>;
  after: Runnable[];
}

const suite: Spec = {
  name: "suite",
  before: [],
  after: [],
  execution: [],
};
let currentSpec: Spec = suite;
export async function describe(name: string, fn: Runnable) {
  const spec = {
    name,
    before: [],
    beforeAll: [],
    after: [],
    afterAll: [],
    execution: [],
  };
  const last = currentSpec;
  currentSpec.execution.push(spec);
  currentSpec = spec;
  await fn();
  currentSpec = last;
}

export function before(fn: Runnable) {
  currentSpec.before.push(fn);
}

export function test(name: string, fn: Runnable) {
  currentSpec.execution.push({ name, test: fn });
}

export function after(fn: Runnable) {
  currentSpec.after.push(fn);
}

export const it = test;

async function _runAll(runnables: Runnable[], names: string[]) {
  for (const runnable of runnables) {
    await runnable();
  }
}

async function _runTest({ name, test }: Test, names: string[]) {
  Deno.test([...names, name].join(" > "), test);
}

async function _runTests(tests: Array<Test | Spec>, names: string[]) {
  for (const test of tests) {
    if ("before" in test) {
      await _run(test, [...names, test.name]);
    } else {
      await _runTest(test, names);
    }
  }
}

async function _run(spec: Spec, names: string[]) {
  try {
    await _runAll(spec.before, names);
    await _runTests(spec.execution, names);
    await _runAll(spec.after, names);
  } catch (e) {
    console.error(e);
  }
}

export async function run() {
  await _run(suite, []);
}
