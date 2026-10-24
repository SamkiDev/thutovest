// Runs every offline test file in its own Node process (each one stubs Deno and fetch globally).
// Usage: npm test
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const FILES = ['platform.test.mjs', 'whatsapp-twilio.test.mjs', 'whatsapp-meta.test.mjs'];
let failedFiles = 0;
for (const file of FILES) {
  console.log(`\n=== ${file}`);
  const path = fileURLToPath(new URL(file, import.meta.url));
  const r = spawnSync(process.execPath, ['--experimental-strip-types', '--no-warnings', path], { stdio: 'inherit' });
  if (r.status !== 0) failedFiles++;
}
console.log(failedFiles ? `\n${failedFiles} test file(s) failed` : `\nAll ${FILES.length} test files passed`);
process.exitCode = failedFiles ? 1 : 0;
