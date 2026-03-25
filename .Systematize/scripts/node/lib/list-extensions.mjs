import { getRepoRoot, parseArgs } from './common.mjs';
import { getAvailableExtensionPackages, getInstalledExtensions } from './configuration.mjs';

export default async function main(argv) {
  const opts = parseArgs(argv);

  if (opts.help) {
    console.log(`Usage: syskit list-extensions [--json] [--help]

OPTIONS:
  --json                Output JSON
  --help                Show help`);
    return;
  }

  const repoRoot = getRepoRoot();
  const availablePackages = getAvailableExtensionPackages(repoRoot);
  const installedExtensions = getInstalledExtensions(repoRoot);
  const installedByName = new Set(installedExtensions.map((item) => item.name));

  const extensions = availablePackages.map((manifest) => ({
    name: manifest.name,
    capability: manifest.capability || null,
    description: manifest.description || '',
    install_by_default: manifest.install_by_default === true,
    installed: installedByName.has(manifest.name),
    runtime_flags: manifest.runtime_flags || [],
    runtime_commands: manifest.runtime_commands || []
  }));

  if (opts.json) {
    console.log(JSON.stringify({ extensions }, null, 2));
    return;
  }

  if (extensions.length === 0) {
    console.log('No extension packages available.');
    return;
  }

  for (const extension of extensions) {
    console.log(`${extension.installed ? '●' : '○'} ${extension.name}`);
    console.log(`  capability: ${extension.capability || 'n/a'}`);
    console.log(`  default install: ${extension.install_by_default ? 'yes' : 'no'}`);
    console.log(`  runtime flags: ${(extension.runtime_flags || []).join(', ') || 'none'}`);
  }
}
