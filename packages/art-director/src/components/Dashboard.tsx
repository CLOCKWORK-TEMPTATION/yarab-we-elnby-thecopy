/**
 * Dashboard - لوحة التحكم الرئيسية
 * 
 * @description يعرض هذا المكون نظرة عامة على حالة المشروع والأدوات المتاحة
 * يتضمن إحصائيات سريعة، إجراءات سريعة، وقائمة بالإضافات المتاحة
 * 
 * @architecture
 * - يستخدم Hook مخصص لجلب الإضافات
 * - يعرض البيانات الافتراضية عند فشل الاتصال
 * - يدعم التنقل إلى الأقسام الأخرى
 */

"use client";

import { useMemo, type ReactNode } from "react";
import {
  Palette,
  MapPin,
  Boxes,
  FileText,
  Sparkles,
  CheckCircle2,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { usePlugins } from "../hooks";
import type { PluginInfo } from "../types";

/**
 * أنواع التبويبات للتنقل
 */
type TabId = "dashboard" | "tools" | "inspiration" | "locations" | "sets" | "productivity" | "documentation";

/**
 * واجهة خصائص لوحة التحكم
 */
interface DashboardProps {
  /** دالة التنقل إلى قسم آخر */
  onNavigate: (tab: TabId) => void;
}

/**
 * واجهة الإجراء السريع
 */
interface QuickAction {
  id: TabId;
  icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
}

/**
 * واجهة الإحصائية
 */
interface Stat {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
}

/**
 * قائمة الإجراءات السريعة
 * تمثل أكثر المهام شيوعاً التي يحتاجها المستخدم
 */
const QUICK_ACTIONS: readonly QuickAction[] = [
  {
    id: "inspiration",
    icon: Palette,
    title: "إنشاء Mood Board",
    desc: "لوحة إلهام بصرية جديدة",
    color: "#e94560",
  },
  {
    id: "locations",
    icon: MapPin,
    title: "إضافة موقع",
    desc: "تسجيل موقع تصوير جديد",
    color: "#4ade80",
  },
  {
    id: "sets",
    icon: Boxes,
    title: "تحليل ديكور",
    desc: "فحص إعادة الاستخدام",
    color: "#fbbf24",
  },
  {
    id: "documentation",
    icon: FileText,
    title: "إنشاء تقرير",
    desc: "توليد كتاب الإنتاج",
    color: "#60a5fa",
  },
] as const;

/**
 * قائمة الإحصائيات
 * تعرض ملخص حالة المشروع الحالي
 */
const STATS: readonly Stat[] = [
  { icon: Sparkles, label: "مشاريع نشطة", value: "3", color: "#e94560" },
  { icon: MapPin, label: "مواقع مسجلة", value: "12", color: "#4ade80" },
  { icon: Boxes, label: "ديكورات", value: "28", color: "#fbbf24" },
  { icon: CheckCircle2, label: "مهام مكتملة", value: "156", color: "#60a5fa" },
] as const;

/**
 * مكون بطاقة الإحصائية
 */
interface StatCardProps {
  stat: Stat;
}

function StatCard({ stat }: StatCardProps) {
  const Icon = stat.icon;
  
  return (
    <div className="art-card art-stat-card">
      <div 
        className="art-stat-icon" 
        style={{ background: `${stat.color}20`, color: stat.color }}
      >
        <Icon size={24} aria-hidden="true" />
      </div>
      <div className="art-stat-info">
        <span className="art-stat-value">{stat.value}</span>
        <span className="art-stat-label">{stat.label}</span>
      </div>
    </div>
  );
}

/**
 * مكون بطاقة الإجراء السريع
 */
interface QuickActionCardProps {
  action: QuickAction;
  onClick: () => void;
}

function QuickActionCard({ action, onClick }: QuickActionCardProps) {
  const Icon = action.icon;
  
  return (
    <button
      className="art-card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: `${action.color}15`,
        border: "none",
        cursor: "pointer",
        textAlign: "right",
      }}
      onClick={onClick}
      aria-label={`${action.title}: ${action.desc}`}
    >
      <div 
        style={{ 
          background: `${action.color}20`, 
          color: action.color, 
          padding: "10px", 
          borderRadius: "12px" 
        }}
      >
        <Icon size={20} aria-hidden="true" />
      </div>
      <div>
        <h3 style={{ fontSize: "16px", marginBottom: "4px" }}>{action.title}</h3>
        <p style={{ color: "var(--art-text-muted)", fontSize: "13px" }}>{action.desc}</p>
      </div>
    </button>
  );
}

/**
 * مكون بطاقة الإضافة
 */
interface PluginCardProps {
  plugin: PluginInfo;
}

function PluginCard({ plugin }: PluginCardProps) {
  return (
    <div className="art-card" style={{ position: "relative" }}>
      <div 
        style={{ 
          display: "inline-block", 
          background: "var(--art-primary)", 
          color: "white", 
          padding: "4px 12px", 
          borderRadius: "20px", 
          fontSize: "12px", 
          marginBottom: "12px" 
        }}
      >
        {plugin.category}
      </div>
      <h3 style={{ fontSize: "16px", marginBottom: "4px" }}>{plugin.nameAr}</h3>
      <p style={{ color: "var(--art-text-muted)", fontSize: "13px" }}>{plugin.name}</p>
    </div>
  );
}

/**
 * مكون حالة التحميل
 */
function LoadingState() {
  return (
    <div className="art-card">جاري تحميل الأدوات من المنصة...</div>
  );
}

/**
 * مكون شبكة الإضافات
 */
interface PluginsGridProps {
  plugins: PluginInfo[];
  loading: boolean;
}

function PluginsGrid({ plugins, loading }: PluginsGridProps) {
  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="art-grid-3">
      {plugins.map((plugin) => (
        <PluginCard key={plugin.id} plugin={plugin} />
      ))}
    </div>
  );
}

/**
 * دالة مساعدة لتنسيق التاريخ بالعربية
 */
function formatArabicDate(): string {
  return new Date().toLocaleDateString("ar-EG", { 
    weekday: "long", 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  });
}

/**
 * مكون قسم عام
 */
interface SectionProps {
  title?: string;
  children: ReactNode;
  style?: React.CSSProperties;
}

function Section({ title, children, style }: SectionProps) {
  return (
    <section style={{ marginBottom: "32px", ...style }}>
      {title && <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>{title}</h2>}
      {children}
    </section>
  );
}

/**
 * المكون الرئيسي للوحة التحكم
 */
export default function Dashboard({ onNavigate }: DashboardProps) {
  const { plugins, loading } = usePlugins();

  /**
   * التاريخ الحالي بالتنسيق العربي
   * يستخدم useMemo لتجنب إعادة الحساب
   */
  const formattedDate = useMemo(() => formatArabicDate(), []);

  return (
    <div className="art-director-page">
      {/* رأس الصفحة */}
      <header 
        className="dashboard-header" 
        style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "flex-start", 
          marginBottom: "32px" 
        }}
      >
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px" }}>
            مرحباً بك في CineArchitect
          </h1>
          <p style={{ color: "var(--art-text-muted)", fontSize: "16px" }}>
            مساعدك الذكي لتصميم الديكورات السينمائية
          </p>
        </div>
        <div 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            color: "var(--art-text-muted)", 
            fontSize: "14px" 
          }}
        >
          <Clock size={16} aria-hidden="true" />
          <span>{formattedDate}</span>
        </div>
      </header>

      {/* قسم الإحصائيات */}
      <Section>
        <div className="art-grid-4">
          {STATS.map((stat, index) => (
            <StatCard key={index} stat={stat} />
          ))}
        </div>
      </Section>

      {/* قسم الإجراءات السريعة */}
      <Section title="إجراءات سريعة">
        <div className="art-grid-4">
          {QUICK_ACTIONS.map((action) => (
            <QuickActionCard
              key={action.id}
              action={action}
              onClick={() => onNavigate(action.id)}
            />
          ))}
        </div>
      </Section>

      {/* قسم الأدوات المتاحة */}
      <Section title={`الأدوات المتاحة (${plugins.length})`}>
        <PluginsGrid plugins={plugins} loading={loading} />
      </Section>
    </div>
  );
}
