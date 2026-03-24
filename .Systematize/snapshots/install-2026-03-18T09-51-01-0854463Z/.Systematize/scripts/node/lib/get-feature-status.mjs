// حالة feature — مكافئ get-feature-status.ps1
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { getFeaturePathsEnv, getFeatureDir, parseArgs } from './common.mjs';
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
  const sysContent = read(sysFile);
  const resolved = (sysContent.match(/→ A:/g) || []).length;
  phases.clarify = { status: resolved > 0 ? 'complete' : 'not_started', questions_resolved: resolved };

  // Research, Plan, Tasks
  for (const [name, file] of [['research','research.md'],['plan','plan.md'],['tasks','tasks.md']]) {
    phases[name] = { status: existsSync(join(featureDir, file)) ? 'complete' : 'not_started', file_exists: existsSync(join(featureDir, file)) };
  }

  // Constitution
  const constitutionFile = join(featureDir, '..', '..', '.Systematize', 'memory', 'constitution.md');
  phases.constitution = { status: existsSync(constitutionFile) && !read(constitutionFile).includes('[PROJECT_NAME]') ? 'complete' : 'not_started', file_exists: existsSync(constitutionFile) };

  // Checklist
  const checklistDir = join(featureDir, 'checklists');
  const hasChecklists = existsSync(checklistDir) && readdirSync(checklistDir).length > 0;
  phases.checklist = { status: hasChecklists ? 'complete' : 'not_started', files_count: hasChecklists ? readdirSync(checklistDir).length : 0 };

  // Implementation (check for completed tasks in tasks.md)
  const tasksFile = join(featureDir, 'tasks.md');
  const tasksContent = read(tasksFile);
  const completedTasks = (tasksContent.match(/\[X\]|\[x\]/g) || []).length;
  phases.implementation = { status: completedTasks > 0 ? 'in_progress' : 'not_started', completed_tasks: completedTasks };

  const health = evaluateFeatureHealth(featureDir);
  const lastActivity = getFeatureLastActivity(featureDir);

  // Next step
  const order = ['systematize','clarify','research','plan','tasks','constitution','checklist','implementation'];
  const cmdMap = { systematize: '/syskit.systematize', clarify: '/syskit.clarify', research: '/syskit.research', plan: '/syskit.plan', tasks: '/syskit.tasks', constitution: '/syskit.constitution', checklist: 'checklists', implementation: 'implement' };
  let nextStep = 'complete';
  for (const p of order) {
    if (phases[p].status === 'not_started') { nextStep = cmdMap[p]; break; }
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
