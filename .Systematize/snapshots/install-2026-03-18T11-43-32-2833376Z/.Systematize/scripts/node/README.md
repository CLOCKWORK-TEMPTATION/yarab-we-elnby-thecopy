# Systematize KIT — Node.js CLI

بديل متطابق وظيفياً لسكريبتات PowerShell، يعمل على أي منصة تدعم Node.js 18+.

## المتطلبات

- Node.js ≥ 18.0.0
- لا يحتاج تثبيت اعتمادات (zero dependencies)

## الاستخدام

```bash
# عرض المساعدة
node .Systematize/scripts/node/cli.mjs --help

# فحص المتطلبات
node .Systematize/scripts/node/cli.mjs check-prerequisites --json

# فحص الصحة
node .Systematize/scripts/node/cli.mjs healthcheck --branch 001-user-auth

# حالة feature
node .Systematize/scripts/node/cli.mjs feature-status --json

# تصدير dashboard
node .Systematize/scripts/node/cli.mjs export-dashboard --branch 001-user-auth

# حفظ snapshot
node .Systematize/scripts/node/cli.mjs snapshot --tag pre-update

# تحديث حالة المزامنة
node .Systematize/scripts/node/cli.mjs update-sync-state
```

## الأوامر

| الأمر | المكافئ PowerShell | الوصف |
|-------|-------------------|-------|
| `create-feature` | `create-new-feature.ps1` | إنشاء feature جديد |
| `check-prerequisites` | `check-prerequisites.ps1` | فحص المتطلبات |
| `snapshot` | `snapshot-artifacts.ps1` | حفظ نسخة احتياطية |
| `healthcheck` | `run-healthcheck.ps1` | فحص صحة الوثائق |
| `export-dashboard` | `export-dashboard.ps1` | تصدير HTML dashboard |
| `check-alerts` | `check-alerts.ps1` | فحص التنبيهات |
| `feature-status` | `get-feature-status.ps1` | حالة feature |
| `auto-commit` | `auto-commit.ps1` | Auto-commit |
| `generate-pr` | `generate-pr.ps1` | توليد PR template |
| `record-analytics` | `record-analytics.ps1` | تسجيل تحليلات |
| `update-sync-state` | `update-sync-state.ps1` | تحديث المزامنة |

## ملاحظات

- كل أمر يدعم `--json` و `--help`
- بدون اعتمادات خارجية (zero dependencies) — يستخدم فقط مكتبات Node.js المدمجة
- نفس المعاملات ونفس المخرجات كسكريبتات PowerShell
