import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { getRepoRoot, parseArgs } from './common.mjs';
import { getAvailableExtensionPackages } from './configuration.mjs';

export default async function main(argv) {
  const opts = parseArgs(argv);

  if (opts.help) {
    console.log(`Usage: syskit remove-extension <name> [--json] [--help]

OPTIONS:
  --json                Output JSON
  --help                Show help`);
    return;
  }

  const extensionName = opts.name || opts._[0];
  if (!extensionName) {
    console.error('Extension name is required.');
    process.exit(1);
  }

  const repoRoot = getRepoRoot();
  const available = getAvailableExtensionPackages(repoRoot);
  const manifest = available.find((item) => item.name === extensionName) || { name: extensionName };
  const targetDir = join(repoRoot, '.Systematize', 'extensions', manifest.name);

  if (!existsSync(targetDir)) {
    const result = {
      removed: false,
      reason: 'not_installed',
      extension: manifest.name,
      targetDir
    };

    if (opts.json) console.log(JSON.stringify(result, null, 2));
    else console.log(`Extension not installed: ${manifest.name}`);
    return;
  }

  rmSync(targetDir, { recursive: true, force: true });

  const result = {
    removed: true,
    extension: manifest.name,
    targetDir
  };

  if (opts.json) console.log(JSON.stringify(result, null, 2));
  else console.log(`Removed extension: ${manifest.name}`);
}
