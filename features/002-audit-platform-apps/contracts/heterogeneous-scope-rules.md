# Contract: Heterogeneous Scope Rules

## Purpose

هذا العقد يحدد كيف تتعامل المراجعة مع أهداف ويب وخلفية ومنطق مشترك من دون
تحويل غياب الطبقة غير الموجودة أصلًا إلى نتيجة زائفة.

## Canonical Target Classes

| Target Type | Expected Layers | Out-of-Scope Layers |
|-------------|-----------------|---------------------|
| `web` | `config`, `toolchain`, `frontend`, `integration`, `security`, `performance`, `production` | `server`, `shared` |
| `backend` | `config`, `toolchain`, `server`, `shared`, `integration`, `security`, `performance`, `production` | `frontend` |
| `shared-linked` | `config`, `toolchain`, `shared`, `integration`, `security`, `performance`, `production` | `frontend`, `server` ما لم يثبت العكس |

## Coverage State Rules

| State | Meaning |
|-------|---------|
| `inspected` | الطبقة أو الهدف تمت مراجعتهما وخرجت منهما أدلة قابلة للاستخدام |
| `blocked` | كانت الطبقة متوقعة لكن تعذر فحصها بسبب أداة أو بيئة أو مدخل مفقود |
| `out_of_scope` | الطبقة ليست متوقعة لهذا الهدف أصلًا ولا تسجل كعيب |
| `not_present` | الطبقة متوقعة أو الهدف رسمي، لكن لم تُرصد أدلة كافية لفحصه ويجب تفسير ذلك |

## Root-Cause Merge Rules

1. السبب الجذري الواحد يسجل مرة واحدة فقط حتى لو ظهر في أكثر من طبقة أو أكثر
   من هدف.
2. عند الدمج، يحتفظ السجل النهائي بأعلى شدة ظهرت في السجلات الخام.
3. نتيجة الدمج يجب أن تحفظ

```text
mergedFrom
```

كمصفوفة أو قائمة قابلة للتتبع.
4. غياب طبقة

```text
out_of_scope
```

لا ينتج

```text
finding
```

إلا إذا كان هناك خرق صريح لعقد النطاق.

## Operator Rules

1. لا تفترض وجود

```text
server/API
```

داخل هدف واجهة فقط.
2. لا تفترض وجود

```text
frontend
```

داخل هدف خلفية فقط.
3. أهداف المنطق المشترك تراجع تحت

```text
shared logic
```

أولًا، وتدخل

```text
integration
```

فقط عند وجود عقد أو تبعية واضحة.
