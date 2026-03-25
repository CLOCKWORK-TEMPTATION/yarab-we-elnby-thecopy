// Setup analysis prerequisites for a feature
import { existsSync } from 'fs';
import { join } from 'path';
import {
  getCurrentBranch,
  getFeatureDir,
  getFeaturePathsEnv,
  getRepoRoot,
  parseArgs,
  testFeatureBranch
} from './common.mjs';

export default async function main(argv) {
  const opts = parseArgs(argv);

  if (opts.help) {
    console.log('Usage: syskit setup-analyze [OPTIONS]');
    console.log('  --branch  Target feature branch');
    console.log('  --json    Output results in JSON format');
    console.log('  --help    Show this help message');
    return;
  }

  const repoRoot = getRepoRoot();
  const paths = getFeaturePathsEnv();
  const branch = opts.branch || paths.CURRENT_BRANCH || getCurrentBranch();
  const featureDir = opts.branch
    ? getFeatureDir(repoRoot, branch)
    : paths.FEATURE_DIR;

  // Validate policy file exists
  const policyPath = join(repoRoot, 'docs', 'policies', 'analyze-policy.md');
  if (!existsSync(policyPath)) {
    console.error('ERROR: Analyze policy file not found at docs/policies/analyze-policy.md');
    process.exit(1);
  }

  // Gather artifact inventory
  const artifacts = {
    sys: existsSync(join(featureDir, 'sys.md')),
    plan: existsSync(join(featureDir, 'plan.md')),
    tasks: existsSync(join(featureDir, 'tasks.md')),
    research: existsSync(join(featureDir, 'research.md')),
    agents: existsSync(join(featureDir, 'AGENTS.md')),
    contracts: existsSync(join(featureDir, 'contracts'))
  };

  const availableArtifacts = Object.entries(artifacts)
    .filter(([, exists]) => exists)
    .map(([name]) => name);

  if (availableArtifacts.length === 0) {
    console.error(`ERROR: No analyzable artifacts found in ${featureDir}`);
    console.error('At least one feature artifact (sys.md, plan.md, tasks.md, etc.) must exist.');
    process.exit(1);
  }

  const result = {
    FEATURES_DIR: featureDir,
    AMINOOOF_DIR: featureDir,
    BRANCH: branch,
    HAS_GIT: paths.HAS_GIT,
    POLICY_PATH: policyPath,
    artifacts,
    available_artifacts: availableArtifacts
  };

  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`FEATURES_DIR: ${featureDir}`);
    console.log(`POLICY_PATH: ${policyPath}`);
    console.log(`Available artifacts: ${availableArtifacts.join(', ')}`);
  }
}
