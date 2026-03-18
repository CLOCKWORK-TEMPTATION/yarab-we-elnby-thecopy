// حالة feature — مكافئ get-feature-status.ps1
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import {
  getClarificationStatus,
  getConstitutionStatus,
  getDocumentCompletionStatus,
  getFeatureDir,
  getFeaturePathsEnv,
  parseArgs
} from './common.mjs';
import { evaluateFeatureHealth, getFeatureLastActivity } from './health.mjs';

export default async function main(argv) {
  const opts = parseArgs(argv);
  if (opts.help) { console.log('Usage: syskit feature-status [--branch <name>] [--json]'); return; }

  const env = getFeaturePathsEnv();
  const branch = opts.branch || env.CURRENT_BRANCH;
  const featureDir = opts.branch ? getFeatureDir(env.REPO_ROOT, opts.branch) : env.FEATURE_DIR;

  if (!existsSync(featureDir)) { console.error(`❌ Not found: ${featureDir}`); process.exit(1); }

  const read = (f) => existsSync(f) ? readFileSync(f, 'utf8') : '';
  const phases = {};

  // Systematize
  const sysFile = join(featureDir, 'sys.md');
  phases.systematize = existsSync(sysFile) ? { status: 'complete', file_exists: true } : { status: 'not_started', file_exists: false };

  // Clarify
  phases.clarify = getClarificationStatus(featureDir);

  // Constitution
  phases.constitution = getConstitutionStatus(env.REPO_ROOT);

  // Research, Plan, Tasks
  phases.research = getDocumentCompletionStatus(join(featureDir, 'research.md'));
  phases.plan = getDocumentCompletionStatus(join(featureDir, 'plan.md'));
  phases.tasks = getDocumentCompletionStatus(join(featureDir, 'tasks.md'));

  // Checklist
  const checklistDir = join(featureDir, 'checklists');
  const hasChecklists = existsSync(checklistDir) && readdirSync(checklistDir).length > 0;
  phases.checklist = { status: hasChecklists ? 'complete' : 'not_started', files_count: hasChecklists ? readdirSync(checklistDir).length : 0 };

  // Implementation (check for completed tasks in tasks.md)
  const tasksFile = join(featureDir, 'tasks.md');
  const tasksContent = read(tasksFile);
  const completedTasks = (tasksContent.match(/\[X\]|\[x\]/g) || []).length;
  phases.implementation = {
    status: completedTasks > 0 ? 'in_progress' : (phases.tasks.status === 'complete' ? 'complete' : 'not_started'),
    completed_tasks: completedTasks
  };

  const health = evaluateFeatureHealth(featureDir);
  const lastActivity = getFeatureLastActivity(featureDir);

  // Next step
  const order = ['systematize', 'clarify', 'constitution', 'research', 'plan', 'tasks', 'checklist', 'implementation'];
  const cmdMap = {
    systematize: '/syskit.systematize',
    clarify: '/syskit.clarify',
    constitution: '/syskit.constitution',
    research: '/syskit.research',
    plan: '/syskit.plan',
    tasks: '/syskit.tasks',
    checklist: '/syskit.checklist',
    implementation: '/syskit.implement'
  };
  let nextStep = 'complete';
  for (const p of order) {
    if (phases[p].status !== 'complete') { nextStep = cmdMap[p]; break; }
  }

  const result = {
    branch,
    phases,
    health_score: health.score,
    last_activity: lastActivity ? lastActivity.toISOString() : null,
    next_step: nextStep
  };

  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`\n📊 Status: ${branch}\n`);
    for (const [name, data] of Object.entries(phases)) {
      const icon = data.status === 'complete' ? '✅' : data.status === 'in_progress' ? '⏳' : '⬜';
      console.log(`${icon} ${name}`);
    }
    console.log(`\n💪 Health Score: ${health.score}/${health.maxScore}`);
    if (lastActivity) console.log(`🕐 Last Activity: ${lastActivity.toISOString()}`);
    console.log(`\nNext: ${nextStep}`);
  }
}
