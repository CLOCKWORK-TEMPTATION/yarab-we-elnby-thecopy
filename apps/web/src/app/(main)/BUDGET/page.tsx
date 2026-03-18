'use client';

/**
 * صفحة الميزانية الرئيسية - Budget Main Page
 * 
 * @description
 * الصفحة الرئيسية لتطبيق إدارة ميزانيات الأفلام
 * تتيح للمستخدم إدخال السيناريو وتوليد ميزانية احترافية
 * 
 * السبب: توفر واجهة بسيطة للمستخدم لبدء عملية
 * إنشاء الميزانية دون تعقيد تقني
 */

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Budget,
  AIAnalysis,
  GenerateBudgetRequestSchema,
  geminiService,
  Button,
  Card,
  CardContent,
  Textarea,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@the-copy/budget';
import { Film, Sparkles, FileSearch, Zap, TrendingUp, Shield } from 'lucide-react';

/**
 * تحميل ديناميكي للمكونات الثقيلة
 * 
 * @description
 * يؤجل تحميل المكونات الكبيرة حتى الحاجة إليها
 * لتحسين وقت التحميل الأولي للصفحة
 */
const BudgetApp = dynamic(
  () => import('@the-copy/budget').then(mod => ({ default: mod.BudgetApp })),
  { ssr: false }
);
const ScriptAnalyzer = dynamic(
  () => import('@the-copy/budget').then(mod => ({ default: mod.ScriptAnalyzer })),
  { ssr: false }
);
