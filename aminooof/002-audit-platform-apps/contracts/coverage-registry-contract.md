# Contract: Coverage Registry

## Purpose

هذا العقد يحدد السجل الرسمي لتغطية أهداف التدقيق داخل النطاق.

## Record Schema

| Field | Description | Allowed Values |
|-------|-------------|----------------|
| `path` | المسار الكامل أو النسبي داخل المستودع | قيمة واحدة فريدة لكل هدف |
| `targetType` | نوع الهدف | `root`, `web`, `backend`, `shared-linked` |
| `expectedLayers` | الطبقات المتوقع فحصها | قائمة نصية مضبوطة |
| `coverageStatus` | حالة التغطية الحالية | `inspected`, `blocked`, `out_of_scope`, `not_present` |
| `blockedReason` | سبب التعذر أو الغياب | نص قصير أو فارغ |
| `evidenceRef` | مرجع الدليل | مسار، أمر، أو معرف نتيجة |

## Target Baseline

**Target Count**:
`28`

### Web Targets

| Relative Path | Target Type | Expected Layers |
|---------------|-------------|-----------------|
| `apps/web/src/app/(main)/brain-storm-ai` | `web` | `config`, `toolchain`, `frontend`, `integration`, `security`, `performance`, `production` |
| `apps/web/src/app/(main)/BREAKAPP` | `web` | `config`, `toolchain`, `frontend`, `integration`, `security`, `performance`, `production` |
| `apps/web/src/app/(main)/breakdown` | `web` | `config`, `toolchain`, `frontend`, `integration`, `security`, `performance`, `production` |
| `apps/web/src/app/(main)/BUDGET` | `web` | `config`, `toolchain`, `frontend`, `integration`, `security`, `performance`, `production` |
| `apps/web/src/app/(main)/cinematography-studio` | `web` | `config`, `toolchain`, `frontend`, `integration`, `security`, `performance`, `production` |
| `apps/web/src/app/(main)/development` | `web` | `config`, `toolchain`, `frontend`, `integration`, `security`, `performance`, `production` |
| `apps/web/src/app/(main)/directors-studio` | `web` | `config`, `toolchain`, `frontend`, `integration`, `security`, `performance`, `production` |
| `apps/web/src/app/(main)/editor` | `web` | `config`, `toolchain`, `frontend`, `integration`, `security`, `performance`, `production` |
| `apps/web/src/app/(main)/styleIST` | `web` | `config`, `toolchain`, `frontend`, `integration`, `security`, `performance`, `production` |
| `apps/web/src/app/(main)/actorai-arabic` | `web` | `config`, `toolchain`, `frontend`, `integration`, `security`, `performance`, `production` |
| `apps/web/src/app/(main)/analysis` | `web` | `config`, `toolchain`, `frontend`, `integration`, `security`, `performance`, `production` |
| `apps/web/src/app/(main)/arabic-creative-writing-studio` | `web` | `config`, `toolchain`, `frontend`, `integration`, `security`, `performance`, `production` |
| `apps/web/src/app/(main)/arabic-prompt-engineering-studio` | `web` | `config`, `toolchain`, `frontend`, `integration`, `security`, `performance`, `production` |
| `apps/web/src/app/(main)/art-director` | `web` | `config`, `toolchain`, `frontend`, `integration`, `security`, `performance`, `production` |
| `apps/web/src/app/(main)/brainstorm` | `web` | `config`, `toolchain`, `frontend`, `integration`, `security`, `performance`, `production` |

### Backend Targets

| Relative Path | Target Type | Expected Layers |
|---------------|-------------|-----------------|
| `apps/backend/src/queues` | `backend` | `config`, `toolchain`, `server`, `shared`, `integration`, `security`, `performance`, `production` |
| `apps/backend/src/scripts` | `backend` | `config`, `toolchain`, `server`, `shared`, `integration`, `security`, `performance`, `production` |
| `apps/backend/src/services` | `backend` | `config`, `toolchain`, `server`, `shared`, `integration`, `security`, `performance`, `production` |
| `apps/backend/src/test` | `backend` | `config`, `toolchain`, `server`, `shared`, `integration`, `security`, `performance`, `production` |
| `apps/backend/src/types` | `backend` | `config`, `toolchain`, `server`, `shared`, `integration`, `security`, `performance`, `production` |
| `apps/backend/src/utils` | `backend` | `config`, `toolchain`, `server`, `shared`, `integration`, `security`, `performance`, `production` |
| `apps/backend/src/__tests__` | `backend` | `config`, `toolchain`, `server`, `shared`, `integration`, `security`, `performance`, `production` |
| `apps/backend/src/agents` | `backend` | `config`, `toolchain`, `server`, `shared`, `integration`, `security`, `performance`, `production` |
| `apps/backend/src/config` | `backend` | `config`, `toolchain`, `server`, `shared`, `integration`, `security`, `performance`, `production` |
| `apps/backend/src/controllers` | `backend` | `config`, `toolchain`, `server`, `shared`, `integration`, `security`, `performance`, `production` |
| `apps/backend/src/db` | `backend` | `config`, `toolchain`, `server`, `shared`, `integration`, `security`, `performance`, `production` |
| `apps/backend/src/examples` | `backend` | `config`, `toolchain`, `server`, `shared`, `integration`, `security`, `performance`, `production` |
| `apps/backend/src/middleware` | `backend` | `config`, `toolchain`, `server`, `shared`, `integration`, `security`, `performance`, `production` |

## Validation Rules

1. كل هدف رسمي يظهر مرة واحدة فقط.
2. لا يستخدم أي وضع غير القيم المعتمدة.
3. المسار المفقود يسجل

```text
not_present
```

ولا يتحول تلقائيًا إلى خطأ كود.
4. أي هدف خارج

```text
sys.md
```

لا يدخل السجل إلا عبر تغيير معتمد.
5. غياب طبقة غير متوقعة عن هدف محدد يسجل

```text
out_of_scope
```

أو

```text
not_present
```

ولا يتحول تلقائيًا إلى

```text
finding
```
6. أي تنفيذ يغطي جزءًا فقط من الواجهة أو الخلفية يجب أن يذكر ذلك داخل

```text
blockedReason
```

أو

```text
evidenceRef
```

بصياغة صريحة.
