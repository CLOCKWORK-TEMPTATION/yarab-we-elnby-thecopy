import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { assertCleanTrackedState } from './clean-tracked-state.mjs';
import { getRepoRoot, parseArgs } from './common.mjs';

export default async function main(argv) {
  const opts = parseArgs(argv);

  if (opts.help) {
    console.log(`Usage: node .Systematize/scripts/node/lib/verify-clean-tree.mjs [--json] [--help]

OPTIONS:
  --json                Output JSON
  --help                Show help`);
    return;
  }

  const repoRoot = getRepoRoot();
  const result = assertCleanTrackedState(repoRoot, 'Tracked repository state');

  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('Tracked repository state is clean.');
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
