# Contract: Automated Check Execution

## Purpose

هذا العقد يضبط طريقة تسجيل نتائج الفحوصات الآلية الأساسية.

## Required Checks

- `lint`
- `type-check`
- `test`
- `build`

## Coverage Rules

1. كل فحص من الفحوصات الأربعة يجب أن يسجل مرة واحدة على الأقل في كل جولة.
2. إذا غطى الفحص المستودع كله، يسجل

```text
repo-root
```

داخل

```text
scope
```
3. إذا غطى الفحص جزءًا فقط من واجهة الويب أو الخلفية، يجب أن يذكر الجزء المغطى حرفيًا داخل

```text
scope
```

أو داخل

```text
directCause
```
4. تضييق التغطية لا يُسجل

```text
executed
```

بمعنى النجاح الكامل إلا إذا كانت حدود النطاق موثقة صراحة.

## Confidence Impact Rules

| Situation | Required Status | Required Confidence Impact |
|-----------|-----------------|----------------------------|
| الفحص نفذ على كامل النطاق المستهدف | `executed` | `low` |
| الفحص فشل مع مخرجات صريحة | `failed` | `high` |
| الفحص حُجب بسبب بيئة أو أداة أو غياب ملف | `blocked` | `medium` أو `high` حسب الاتساع |
| الفحص غطى جزءًا فقط من تطبيقات الويب | `executed` أو `blocked` مع توضيح جزئية النطاق | `medium` |
| الفحص غطى جزءًا فقط من تطبيقات الخلفية | `executed` أو `blocked` مع توضيح جزئية النطاق | `medium` |

## Record Schema

| Field | Description | Allowed Values |
|-------|-------------|----------------|
| `checkName` | اسم الفحص | أحد الفحوصات الأربعة فقط |
| `scope` | نطاق التنفيذ | `repo-root`, `web`, `backend`, `target-specific` |
| `status` | حالة التنفيذ | `executed`, `failed`, `blocked` |
| `directCause` | السبب المباشر للفشل أو التعذر | نص قصير |
| `confidenceImpact` | أثر الحالة على الحكم النهائي | `low`, `medium`, `high` |
| `outputRef` | مرجع output أو ملخصه | مسار أو ملخص أمر |

## Validation Rules

1. يجب توثيق الفحوصات الأربعة على الأقل في كل جولة.
2. إذا كانت التغطية جزئية، يجب وصفها صراحة في

```text
scope
```

أو

```text
directCause
```

3. لا يجوز مساواة

```text
executed
```

بالحكم النهائي على الجاهزية.
4. أي حالة

```text
blocked
```

يجب أن تحتوي سببًا مباشرًا صالحًا للقراءة البشرية.
5. لا يجوز ترك

```text
confidenceImpact
```

فارغًا في أي سجل.
