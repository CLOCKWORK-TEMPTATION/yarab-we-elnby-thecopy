import { cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ensureDir, getRepoRoot, parseArgs } from './common.mjs';
import { getAvailableExtensionPackages } from './configuration.mjs';

export default async function main(argv) {
  const opts = parseArgs(argv);

  if (opts.help) {
    console.log(`Usage: syskit install-extension <name> [--force] [--json] [--help]

OPTIONS:
  --force               Reinstall the package if already installed
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
  const manifest = available.find((item) => item.name === extensionName);

  if (!manifest) {
    console.error(`Unknown extension package: ${extensionName}`);
    process.exit(1);
  }

  const sourceDir = join(repoRoot, '.Systematize', 'extension-packages', manifest.package_dir || manifest.name);
  const targetDir = join(repoRoot, '.Systematize', 'extensions', manifest.name);
  const alreadyInstalled = existsSync(targetDir);

  if (alreadyInstalled && !opts.force) {
    const result = {
      installed: false,
      reason: 'already_installed',
      extension: manifest.name,
      targetDir
    };

    if (opts.json) console.log(JSON.stringify(result, null, 2));
    else console.log(`Extension already installed: ${manifest.name}`);
    return;
  }

  ensureDir(join(repoRoot, '.Systematize', 'extensions'));
  cpSync(sourceDir, targetDir, { recursive: true, force: true });

  const result = {
    installed: true,
    extension: manifest.name,
    capability: manifest.capability || null,
    targetDir
  };

  if (opts.json) console.log(JSON.stringify(result, null, 2));
  else console.log(`Installed extension: ${manifest.name}`);
}
