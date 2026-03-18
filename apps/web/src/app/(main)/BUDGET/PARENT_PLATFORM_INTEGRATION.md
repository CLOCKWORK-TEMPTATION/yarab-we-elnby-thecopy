# دليل الدمج مع المنصة الأم
## ربط تطبيق BUDGET مع المنصة الرئيسية

---

## 🎯 نظرة عامة

التطبيق موجود في المسار:
```
D:\New folder (58)\the...copy\frontend\src\app\(main)\BUDGET\
```

والمنصة الأم موجودة في:
```
D:\New folder (58)\the...copy\
```

---

## 📁 بنية المنصة الأم

```
the...copy/
├── .claude/
├── .firebase/
├── .github/
├── .husky/
├── .nginx/
├── .scripts/
├── .windsurf/
├── (main)/                   ← التطبيقات الرئيسية
│   └── BUDGET/              ← تطبيق الميزانيات (موقعنا الحالي)
├── backend/                  ← الباك إند
└── dev-tools/               ← أدوات التطوير
```

---

## 🔗 طرق الدمج المتاحة

### 1️⃣ الاستخدام المباشر (الوضع الحالي)

التطبيق يعمل حالياً كوحدة مستقلة داخل المنصة:

```bash
# المسار الحالي
cd "D:\New folder (58)\the...copy\frontend\src\app\(main)\BUDGET"

# تشغيل التطبيق
npm run dev
# التطبيق يعمل على: http://localhost:3001
```

**المميزات:**
- ✅ مستقل تماماً
- ✅ سهل التطوير والصيانة
- ✅ يمكن دمجه لاحقاً

---

### 2️⃣ الدمج عبر Routing في المنصة الأم

إذا كانت المنصة الأم Next.js، يمكن إضافة route:

```typescript
// في المنصة الأم: app/budget/page.tsx
import BudgetApp from '@/(main)/BUDGET/components/BudgetApp';

export default function BudgetPage() {
  return <BudgetApp />;
}
```

**الخطوات:**
1. نسخ مجلد `components` من BUDGET إلى المنصة الأم
2. نسخ `lib` للوظائف المساعدة
3. دمج dependencies في package.json الرئيسي
4. إضافة route في المنصة الأم

---

### 3️⃣ الدمج كـ Submodule

للحفاظ على استقلالية التطبيق:

```bash
cd "D:\New folder (58)\the...copy"

# إضافة BUDGET كـ submodule
git submodule add ./frontend/src/app/(main)/BUDGET modules/budget

# تحديث
git submodule update --remote
```

---

### 4️⃣ الدمج عبر API Gateway

إذا كان للمنصة الأم backend منفصل:

```javascript
// في backend/routes/budget.js
const express = require('express');
const router = express.Router();
const { createProxyMiddleware } = require('http-proxy-middleware');

// Proxy requests to BUDGET app
router.use('/budget', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/budget': '/'
  }
}));

module.exports = router;
```

**الوصول:**
```
المنصة الأم: http://localhost:3000/budget
يُحول إلى: http://localhost:3001
```

---

### 5️⃣ الدمج عبر Nginx Reverse Proxy

للبيئة الإنتاجية:

```nginx
# في .nginx/sites-available/default

server {
    listen 80;
    server_name yourplatform.com;

    # المنصة الأم
    location / {
        proxy_pass http://localhost:3000;
    }

    # تطبيق الميزانيات
    location /budget {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔧 إعداد البيئة الموحدة

### خيار A: ملف .env مشترك

```bash
# في جذر المنصة: D:\New folder (58)\the...copy\.env
GEMINI_API_KEY=your_key_here
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# تطبيق BUDGET
BUDGET_PORT=3001
BUDGET_URL=http://localhost:3001

# المنصة الأم
MAIN_PORT=3000
```

### خيار B: ملفات منفصلة مع Symlinks

```powershell
# في PowerShell
cd "D:\New folder (58)\the...copy\frontend\src\app\(main)\BUDGET"

# إنشاء symlink للـ .env المشترك
New-Item -ItemType SymbolicLink -Path ".env.local" -Target "..\..\..\..\..\.env"
```

---

## 🚀 سكريبت التشغيل الموحد

يمكن إنشاء سكريبت في جذر المنصة:

```json
// في package.json الرئيسي
{
  "scripts": {
    "dev": "concurrently \"npm run dev:main\" \"npm run dev:budget\"",
    "dev:main": "cd frontend && npm run dev",
    "dev:budget": "cd frontend/src/app/(main)/BUDGET && npm run dev",
    "build": "npm run build:main && npm run build:budget",
    "build:main": "cd frontend && npm run build",
    "build:budget": "cd frontend/src/app/(main)/BUDGET && npm run build"
  },
  "devDependencies": {
    "concurrently": "^8.0.0"
  }
}
```

**الاستخدام:**
```bash
cd "D:\New folder (58)\the...copy"
npm run dev  # يشغل المنصة الأم + BUDGET معاً
```

---

## 🔐 مشاركة Authentication

لمشاركة JWT tokens بين التطبيقات:

```typescript
// في BUDGET/app/api/budget/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth'; // من المنصة الأم

export async function POST(request: NextRequest) {
    // التحقق من التوكن
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await verifyToken(token);
        // المتابعة مع البيانات...
    } catch (error) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }
}
```

---

## 📊 مشاركة قاعدة البيانات

### خيار 1: نفس قاعدة البيانات

```typescript
// في BUDGET/lib/db.ts
import { PrismaClient } from '@prisma/client';

// استخدام نفس Prisma من المنصة الأم
export const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});
```

### خيار 2: Schema منفصل

```prisma
// في schema.prisma
model Budget {
  id          String   @id @default(cuid())
  title       String
  grandTotal  Float
  sections    Json
  userId      String   // ربط مع user من المنصة الأم
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("budgets")
}
```

---

## 🌐 مثال شامل للدمج

```typescript
// في المنصة الأم: app/dashboard/page.tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [showBudget, setShowBudget] = useState(false);

  const openBudgetApp = () => {
    // خيار 1: فتح في نافذة جديدة
    window.open('http://localhost:3001', '_blank');
    
    // خيار 2: فتح في modal
    setShowBudget(true);
  };

  return (
    <div className="dashboard">
      <h1>لوحة التحكم</h1>
      
      <div className="actions">
        <button onClick={openBudgetApp}>
          إنشاء ميزانية جديدة
        </button>
      </div>

      {/* خيار: iframe embedded */}
      {showBudget && (
        <div className="modal">
          <iframe 
            src="http://localhost:3001"
            width="100%"
            height="800px"
          />
        </div>
      )}
    </div>
  );
}
```

---

## 🧪 اختبار الاتصال

```bash
# اختبار API من المنصة الأم
curl -X POST http://localhost:3001/api/budget/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "فيلم تجريبي",
    "scenario": "نص تجريبي..."
  }'
```

---

## 📋 قائمة التحقق للدمج

- [ ] تثبيت dependencies في المنصة الأم
- [ ] إعداد متغيرات البيئة المشتركة
- [ ] اختبار الاتصال بين التطبيقات
- [ ] إعداد authentication مشترك
- [ ] اختبار APIs من المنصة الأم
- [ ] إعداد error handling موحد
- [ ] إعداد logging مركزي
- [ ] اختبار في بيئة الإنتاج

---

## 🚨 المشاكل المحتملة والحلول

### مشكلة: CORS Errors
**الحل:**
```typescript
// في BUDGET/next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
        ],
      },
    ];
  },
};
```

### مشكلة: Port Conflicts
**الحل:**
```json
// تخصيص ports مختلفة
{
  "scripts": {
    "dev": "next dev -p 3001"
  }
}
```

### مشكلة: Shared State
**الحل:** استخدام Redis أو Database لمشاركة الـ state

---

## 📞 الدعم والمراجع

- [README.md](./README.md) - دليل التطبيق
- [INTEGRATION.md](./INTEGRATION.md) - دليل الدمج التفصيلي
- [FIXES_REPORT.md](./FIXES_REPORT.md) - تقرير الإصلاحات

---

**آخر تحديث**: يناير 2026  
**الحالة**: ✅ جاهز للدمج  

---

© 2026 FilmBudget AI Pro - دليل الدمج مع المنصة الأم
