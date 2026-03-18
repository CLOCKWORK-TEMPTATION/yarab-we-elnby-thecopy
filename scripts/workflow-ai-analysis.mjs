import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const MODEL_NAME = 'models/gemini-3-pro-preview';
const OUTPUT_BASE = process.env.WORKFLOW_OUTPUT_DIR || 'D:\\المسار';
const WORKSPACE_ROOT = path.resolve(__dirname, '..');

function findLatestReportsDir() {
  const dirs = fs.readdirSync(OUTPUT_BASE, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.startsWith('reports_'))
    .map(d => ({ name: d.name, stat: fs.statSync(path.join(OUTPUT_BASE, d.name)) }))
    .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
  if (!dirs.length) throw new Error('No reports_* directory found in external output path');
  return path.join(OUTPUT_BASE, dirs[0].name);
}

function readJsonLoose(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  try { return JSON.parse(raw); } catch {
    const s = Math.min(...['{', '['].map(t => raw.indexOf(t)).filter(i => i >= 0));
    const e = Math.max(raw.lastIndexOf('}'), raw.lastIndexOf(']'));
    if (s >= 0 && e > s) {
      try { return JSON.parse(raw.slice(s, e + 1)); } catch { return null; }
    }
    return null;
  }
}

function readCleanupConfig() {
  const p = path.join(WORKSPACE_ROOT, 'cleanup_config.json');
  return readJsonLoose(p) || {
    repo_path: './',
    ignore_patterns: ['node_modules', '.git', 'dist', 'build', '__pycache__'],
    entry_points: ['frontend/src/app/page.tsx', 'backend/src/server.ts'],
    protected_files: ['package.json', 'pnpm-lock.yaml', 'tsconfig.json', '.env.example', 'README.md'],
    dry_run: true,
  };
}

function collectFiles(rootDir, ignorePatterns, protectedFiles) {
  const out = {};
  function walk(abs) {
    const entries = fs.readdirSync(abs, { withFileTypes: true });
    for (const e of entries) {
      const relFromRoot = path.relative(rootDir, path.join(abs, e.name)).replace(/\\/g, '/');
      if (ignorePatterns.some(p => relFromRoot.startsWith(p))) continue;
      if (e.isDirectory()) { walk(path.join(abs, e.name)); continue; }
      if (protectedFiles.includes(relFromRoot)) continue;
      const absFile = path.join(abs, e.name);
      out[relFromRoot] = {
        absolute_path: absFile,
        relative_path: relFromRoot,
        extension: path.extname(e.name),
        size_bytes: fs.statSync(absFile).size,
        is_protected: false,
        analysis_status: 'pending'
      };
    }
  }
  walk(rootDir);
  return out;
}

function buildGraphMaps(depMap) {
  const imports = depMap?.imports || {};
  const importedBy = depMap?.imported_by || {};
  return { imports, importedBy };
}

function calculateDistanceFromEntries(filePath, entries, imports) {
  // BFS from entry points over imports edges to reach filePath
  const target = filePath;
  const visited = new Set();
  const queue = [];
  for (const ep of entries) queue.push({ f: ep, d: 0 });
  while (queue.length) {
    const { f, d } = queue.shift();
    if (visited.has(f)) continue;
    visited.add(f);
    if (f === target) return d;
    const deps = imports[f] || [];
    for (const nxt of deps) queue.push({ f: nxt, d: d + 1 });
  }
  return -1;
}

function summarizeFileStructure(absPath) {
  try {
    const content = fs.readFileSync(absPath, 'utf8');
    const lines = content.split(/\r?\n/);
    return {
      line_count: lines.length,
      starts_with: lines[0]?.slice(0, 100) || '',
      ends_with: lines.slice(-1)[0]?.slice(0, 100) || '',
    };
  } catch { return { line_count: 0 }; }
}

function buildPrompt(basePrompt, fileInfo, deps, distance) {
  const content = fileInfo.size_bytes < 50000
    ? (() => { try { return fs.readFileSync(fileInfo.absolute_path, 'utf8'); } catch { return ''; } })()
    : JSON.stringify(summarizeFileStructure(fileInfo.absolute_path), null, 2);
  const contentSection = fileInfo.size_bytes < 50000
    ? `### محتوى الملف الكامل:\n\n\n${content}\n\n`
    : `### ملخص هيكل الملف (ملف كبير):\n${content}\n`;
  return `${basePrompt}\n---\n# معلومات الملف للتحليل\n- المسار: ${fileInfo.relative_path}\n- الحجم: ${fileInfo.size_bytes} بايت\n- الامتداد: ${fileInfo.extension}\n- مستورد من: ${(deps.importedBy[fileInfo.relative_path]||[]).length} ملفات\n- يعتمد على: ${(deps.imports[fileInfo.relative_path]||[]).length} ملفات\n- المسافة من entry: ${distance}\n\n${contentSection}\nأعد إجابة JSON فقط حسب التنسيق المحدد.`;
}

const CLEANUP_FOCUSED_PROMPT = `**الهدف الأساسي:** أنت مساعد خبير متخصص في تنظيف المستودعات البرمجية. مهمتك تحديد الملفات الآمنة للحذف للحصول على مستودع نظيف حيث كل ملف مفعّل وله علاقة مباشرة بالتطبيق.

اتبع المعايير الصارمة المذكورة وارجع إخراجًا بصيغة JSON فقط وفق التنسيق المحدد (decision/confidence/reasons/usage_analysis/risk_assessment/recommendation). لا تُرجع أي نص خارج JSON.`;

function parseModelJson(text) {
  if (!text) return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch { return null; }
  }
  return null;
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not found in .env');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const reportsDir = findLatestReportsDir();
  const depMapPath = path.join(reportsDir, 'dependency-map.json');
  const depMap = readJsonLoose(depMapPath) || {};
  const cfg = readCleanupConfig();

  const rootDir = path.resolve(WORKSPACE_ROOT, cfg.repo_path);
  const files = collectFiles(rootDir, cfg.ignore_patterns || [], cfg.protected_files || []);
  const { imports, importedBy } = buildGraphMaps(depMap);

  const entryPoints = (cfg.entry_points || []).map(ep => ep.replace(/\\/g, '/'));

  const results = {};
  const fileList = Object.values(files);

  // Prioritize candidates with no importers (likely unused)
  fileList.sort((a, b) => {
    const ai = (importedBy[a.relative_path] || []).length;
    const bi = (importedBy[b.relative_path] || []).length;
    return ai - bi;
  });

  const concurrency = 3;
  let idx = 0;
  async function worker(id) {
    while (idx < fileList.length) {
      const f = fileList[idx++];
      const distance = calculateDistanceFromEntries(f.relative_path, entryPoints, imports);
      const prompt = buildPrompt(CLEANUP_FOCUSED_PROMPT, f, { imports, importedBy }, distance);
      try {
        const resp = await model.generateContent(prompt);
        const text = resp?.response?.text?.() || resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const analysis = parseModelJson(text) || {
          decision: 'UNCERTAIN', confidence: 50, reasons: ['Parsing failure'],
          usage_analysis: { is_imported: !!(importedBy[f.relative_path]?.length), import_count: (importedBy[f.relative_path]?.length)||0, distance_from_entry: distance, has_unused_exports: false },
          risk_assessment: { deletion_safety_score: 0, potential_impact: 'unknown', affected_files: [] },
          recommendation: 'مراجعة يدوية مطلوبة'
        };
        results[f.relative_path] = {
          analysis,
          file_info: {
            absolute_path: f.absolute_path,
            relative_path: f.relative_path,
            extension: f.extension,
            size_bytes: f.size_bytes,
            is_protected: false,
            analysis_status: 'done'
          }
        };
        process.stdout.write(`\rAnalysed ${Object.keys(results).length}/${fileList.length}`);
      } catch (e) {
        results[f.relative_path] = {
          analysis: {
            decision: 'UNCERTAIN', confidence: 40, reasons: [String(e?.message || e)],
            usage_analysis: { is_imported: !!(importedBy[f.relative_path]?.length), import_count: (importedBy[f.relative_path]?.length)||0, distance_from_entry: distance, has_unused_exports: false },
            risk_assessment: { deletion_safety_score: 0, potential_impact: 'unknown', affected_files: [] },
            recommendation: 'فشل الاتصال بالنموذج أو تحليل غير مكتمل'
          },
          file_info: f
        };
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, (_, i) => worker(i)));

  const outAnalysis = path.join(reportsDir, 'ai_analysis_results.json');
  fs.writeFileSync(outAnalysis, JSON.stringify(results, null, 2));

  const deleteList = Object.entries(results)
    .filter(([_, v]) => v?.analysis?.decision === 'DELETE_SAFE')
    .map(([k]) => k)
    .join('\n');
  fs.writeFileSync(path.join(reportsDir, 'delete_safe_files.txt'), deleteList, 'utf8');

  console.log(`\nWritten: ${outAnalysis}`);
  console.log(`Delete list: ${path.join(reportsDir, 'delete_safe_files.txt')}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
