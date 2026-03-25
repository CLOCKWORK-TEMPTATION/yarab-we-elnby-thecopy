---
description: Create or update the project constitution (27-section comprehensive structure with ID system, traceability, and completion scoring), ensuring all dependent templates stay in sync.
command_name: constitution
command_family: Gate
command_stage: phase-03
command_requirement_level: mandatory
command_visibility: primary
command_execution_mode: runtime-backed
runtime_command: generate-constitution
handoffs: 
  - label: Run Deep Research
    agent: syskit.research
    prompt: Run deep research for the feature based on the constitution and sys
    send: true
  - label: Build Sys
    agent: syskit.systematize
    prompt: Implement the feature systematize based on the updated constitution. I want to build...
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

You are updating the project constitution at `.Systematize/memory/constitution.md`. This file follows a **27-section structure** containing placeholder tokens in square brackets (e.g. `[PROJECT_NAME]`, `[PROBLEM_DESCRIPTION]`, `[REQUIREMENT]`). Your job is to (a) collect/derive concrete values, (b) fill sections progressively, and (c) propagate any amendments across dependent artifacts.

**Note**: If `.Systematize/memory/constitution.md` does not exist yet, generate it by running the constitution generator script or copy from `.Systematize/templates/constitution-template.md`.
   - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/generate-constitution.ps1`
   - **Node.js**: `node .Systematize/scripts/node/cli.mjs generate-constitution`

### Constitution Structure Reference

The constitution has 27 sections organized in 6 phases:

**Phase 1 — Foundation (Sections 1–6):**
- ١. تعريف الوثيقة — Document definition (static, rarely changes)
- ٢. الغرض — Purpose (static)
- ٣. القواعد الحاكمة — 10 immutable governing rules
- ٤. طريقة الاستخدام — Usage methodology + phase gates
- ٥. نظام المعرفات — Unified ID system (`RQ-`, `FR-`, `NFR-`, `BR-`, `ADR-`, `RK-`, `ASM-`, `TC-`, `AC-`)
- ٦. المخرجات الإلزامية — Mandatory outputs checklist

**Phase 2 — Identity & Stakeholders (Sections 7–8):**
- ٧. هوية المشروع — Project card, problem statement, value proposition, measurable objectives, scope
- ٨. أصحاب المصلحة — Stakeholders, RACI matrix, approval process, review cycle

**Phase 3 — Requirements & Rules (Sections 9–13):**
- ٩. أنواع الطلبات — Request types + request registry (`RQ-XXX`)
- ١٠. تحليل المستخدمين — User categories, journeys, edge cases
- ١١. المتطلبات الوظيفية — Functional requirements (`FR-XXX`) with trigger/input/output
- ١٢. المتطلبات غير الوظيفية — 12 NFR categories (`NFR-XXX`)
- ١٣. قواعد العمل — Business rules (`BR-XXX`)

**Phase 4 — Architecture & Design (Sections 14–17):**
- ١٤. البيانات — Entities, critical fields, data governance
- ١٥. التكاملات — External integrations (`INT-XXX`) with fallback plans
- ١٦. تجربة المستخدم — UX principles, interactive elements
- ١٧. المعمارية — System architecture, ADR registry (`ADR-XXX`), mandatory architecture questions

**Phase 5 — Verification & Risk (Sections 18–22):**
- ١٨. الأمن والخصوصية — Security, privacy, compliance matrix
- ١٩. التشغيل — Operations, monitoring, support levels
- ٢٠. الاختبارات — 6 test levels + acceptance criteria (`AC-XXX`)
- ٢١. الافتراضات والقيود — Assumptions (`ASM-XXX`), constraints, dependencies
- ٢٢. المخاطر — Risk registry (`RK-XXX`) across 8 domains

**Phase 6 — Execution & Governance (Sections 23–27):**
- ٢٣. مؤشرات النجاح — KPIs for foundation, execution, and operations phases
- ٢٤. خطة التنفيذ — 6-phase execution plan with gate criteria
- ٢٥. إدارة التغيير — Change management + amendment log
- ٢٦. مصفوفة التتبع — Cross-reference traceability matrix (RQ→OBJ→FR→BR→TC→AC)
- ٢٧. تقييم الاكتمال — 16-item checklist + 5 numeric completion metrics

### Constitution Profiles

The constitution supports 3 depth profiles configured via `constitution_profile` in `.Systematize/config/syskit-config.yml`:

| Profile | Sections Included | Use Case |
|---------|------------------|----------|
| **Lean** | §1-§7, §11, §22, §26, §27 (10 sections) | Personal project / prototype |
| **Standard** | §1-§22, §26, §27 (24 sections) | Commercial project |
| **Enterprise** | All 27+ sections | Enterprise / regulated project |

**Profile Selection Logic**:
1. Read `constitution_profile` from `.Systematize/config/syskit-config.yml`
2. If not set, default to `standard`
3. When filling sections, skip sections outside the active profile
4. Mark skipped sections with: `<!-- Skipped: [profile] profile does not require this section -->`

### Execution Flow

1. **Load** the existing constitution at `.Systematize/memory/constitution.md`.
   - Identify every placeholder token of the form `[ALL_CAPS_IDENTIFIER]`.
   - Count total remaining placeholders and filled sections.

2. **Collect/derive values** for placeholders:
   - If user input supplies a value, use it directly.
   - Otherwise infer from existing repo context (README, package.json, docs, prior constitution versions).
   - **ID system rules**: All new entries MUST use the correct prefix (`RQ-`, `OBJ-`, `FR-`, `NFR-`, `BR-`, `INT-`, `ADR-`, `RK-`, `ASM-`, `TC-`, `AC-`, `KPI-`) with sequential numbering.
   - **Version rules** — `CONSTITUTION_VERSION` increments per semantic versioning:
     - MAJOR: Backward-incompatible section removal, governing rule change, or structural overhaul.
     - MINOR: New section content filled, new entries added to registries, materially expanded guidance.
     - PATCH: Clarifications, wording, typo fixes, non-semantic refinements.
   - `CONSTITUTION_DATE` is the original creation date (keep unchanged after initial creation).
   - `LAST_AMENDED_DATE` is today if changes are made.

3. **Fill sections progressively** — respect the 6-phase order:
   - The user may request filling specific sections only. Fill those first.
   - If filling from scratch, prioritize the **minimum viable constitution** (the sections below are the essential core):
     1. Section 7 — Project identity + problem + scope
     2. Section 8 — Stakeholders + decision rights
     3. Section 9 — Request registry
     4. Section 11 — Functional requirements
     5. Section 12 — Non-functional requirements (at least Performance, Security, Availability)
     6. Section 13 — Business rules
     7. Section 22 — Risk registry
     8. Section 26 — Traceability matrix
     9. Section 27 — Completion checklist
   - For each table row added, ensure the ID system is respected.
   - Remove example/reference rows (lines starting with `> **مثال مرجعي**`) only AFTER adding real data rows.
   - Preserve the template's heading hierarchy exactly — do not demote/promote levels.

4. **Traceability validation** (Section 26):
   - Every `FR-XXX` MUST trace back to at least one `RQ-XXX`.
   - Every `AC-XXX` MUST link to at least one `FR-XXX`.
   - Every critical/high `RK-XXX` MUST have a mitigation plan.
   - Every critical `ASM-XXX` MUST have a verification method and owner.

5. **Completion scoring** (Section 27.2):
   - Calculate and update the numeric metrics:
     - نسبة اكتمال الأقسام (sections filled / total sections)
     - نسبة العناصر ذات المالك (items with owner / total items)
     - نسبة الافتراضات المغلقة (verified assumptions / critical assumptions)
     - نسبة المتطلبات المرتبطة بقبول (FR with AC / total FR)
     - نسبة المخاطر بخطة تخفيف (RK with mitigation / critical+high RK)
   - Update the checklist in Section 27.1 — mark ☐ نعم for satisfied items.

6. **Fill the Executive Summary** (الملخص التنفيذي):
   - This section provides a ≤1-page daily-use summary of the full constitution.
   - Extract from filled sections:
     - **ما الذي نبنيه؟** → from Section 7 (problem, description, primary user, top value)
     - **حدود النطاق** → top 3 in-scope and top 3 out-of-scope from Section 7.5
     - **القرارات الحاكمة** → most impactful ADR entries from Section 17.2
     - **أهم المخاطر المفتوحة** → critical/high risks from Section 22
     - **حالة الاكتمال** → from Section 27.2 metrics
   - Update the Executive Summary after EVERY constitution edit — it must always reflect current state.
   - If a section is not yet filled, use `[pending]` in the summary field.

7. **Consistency propagation checklist**:
   - Read `.Systematize/templates/plan-template.md` — ensure any constitution references or rules align.
   - Read `.Systematize/templates/sys-template.md` — update if constitution adds/removes mandatory sections.
   - Read `.Systematize/templates/tasks-template.md` — ensure task types reflect constitution registries.
   - Read command files in `commands/` to verify no outdated references.
   - Read runtime guidance docs (README.md, AGENTS.md) — update principle references if changed.

8. **Produce a Sync Impact Report** (prepend as HTML comment at top of constitution file):
   - Version change: old → new
   - Sections filled or modified (list section numbers)
   - Registry entries added (e.g., `FR-001..FR-005`, `RK-001..RK-003`)
   - Traceability gaps found and resolved
   - Completion score before → after
   - Templates requiring updates (✅ updated / ⚠ pending) with file paths
   - Deferred TODOs with justification

9. **Validation before final output**:
   - No remaining unexplained bracket tokens (justify any intentionally left).
   - Version line matches report.
   - All dates in ISO format (YYYY-MM-DD).
   - All registry entries use correct ID prefixes and sequential numbering.
   - Traceability matrix has no orphaned references.
   - Completion checklist (Section 27.1) accurately reflects current state.
   - Language is declarative and testable — replace vague "should" with MUST/SHOULD + rationale.

10. **Write** the completed constitution back to `.Systematize/memory/constitution.md` (overwrite).

11. **Output final summary** to the user:
    - New version and bump rationale.
    - Completion score (percentage).
    - Sections filled vs remaining.
    - Traceability status (complete / gaps).
    - Files flagged for manual follow-up.
    - Suggested commit message (e.g., `docs: amend constitution to vX.Y.Z — filled sections 7-13, added FR-001..FR-012`).

### Formatting & Style Requirements

- Use Markdown headings exactly as in the template (Arabic numbered sections).
- All tables must use Markdown pipe syntax with header row.
- Keep a single blank line between sections.
- Avoid trailing whitespace.
- Wrap long lines for readability (<100 chars ideally) without awkward breaks.
- Reference examples in tables should be kept until replaced with real data.

### Partial Update Rules

- If the user supplies partial updates (e.g., only one section or a few registry entries), still:
  1. Perform traceability validation on affected entries.
  2. Update completion scoring in Section 27.
  3. Decide version bump type.
  4. Produce a focused Sync Impact Report.

- If critical info is missing, insert `TODO(<FIELD_NAME>): explanation` and include in the Sync Impact Report under deferred items.

- Do not create a new template; always operate on the existing `.Systematize/memory/constitution.md` file.

## Output

- **Primary format**: Constitution amendment summary in Markdown.
- **Files created or updated**: `.Systematize/memory/constitution.md` and any directly synchronized templates or guidance files that require alignment.
- **Success result**: New constitution version, completion metrics, sections filled, traceability status, and pending manual follow-up.
- **Exit status**: `0` when the constitution is validated and written; `1` when required placeholders cannot be resolved, traceability is broken, or versioning rules are violated.
- **Failure conditions**: Missing constitution template, unresolved critical placeholders, invalid ID sequencing, or inconsistent completion metrics.
