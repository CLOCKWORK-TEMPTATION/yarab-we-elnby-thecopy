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

## Finding Schema

| Field | Requirement |
|-------|-------------|
| type | واحد فقط من: confirmed error, potential risk, design weakness, suggested improvement |
| severity | واحد فقط من: critical, high, medium, low |
| layer | config, toolchain, server, shared, frontend, integration, security, performance, production |
| location | ملف أو مجلد أو نمط محدد |
| problem | وصف مباشر للخلل |
| evidence | دليل بنيوي أو تشغيلي |
| impact | ما الذي قد ينكسر أو يفشل |
| fix | إجراء واضح وقابل للتنفيذ |

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
