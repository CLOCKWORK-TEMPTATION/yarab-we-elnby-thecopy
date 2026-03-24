# Systematize KIT — دليل التوسعات (Extensions)

## الهيكل

```
extensions/
├── README.md              # هذا الملف
├── commands/              # أوامر مخصصة (ملفات .md)
│   └── .gitkeep
└── templates/             # قوالب مخصصة (تُكتشف تلقائياً بواسطة Resolve-Template)
    └── .gitkeep
```

## إضافة أمر مخصص

1. أنشئ ملف `.md` في `extensions/commands/` بنفس تنسيق أوامر `commands/`:
   - السياق (Context)
   - المبادئ (Principles)
   - خطوات التنفيذ (Steps)
   - القواعد (Rules)
   - المخرجات (Output)

2. سجّل الأمر في `.Systematize/config/extensions.yml`:
   ```yaml
   custom_commands:
     - name: "syskit.mycommand"
       command_file: ".Systematize/extensions/commands/mycommand.md"
       description: "My custom command"
       position_after: "syskit.tasks"
   ```

## إضافة قالب مخصص

1. ضع ملف القالب في `extensions/templates/` بنفس اسم القالب الأساسي:
   - مثال: `sys-template.md` → يُستخدم بدلاً من القالب الأساسي (أولوية 3)

2. أولوية القوالب (من الأعلى):
   1. `templates/overrides/` — تخصيصات المستخدم
   2. `presets/*/templates/` — القوالب المتخصصة
   3. `extensions/*/templates/` — قوالب التوسعات ← **أنت هنا**
   4. `templates/` — القوالب الأساسية

## إضافة Hooks

Hooks تعمل قبل/بعد كل أمر. أضفها في `extensions.yml`:

```yaml
hooks:
  after_tasks:
    - extension: "my-extension"
      command: "syskit.mycheck"
      description: "Run custom validation after tasks"
      enabled: true
      optional: false
      prompt: "Verify tasks meet custom criteria"
```

### خصائص Hook

| الخاصية | النوع | الوصف |
|---------|-------|-------|
| extension | string | اسم التوسعة |
| command | string | الأمر المراد تنفيذه |
| description | string | وصف الـ hook |
| enabled | bool | تفعيل/تعطيل |
| optional | bool | إلزامي أم اختياري |
| condition | string | شرط التنفيذ (اختياري) |
| prompt | string | رسالة للمستخدم (اختياري) |
```

## أمثلة الاستخدام

### مثال 1: إضافة أمر مراجعة مخصص

ملف: `.Systematize/extensions/commands/review.md`

```markdown
# Custom: Review Checklist

## Context
الأمر: `syskit.review`
الغرض: تنفيذ قائمة مراجعة مخصصة لضمان جودة المشروع

## Principles
- استقلالية كاملة عن الأوامر الأساسية
- إمكانية التفعيل/التعطيل من `extensions.yml`
- دعم الـ hooks قبل/بعد التنفيذ

## Steps
1. تحميل قائمة المراجعة من `extensions/templates/review-checklist.md`
2. التحقق من كل بند
3. إنشاء تقرير النتائج

## Rules
- لا تعدّل الملفات الأساسية
- احفظ النتائج في `.Systematize/memory/review-results.json`

## Output
```json
{
  "timestamp": "ISO-8601",
  "total_checks": 10,
  "passed": 8,
  "failed": 2,
  "skipped": 0
}
```
```

### مثال 2: إضافة hook للتحقق المخصص

في `.Systematize/config/extensions.yml`:

```yaml
hooks:
  after_tasks:
    - extension: "quality-assurance"
      command: "syskit.review"
      description: "Run quality assurance checks after task generation"
      enabled: true
      optional: false
      prompt: "Run custom QA checklist before proceeding?"
```

### مثال 3: قالب مخصص

ملف: `.Systematize/extensions/templates/sys-charter.md`

هذا يستبدل القالب الأساسي في `templates/` (الأولوية 3) فقط عند استدعاء `Resolve-Template -TemplateName sys-charter`.

## الترتيب والأولويات

### ترتيب Hook Execution

1. `before_<command>` hooks (ترتيب YAML)
2. تنفيذ الأمر الأساسي
3. `after_<command>` hooks (ترتيب YAML)
4. معالجة الأخطاء: `on_error` (إذا حدث خطأ)

### أولوية القوالب (Resolve-Template)

```
1. .Systematize/templates/overrides/
   ↓
2. .Systematize/presets/<active-preset>/templates/
   ↓
3. .Systematize/extensions/templates/    ← قوالب التوسعات
   ↓
4. .Systematize/templates/               ← قوالب أساسية
```

## الملفات الإضافية

### analytics.json (automatic)
```json
{
  "extensions": {
    "custom_commands_loaded": 0,
    "hooks_configured": 0,
    "hooks_executed": 0,
    "hooks_failed": 0
  }
}
```

### Sync State
ملفات التوسعات تُتابع في `.Systematize/memory/sync-state.json`:
```json
{
  "extensions": {
    "commands": {},
    "templates": {},
    "hooks": {}
  }
}
```

## Best Practices

1. **Naming Convention**
   - أوامر: `syskit.<your-command>`
   - ملفات: `your-extension-name.md`
   - متغيرات: `EXT_<UPPERCASE>`

2. **Hook Safety**
   - ضع `optional: true` للـ hooks غير الحرجة
   - استخدم `condition` لتحديد متى يُنفذ الـ hook
   - اختبر الـ hooks في بيئة آمنة أولاً

3. **Modularity**
   - افصل كل أمر مخصص في ملف منفصل
   - استخدم قوالب منفصلة بدلاً من hardcoding
   - تجنب التبعيات بين الأوامر المخصصة

## استكشاف الأخطاء

### الأمر المخصص لا يُتعرّف عليه
- تحقق من `extensions.yml`
- تأكد من `command_file` يشير لملف موجود
- تحقق من تنسيق اسم الأمر: `syskit.*`

### الـ Hook لا يُنفذ
- تحقق من `enabled: true` في `extensions.yml`
- تأكد من أن hook name يطابق في الأمر المقابل
- راجع السجلات في `.Systematize/memory/`

### القالب لا يُستبدل
- تأكد من أن اسم القالب يطابق القالب الأساسي تماماً
- تحقق من الموقع: `extensions/templates/` (بدون اسم preset)
- تحقق من الأولوية: هل هناك `overrides/` أو `presets/` أعلى؟

