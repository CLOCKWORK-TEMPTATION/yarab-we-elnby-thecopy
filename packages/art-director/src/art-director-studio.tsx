/**
 * ArtDirectorStudio - المكون الرئيسي لاستوديو مدير الفن
 * 
 * @description يمثل هذا المكون الواجهة الرئيسية لتطبيق CineArchitect
 * ويدير التنقل بين الأقسام المختلفة: لوحة التحكم، الأدوات، الإلهام، المواقع، الديكورات، الإنتاجية، والتوثيق
 * 
 * @architecture
 * - يستخدم نمط Tab-based navigation لإدارة المحتوى
 * - الشريط الجانبي ثابت ويحتوي على قائمة التنقل
 * - المحتوى الرئيسي يتغير بناءً على التبويب النشط
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import {
  LayoutDashboard,
  Palette,
  MapPin,
  Boxes,
  BarChart3,
  FileText,
  Film,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import "./art-director.css";

import Dashboard from "./components/Dashboard";
import Tools from "./components/Tools";
import Inspiration from "./components/Inspiration";
import Locations from "./components/Locations";
import Sets from "./components/Sets";
import Productivity from "./components/Productivity";
import Documentation from "./components/Documentation";

/**
 * واجهة عنصر التنقل
 * تحدد خصائص كل عنصر في شريط التنقل الجانبي
 */
interface NavItem {
  /** المعرف الفريد للتبويب */
  id: TabId;
  /** أيقونة التبويب من Lucide */
  icon: LucideIcon;
  /** النص العربي للتبويب */
  label: string;
  /** النص الإنجليزي للتبويب */
  labelEn: string;
}

/**
 * أنواع التبويبات المتاحة
 * يضمن Type Safety عند التعامل مع التنقل
 */
type TabId = "dashboard" | "tools" | "inspiration" | "locations" | "sets" | "productivity" | "documentation";

/**
 * قائمة عناصر التنقل الجانبي
 * مرتبة حسب الأولوية والاستخدام المتوقع
 */
const NAV_ITEMS: readonly NavItem[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "لوحة التحكم", labelEn: "Dashboard" },
  { id: "tools", icon: Wrench, label: "جميع الأدوات", labelEn: "All Tools" },
  { id: "inspiration", icon: Palette, label: "الإلهام البصري", labelEn: "Inspiration" },
  { id: "locations", icon: MapPin, label: "المواقع", labelEn: "Locations" },
  { id: "sets", icon: Boxes, label: "الديكورات", labelEn: "Sets" },
  { id: "productivity", icon: BarChart3, label: "الإنتاجية", labelEn: "Productivity" },
  { id: "documentation", icon: FileText, label: "التوثيق", labelEn: "Documentation" },
] as const;

/**
 * مكون الشعار والهوية
 * يعرض شعار CineArchitect والعنوان الفرعي
 */
function Logo() {
  return (
    <div className="art-director-logo">
      <Film size={32} />
      <div className="art-director-logo-text">
        <span className="art-director-logo-title">CineArchitect</span>
        <span className="art-director-logo-subtitle">مساعد مهندس الديكور</span>
      </div>
    </div>
  );
}

/**
 * مكون عنصر التنقل
 * يمثل زر واحد في قائمة التنقل الجانبية
 */
interface NavButtonProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

function NavButton({ item, isActive, onClick }: NavButtonProps) {
  const Icon = item.icon;
  
  return (
    <button
      className={`art-director-nav-item ${isActive ? "active" : ""}`}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      title={item.labelEn}
    >
      <Icon size={20} aria-hidden="true" />
      <span>{item.label}</span>
    </button>
  );
}

/**
 * مكون قائمة التنقل
 * يعرض جميع عناصر التنقل الجانبية
 */
interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="art-director-nav" role="navigation" aria-label="التنقل الرئيسي">
      {NAV_ITEMS.map((item) => (
        <NavButton
          key={item.id}
          item={item}
          isActive={activeTab === item.id}
          onClick={() => onTabChange(item.id)}
        />
      ))}
    </nav>
  );
}

/**
 * المكون الرئيسي لاستوديو مدير الفن
 * يدير حالة التنقل ويعرض المحتوى المناسب
 */
export default function ArtDirectorStudio() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  /**
   * معالج تغيير التبويب
   * يستخدم useCallback لتجنب إعادة الإنشاء غير الضرورية
   */
  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
  }, []);

  /**
   * عرض المحتوى بناءً على التبويب النشط
   * يستخدم useMemo لتجنب إعادة الحساب غير الضرورية
   */
  const content = useMemo(() => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onNavigate={handleTabChange} />;
      case "tools":
        return <Tools />;
      case "inspiration":
        return <Inspiration />;
      case "locations":
        return <Locations />;
      case "sets":
        return <Sets />;
      case "productivity":
        return <Productivity />;
      case "documentation":
        return <Documentation />;
      default:
        return <Dashboard onNavigate={handleTabChange} />;
    }
  }, [activeTab, handleTabChange]);

  return (
    <div className="art-director-layout">
      <aside className="art-director-sidebar" role="complementary">
        <Logo />
        <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
      </aside>

      <main className="art-director-main" role="main">
        {content}
      </main>
    </div>
  );
}
