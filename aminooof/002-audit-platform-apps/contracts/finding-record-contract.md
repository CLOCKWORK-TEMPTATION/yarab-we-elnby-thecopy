# Contract: Finding Record

## Purpose

هذا العقد يحدد الشكل الإلزامي لكل نتيجة نهائية داخل جدول المشكلات أو نتائج
الطبقات.

## Record Schema

| Field | Description | Allowed Values |
|-------|-------------|----------------|
| `findingId` | معرف النتيجة | قيمة فريدة |
| `type` | نوع النتيجة | `خطأ مؤكد`, `خطر محتمل`, `ضعف تصميمي`, `تحسين مقترح` |
| `severity` | الشدة | `حرج`, `عالٍ`, `متوسط`, `منخفض` |
| `layer` | الطبقة | `config`, `toolchain`, `server`, `shared`, `frontend`, `integration`, `security`, `performance`, `production` |
| `location` | الملف أو المجلد أو النمط | نص إلزامي |
| `problem` | وصف مباشر للمشكلة | نص إلزامي |
| `evidence` | السلوك أو الدليل البنيوي أو نتيجة التشغيل | نص إلزامي |
| `impact` | الأثر المتوقع | نص إلزامي |
| `fix` | الإجراء المقترح | نص إلزامي |
| `mergedFrom` | نتائج خام دُمجت في هذه النتيجة | اختياري |

## Validation Rules

1. لا تقبل نتيجة بلا

```text
location
problem
evidence
impact
fix
```

2. إذا ظهر الخلل نفسه في أكثر من طبقة، يجب دمجه بدل تكراره.
3. أي نتيجة تحمل

```text
خطأ مؤكد
```

أو

```text
خطر محتمل
```

يجب أن تبقى مدعومة بدليل صريح.
4. إذا دُمجت نتائج متعددة، يجب أن يظهر

```text
mergedFrom
```

كمصفوفة مراجع أو قائمة نصية قابلة للتتبع.
5. أعلى شدة داخل النتائج الخام المدمجة تبقى هي الشدة النهائية.
6. لا يجوز أن تجمع نتيجة واحدة بين أكثر من سبب جذري مستقل.

## Layer-to-Stage Reference

| Layer | Typical Stages |
|-------|----------------|
| `config` | 1, 4 |
| `toolchain` | 1, 2, 3 |
| `server` | 5 |
| `shared` | 6 |
| `frontend` | 7 |
| `integration` | 3, 5, 6, 7, 8 |
| `security` | 4, 5, 8, 9 |
| `performance` | 6, 7, 10 |
| `production` | 4, 10 |
