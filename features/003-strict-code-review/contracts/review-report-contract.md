# Review Report Contract

## Purpose

هذا العقد يحدد البنية الإلزامية للتقرير التنفيذي الذي تنتجه ميزة
المراجعة الهندسية الصارمة.

## Inputs

- مستودع أو مساحة عمل قابلة للقراءة.
- نتائج قراءة الملفات الحاكمة.
- نتائج الأوامر المنفذة أو أسباب تعذرها.
- تصنيف موحد للنتائج.

## Output Sections

يجب أن يخرج التقرير النهائي بهذا الترتيب:

1. Executive Summary
2. Critical Issues Table
3. Layer-by-Layer Findings
4. Confidence and Coverage
5. Repair Priority Map
6. Action Plan

ويجب أن يحتوي قسم
`Executive Summary`
على سطر حكم تنفيذي قابل للاستهلاك آليًا بصيغة:

```text
**Verdict**: 🟢 APPROVED
**Verdict**: 🟡 APPROVED WITH CONDITIONS
**Verdict**: 🔴 CHANGES REQUIRED
```

حتى يبقى التقرير متوافقًا مع بوابات التنفيذ اللاحقة.

ويجب أن يحتوي أيضًا على البنود التالية بصيغة bullets:

- Scope
- Review Mode
- Confidence
- Executive Judgment
- **Verdict**

كما يجب أن يحتوي قسم
`Layer-by-Layer Findings`
على الأقسام الفرعية التالية بهذا الترتيب:

1. Toolchain and Workspace
2. Automated Checks
3. Documentation Drift
4. Frontend
5. Editor Subtree
6. Backend
7. Shared Packages
8. Frontend–Backend Integration
9. Security and Production Readiness

## Finding Schema

| Field | Requirement |
|-------|-------------|
| type | واحد فقط من: confirmed_error, potential_risk, design_weakness, documentation_drift, execution_gap, out_of_scope |
| severity | واحد فقط من: critical, high, medium, low |
| layer | طبقة تنفيذية قابلة للتتبع مثل: toolchain_workspace, automated_checks, documentation_drift, frontend, editor_subtree, backend, shared_packages, frontend_backend_integration, security_production_readiness |
| location | ملف أو مجلد أو نمط محدد |
| problem | وصف مباشر للخلل |
| evidence | دليل بنيوي أو تشغيلي |
| impact | ما الذي قد ينكسر أو يفشل |
| fix | إجراء واضح وقابل للتنفيذ بأقل تعديل ممكن |

## Failure Behavior

- إذا تعذر تشغيل فحص حرج، يجب أن يظهر التعذر داخل قسم
  `Confidence and Coverage`
  مع أثره على الثقة.
- إذا لم توجد طبقة في المشروع، يجب التصريح بغيابها بدل اختلاق نتائج عنها.
- إذا تكرر السبب الجذري عبر طبقات متعددة، يجب دمجه في نتيجة نهائية واحدة.
- إذا بقي الحكم التنفيذي غير قابل للاشتقاق من الملف الناتج، يجب أن يفشل
  `setup-review --validate-existing`
  صراحة.

## Non-Goals

- هذا العقد لا يفرض تنسيق واجهة رسومية.
- هذا العقد لا يفرض إصلاحات تلقائية.
- هذا العقد لا يحوّل التقرير إلى درس نظري أو شرح تعليمي.
