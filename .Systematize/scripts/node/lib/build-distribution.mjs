import { execSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { ensureDir, getRepoRoot, parseArgs } from './common.mjs';
import { assertTrackedStateMatches, collectTrackedState } from './clean-tracked-state.mjs';
import { getAvailableExtensionPackages } from './configuration.mjs';

const DISTRIBUTION_CONTRACT_PATH = join('.Systematize', 'config', 'distribution-manifest.json');

function loadDistributionContract(repoRoot) {
  const contractPath = join(repoRoot, DISTRIBUTION_CONTRACT_PATH);
  if (!existsSync(contractPath)) {
    throw new Error(`Missing distribution contract: ${DISTRIBUTION_CONTRACT_PATH}`);
  }

  const contract = JSON.parse(readFileSync(contractPath, 'utf8'));
  if (!contract.bundle_root || !Array.isArray(contract.include_paths) || contract.include_paths.length === 0) {
    throw new Error(`Invalid distribution contract: ${DISTRIBUTION_CONTRACT_PATH}`);
  }

  if (!Array.isArray(contract.prebuild_generators) || contract.prebuild_generators.length === 0) {
    throw new Error(`Distribution contract is missing prebuild generators: ${DISTRIBUTION_CONTRACT_PATH}`);
  }

  if (!Array.isArray(contract.generated_stage_files) || contract.generated_stage_files.length === 0) {
    throw new Error(`Distribution contract is missing generated stage files: ${DISTRIBUTION_CONTRACT_PATH}`);
  }

  if (!Array.isArray(contract.repo_generated_paths) || contract.repo_generated_paths.length === 0) {
    throw new Error(`Distribution contract is missing repository generated paths: ${DISTRIBUTION_CONTRACT_PATH}`);
  }

  return contract;
}

function runNodeScript(repoRoot, scriptRelativePath, options = {}) {
  const scriptPath = join(repoRoot, scriptRelativePath);
  if (!existsSync(scriptPath)) {
    throw new Error(`Prebuild generator is missing: ${scriptRelativePath}`);
  }

  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe'
  });

  if (!options.quiet) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }

  if (result.status !== 0) {
    const details = [result.stderr, result.stdout].filter(Boolean).join('\n').trim();
    throw new Error(`Failed to run ${scriptRelativePath}${details ? `\n${details}` : ''}`);
  }
}

function runPrebuildGenerators(repoRoot, contract, options = {}) {
  for (const scriptRelativePath of contract.prebuild_generators) {
    runNodeScript(repoRoot, scriptRelativePath, options);
  }
}

function normalizeRelativePath(relativePath) {
  return relativePath.replace(/\\/g, '/');
}

function collectRepoGeneratedFiles(repoRoot, contractRelativePath) {
  const absolutePath = join(repoRoot, contractRelativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Repository generated path is missing from the repository: ${contractRelativePath}`);
  }

  const stats = statSync(absolutePath);
  if (stats.isFile()) {
    return [normalizeRelativePath(contractRelativePath)];
  }

  if (!stats.isDirectory()) {
    throw new Error(`Repository generated path is neither a file nor a directory: ${contractRelativePath}`);
  }

  const files = [];
  for (const entry of readdirSync(absolutePath, { withFileTypes: true })) {
    const childRelativePath = join(contractRelativePath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectRepoGeneratedFiles(repoRoot, childRelativePath));
      continue;
    }

    if (entry.isFile()) {
      files.push(normalizeRelativePath(childRelativePath));
    }
  }

  return files.sort();
}

function getFileDigest(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function captureRepoGeneratedState(repoRoot, contract) {
  const snapshot = new Map();

  for (const contractRelativePath of contract.repo_generated_paths) {
    for (const relativePath of collectRepoGeneratedFiles(repoRoot, contractRelativePath)) {
      snapshot.set(relativePath, getFileDigest(join(repoRoot, relativePath)));
    }
  }

  return snapshot;
}

function detectRepoGeneratedChanges(beforeSnapshot, afterSnapshot) {
  const changedFiles = [];
  const allPaths = new Set([...beforeSnapshot.keys(), ...afterSnapshot.keys()]);

  for (const relativePath of [...allPaths].sort()) {
    if (beforeSnapshot.get(relativePath) !== afterSnapshot.get(relativePath)) {
      changedFiles.push(relativePath);
    }
  }

  return changedFiles;
}

function assertRepoGeneratedFilesRemainSynchronized(repoRoot, contract, options = {}) {
  const beforeSnapshot = captureRepoGeneratedState(repoRoot, contract);
  runPrebuildGenerators(repoRoot, contract, options);
  const afterSnapshot = captureRepoGeneratedState(repoRoot, contract);
  const changedFiles = detectRepoGeneratedChanges(beforeSnapshot, afterSnapshot);

  if (changedFiles.length > 0) {
    throw new Error(
      [
        'Distribution build refused to continue because prebuild generators changed tracked generated repository files.',
        'Synchronize the repository before packaging and rerun the official verification flow.',
        ...changedFiles.map((relativePath) => `- ${relativePath}`)
      ].join('\n')
    );
  }
}

function copyIntoStage(sourceRoot, stageRoot, relativePath) {
  const sourcePath = join(sourceRoot, relativePath);
  if (!existsSync(sourcePath)) {
    throw new Error(`Distribution contract path is missing from the repository: ${relativePath}`);
  }

  const targetPath = join(stageRoot, relativePath);
  ensureDir(dirname(targetPath));
  cpSync(sourcePath, targetPath, { recursive: true, force: true });
}

function removeManagedDistributionOutputs(distRoot, bundleRoot, runtimePackageName) {
  ensureDir(distRoot);
  rmSync(join(distRoot, bundleRoot), { recursive: true, force: true });

  const tarballPrefix = `${runtimePackageName}-`;
  for (const entry of readdirSync(distRoot, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (!entry.name.startsWith(tarballPrefix) || !entry.name.endsWith('.tgz')) continue;
    rmSync(join(distRoot, entry.name), { force: true });
  }
}

function verifyStageRoot(stageRoot, contract) {
  const actualEntries = readdirSync(stageRoot, { withFileTypes: true }).map((entry) => entry.name);
  const expectedEntries = new Set([
    ...contract.include_paths.map((entry) => entry.split(/[\\/]/)[0]),
    ...contract.generated_stage_files
  ]);

  const unexpectedEntries = actualEntries.filter((entry) => !expectedEntries.has(entry));
  if (unexpectedEntries.length > 0) {
    throw new Error(`Unexpected staged entries detected: ${unexpectedEntries.join(', ')}`);
  }

  const missingEntries = [...expectedEntries].filter((entry) => !actualEntries.includes(entry));
  if (missingEntries.length > 0) {
    throw new Error(`Missing staged entries declared by the distribution contract: ${missingEntries.join(', ')}`);
  }
}

function writeInstallerFiles(stageRoot) {
  writeFileSync(
    join(stageRoot, 'install-framework.mjs'),
    `#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const cliPath = join(root, '.Systematize', 'scripts', 'node', 'cli.mjs');
const result = spawnSync('node', [cliPath, 'init', ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(result.status ?? 1);
`,
    'utf8'
  );

  writeFileSync(
    join(stageRoot, 'install-framework.ps1'),
    `#!/usr/bin/env pwsh
[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$InitArgs
)

$ErrorActionPreference = 'Stop'
$cliPath = Join-Path $PSScriptRoot '.Systematize/scripts/node/cli.mjs'
& node $cliPath init @InitArgs
exit $LASTEXITCODE
`,
    'utf8'
  );

  writeFileSync(
    join(stageRoot, 'INSTALL.md'),
    `# Systematize Framework Distribution

## Install Into A Repository

\`\`\`text
node install-framework.mjs --target-path <repo>
\`\`\`

## Windows Compatibility Shell

\`\`\`text
pwsh -File install-framework.ps1 --target-path <repo>
\`\`\`

## Runtime Package

The packaged Node runtime tarball is emitted next to this bundle inside the parent \`dist/\` directory.
`,
    'utf8'
  );
}

export default async function main(argv) {
  const opts = parseArgs(argv);

  if (opts.help) {
    console.log(`Usage: syskit build-distribution [--output <path>] [--json] [--help]

OPTIONS:
  --output <path>       Distribution root directory
  --json                Output JSON
  --help                Show help`);
    return;
  }

  const repoRoot = getRepoRoot();
  const trackedStateBeforePackaging = collectTrackedState(repoRoot);
  const distributionContract = loadDistributionContract(repoRoot);
  assertRepoGeneratedFilesRemainSynchronized(repoRoot, distributionContract, { quiet: opts.json });
  const distRoot = resolve(opts.output || join(repoRoot, 'dist'));
  const stageRoot = join(distRoot, distributionContract.bundle_root);
  const runtimePackageRoot = join(repoRoot, '.Systematize', 'scripts', 'node');
  const runtimePackageJson = JSON.parse(readFileSync(join(runtimePackageRoot, 'package.json'), 'utf8'));
  removeManagedDistributionOutputs(distRoot, distributionContract.bundle_root, runtimePackageJson.name);
  ensureDir(distRoot);
  ensureDir(stageRoot);

  for (const relativePath of distributionContract.include_paths) {
    copyIntoStage(repoRoot, stageRoot, relativePath);
  }

  writeInstallerFiles(stageRoot);

  const packedOutput = execSync(
    `npm pack "${runtimePackageRoot}" --pack-destination "${distRoot}"`,
    { cwd: repoRoot, encoding: 'utf8' }
  );
  const tarballName = packedOutput.trim().split(/\r?\n/).pop();

  const manifest = {
    schema_version: distributionContract.schema_version,
    generated_at: new Date().toISOString(),
    contract_source: DISTRIBUTION_CONTRACT_PATH,
    bundle_root: distributionContract.bundle_root,
    stage_relative_path: relative(repoRoot, stageRoot),
    runtime_package: {
      name: runtimePackageJson.name,
      version: runtimePackageJson.version,
      tarball: tarballName
    },
    prebuild_generators: distributionContract.prebuild_generators,
    repo_generated_paths: distributionContract.repo_generated_paths,
    included_paths: distributionContract.include_paths,
    generated_stage_files: distributionContract.generated_stage_files,
    available_extensions: getAvailableExtensionPackages(repoRoot).map((item) => ({
      name: item.name,
      capability: item.capability || null,
      install_by_default: item.install_by_default === true
    }))
  };

  writeFileSync(join(stageRoot, 'distribution-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  verifyStageRoot(stageRoot, distributionContract);
  assertTrackedStateMatches(repoRoot, trackedStateBeforePackaging, 'Distribution build tracked state');

  const result = {
    distRoot,
    stageRoot,
    tarball: join(distRoot, tarballName),
    manifest: join(stageRoot, 'distribution-manifest.json')
  };

  if (opts.json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`Distribution bundle created: ${stageRoot}`);
    console.log(`Runtime package created: ${join(distRoot, tarballName)}`);
  }
}
