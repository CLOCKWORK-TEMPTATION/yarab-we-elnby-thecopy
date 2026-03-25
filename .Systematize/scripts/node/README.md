# Systematize Framework — Node Runtime Engine

المحرك التنفيذي الرسمي للمنظومة. يعمل على أي منصة تدعم Node.js 18+، ويُعد المرجع التشغيلي الأول، بينما تبقى طبقة PowerShell للتوافق والاستدعاء فقط.

## المتطلبات

- Node.js ≥ 18.0.0
- لا يحتاج اعتمادات تشغيل داخل هذه الحزمة الفرعية

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

# عرض حزم التوسعات
node .Systematize/scripts/node/cli.mjs list-extensions --json

# تثبيت توسعة
node .Systematize/scripts/node/cli.mjs install-extension export --json

# بناء حزمة التوزيع
node .Systematize/scripts/node/cli.mjs build-distribution --json
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
| `list-extensions` | — | عرض حزم التوسعات المتاحة |
| `install-extension` | — | تثبيت توسعة من الكتالوج |
| `remove-extension` | — | إزالة توسعة مثبتة |
| `build-distribution` | — | بناء حزمة توزيع رسمية |

## ملاحظات

- كل أمر يدعم `--json` و `--help`
- المحرك نفسه يعتمد على مكتبات Node.js المدمجة فقط
- الحزمة الجذرية في المستودع مخصصة للتحقق والتوليد والاختبارات والوثائق، وليست جزءًا من محرك التشغيل الموزع
