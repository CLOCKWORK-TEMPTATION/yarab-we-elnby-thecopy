// Setup research documentation for a feature
import { existsSync, copyFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getCurrentBranch, getFeatureDir, getFeaturePathsEnv, getRepoRoot, parseArgs, resolveTemplate, ensureDir, testFeatureBranch } from './common.mjs';

export default async function main(argv) {
  const opts = parseArgs(argv);

  if (opts.help) {
    console.log('Usage: syskit setup-research [OPTIONS]');
    console.log('  --branch  Target feature branch');
    console.log('  --json    Output results in JSON format');
    console.log('  --help    Show this help message');
    return;
  }

  const repoRoot = getRepoRoot();
  const paths = getFeaturePathsEnv();
  const branch = opts.branch || paths.CURRENT_BRANCH || getCurrentBranch();
  const featureDir = opts.branch ? getFeatureDir(repoRoot, branch) : paths.FEATURE_DIR;
  const featurePaths = {
    ...paths,
    CURRENT_BRANCH: branch,
    FEATURE_DIR: featureDir,
    FEATURE_SYS: join(featureDir, 'sys.md'),
    IMPL_PLAN: join(featureDir, 'plan.md'),
    TASKS: join(featureDir, 'tasks.md'),
    RESEARCH: join(featureDir, 'research.md')
  };

  // Check if we're on a proper feature branch
  if (!testFeatureBranch(branch) && featurePaths.HAS_GIT) {
    console.error('ERROR: Not on a feature branch.');
    console.error('Feature branches should be named like: 001-feature-name');
    process.exit(1);
  }

  // Ensure the feature directory exists
  ensureDir(featurePaths.FEATURE_DIR);

  // Copy research template if it exists
  const template = resolveTemplate(repoRoot, 'research-template');
  if (template && existsSync(template)) {
    copyFileSync(template, featurePaths.RESEARCH);
    if (!opts.json) console.log(`Copied research template to ${featurePaths.RESEARCH}`);
  } else {
    if (!opts.json) console.warn('Research template not found');
    // Create a basic research file if template doesn't exist
    writeFileSync(featurePaths.RESEARCH, '', 'utf8');
  }

  // Output results
  const result = {
    FEATURE_SYS: featurePaths.FEATURE_SYS,
    RESEARCH: featurePaths.RESEARCH,
    SPECS_DIR: featurePaths.FEATURE_DIR,
    BRANCH: featurePaths.CURRENT_BRANCH,
    HAS_GIT: featurePaths.HAS_GIT
  };

  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`FEATURE_SYS: ${result.FEATURE_SYS}`);
    console.log(`RESEARCH: ${result.RESEARCH}`);
    console.log(`SPECS_DIR: ${result.SPECS_DIR}`);
    console.log(`BRANCH: ${result.BRANCH}`);
    console.log(`HAS_GIT: ${result.HAS_GIT}`);
  }
}
