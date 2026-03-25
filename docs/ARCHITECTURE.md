# المرجع المعماري

## الغرض

هذا المستند يصف البنية الحاكمة للمستودع من زاوية
Syskit
ومكان
المراجعة الهندسية الصارمة
داخلها.

## الطبقات الحاكمة

1. سطح الأوامر داخل:

```text
commands/
```

2. زمن التشغيل الحاكم داخل:

```text
.Systematize/scripts/
```

3. مخرجات الميزات داخل:

```text
features/
```

4. المرجع الوثائقي داخل:

```text
docs/
```

## تدفق التنفيذ الحاكم

```text
/syskit.systematize
-> /syskit.clarify
-> /syskit.constitution
-> /syskit.research
-> /syskit.plan
-> /syskit.tasks
-> /syskit.review
-> /syskit.implement
```

## موضع المراجعة الصارمة

ميزة
المراجعة الهندسية الصارمة
لا تعمل كمراجع
PR
عام،
بل كبوابة جاهزية مستودع تراجع الأدوات والطبقات والعقود والمخاطر التنفيذية
قبل التطوير التالي.

## الارتباطات المرجعية

- المدخل التشغيلي العام:
  `docs/START_HERE.md`
- طبقة المرجع:
  `docs/REFERENCE.md`
- طبقة السياسات:
  `docs/policies/README.md`
