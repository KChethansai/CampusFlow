// check-syntax script: verifies backend JavaScript parses before deployment.
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ignored = new Set(['node_modules', 'uploads']);

const collectFiles = (dir) => {
  const files = [];
  for (const entry of readdirSync(dir)) {
    if (ignored.has(entry)) continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) files.push(...collectFiles(fullPath));
    if (stat.isFile() && fullPath.endsWith('.js')) files.push(fullPath);
  }
  return files;
};

for (const file of collectFiles(process.cwd())) {
  const result = spawnSync(process.execPath, ['--check', file], {
    stdio: 'inherit'
  });
  if (result.status !== 0) process.exit(result.status);
}
