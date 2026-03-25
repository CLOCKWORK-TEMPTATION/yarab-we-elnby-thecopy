# Contract: Audit Report

## Purpose

هذا العقد يحدد الشكل الإلزامي للتقرير التنفيذي النهائي الذي تنتجه ميزة
`Platform Multi-Layer Audit`.

## Required Section Order

1. `Executive Summary`
2. `Critical Issues Table`
3. `Layer-by-Layer Findings`
4. `Confidence and Coverage`
5. `Repair Priority Map`
6. `Action Plan`

## Required Fields

| Section | Required Fields |
|---------|-----------------|
| Executive Summary | review mode, confidence level, general state, top five issues, executive judgment |
| Critical Issues Table | id, severity, type, layer, location, description, impact, fix |
| Layer-by-Layer Findings | package/toolchain, automated checks, dev vs production, server/API, shared logic, frontend, integration, security, performance/readiness |
| Confidence and Coverage | executed checks, blocked checks, uncovered areas, confidence rationale |
| Repair Priority Map | immediate, before new features, deferrable, optional improvements |
| Action Plan | five phases only, each with goal, scope, required changes, success criteria |

## Required Layer Sections

1. `package.json and toolchain`
2. `automated checks`
3. `dev vs production boundaries`
4. `server and API`
5. `shared logic`
6. `frontend`
7. `frontend-backend integration`
8. `security`
9. `performance and production readiness`

## Validation Rules

1. لا يقبل التقرير إذا غاب قسم إلزامي أو تغيّر ترتيبه.
2. لا يقبل أكثر من حكم تنفيذي واحد.
3. يجب أن تظهر أخطر خمس مشكلات داخل الملخص التنفيذي.
4. لا يجوز أن تحتوي خطة الإصلاح على تقديرات زمنية.
5. لا يجوز إدراج أسرار أو قيم بيئية أو raw logs غير منقحة.
6. قسم

```text
Confidence and Coverage
```

يجب أن يذكر صراحة ما الذي شُغّل وما الذي تعذر تقييمه.
7. أقسام الطبقات التسعة تبقى ثابتة حتى لو كانت النتيجة

```text
No confirmed finding.
```

8. خطة الإصلاح تتكون من خمس مراحل فقط وبالعناوين نفسها الواردة في هذا العقد.
