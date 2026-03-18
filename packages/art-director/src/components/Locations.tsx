/**
 * Locations - صفحة إدارة المواقع
 * 
 * @description يوفر هذا المكون قاعدة بيانات لمواقع التصوير والديكورات
 * يدعم البحث وإضافة مواقع جديدة مع تصنيفها حسب النوع
 * 
 * @architecture
 * - يستخدم API للبحث وإضافة المواقع
 * - يعرض المواقع في شبكة بطاقات
 * - يدعم أنواع مختلفة من المواقع (داخلي، خارجي، طبيعي، استوديو)
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { MapPin, Plus, Search, Building, Trees, Mountain, type LucideIcon } from "lucide-react";
import type { LocationSimple, ApiResponse } from "../types";

/**
 * واجهة بيانات نموذج الموقع
 */
interface LocationFormData {
  name: string;
  nameAr: string;
  type: string;
  address: string;
  features: string;
}

/**
 * القيم الافتراضية لنموذج الموقع
 */
const DEFAULT_FORM_DATA: LocationFormData = {
  name: "",
  nameAr: "",
  type: "interior",
  address: "",
  features: "",
};

/**
 * خريطة أنواع المواقع وأيقوناتها
 */
const LOCATION_TYPE_MAP: Record<string, { icon: LucideIcon; label: string }> = {
  interior: { icon: Building, label: "داخلي" },
  exterior: { icon: Trees, label: "خارجي" },
  natural: { icon: Mountain, label: "طبيعي" },
  studio: { icon: Building, label: "استوديو" },
};

/**
 * دالة مساعدة للحصول على أيقونة ونص نوع الموقع
 */
function getLocationTypeInfo(type: string) {
  return LOCATION_TYPE_MAP[type] ?? { icon: Building, label: type };
}

/**
 * مكون بطاقة الموقع
 */
interface LocationCardProps {
  location: LocationSimple;
}

function LocationCard({ location }: LocationCardProps) {
  const { icon: TypeIcon, label: typeLabel } = getLocationTypeInfo(location.type);

  return (
    <div className="art-card">
      <div 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "8px", 
          marginBottom: "12px", 
          color: "var(--art-success)", 
          fontSize: "12px" 
        }}
      >
        <TypeIcon size={16} aria-hidden="true" />
        {typeLabel}
      </div>
      <h3 style={{ marginBottom: "4px" }}>{location.nameAr}</h3>
      <p style={{ color: "var(--art-text-muted)", fontSize: "13px", marginBottom: "8px" }}>
        {location.name}
      </p>
      <p style={{ color: "var(--art-text-muted)", fontSize: "12px", marginBottom: "12px" }}>
        {location.address}
      </p>
      {location.features && location.features.length > 0 && (
        <div>
          {location.features.map((feature, index) => (
            <span key={index} className="art-feature-tag">{feature}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * مكون حالة القائمة الفارغة
 */
function EmptyState() {
  return (
    <div className="art-card art-empty-state">
      <MapPin size={48} aria-hidden="true" />
      <h3>لا توجد مواقع</h3>
      <p>ابدأ بإضافة موقع جديد أو قم بالبحث</p>
    </div>
  );
}

/**
 * مكون نموذج إضافة موقع
 */
interface AddLocationFormProps {
  formData: LocationFormData;
  onFormChange: (data: Partial<LocationFormData>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function AddLocationForm({ formData, onFormChange, onSubmit, onCancel }: AddLocationFormProps) {
  return (
    <div className="art-card" style={{ marginBottom: "24px", animation: "fadeIn 0.3s ease-in-out" }}>
      <h3 style={{ marginBottom: "20px" }}>إضافة موقع جديد</h3>
      <div className="art-form-grid">
        <div className="art-form-group">
          <label htmlFor="location-name-ar">اسم الموقع (عربي)</label>
          <input
            id="location-name-ar"
            type="text"
            className="art-input"
            placeholder="مثال: قصر البارون"
            value={formData.nameAr}
            onChange={(e) => onFormChange({ nameAr: e.target.value })}
          />
        </div>
        <div className="art-form-group">
          <label htmlFor="location-name-en">اسم الموقع (إنجليزي)</label>
          <input
            id="location-name-en"
            type="text"
            className="art-input"
            placeholder="Example: Baron Palace"
            value={formData.name}
            onChange={(e) => onFormChange({ name: e.target.value })}
          />
        </div>
        <div className="art-form-group">
          <label htmlFor="location-type">النوع</label>
          <select
            id="location-type"
            className="art-input"
            value={formData.type}
            onChange={(e) => onFormChange({ type: e.target.value })}
          >
            <option value="interior">داخلي</option>
            <option value="exterior">خارجي</option>
            <option value="natural">طبيعي</option>
            <option value="studio">استوديو</option>
          </select>
        </div>
        <div className="art-form-group">
          <label htmlFor="location-address">العنوان</label>
          <input
            id="location-address"
            type="text"
            className="art-input"
            placeholder="العنوان الكامل"
            value={formData.address}
            onChange={(e) => onFormChange({ address: e.target.value })}
          />
        </div>
        <div className="art-form-group full-width">
          <label htmlFor="location-features">المميزات (مفصولة بفواصل)</label>
          <input
            id="location-features"
            type="text"
            className="art-input"
            placeholder="مثال: إضاءة طبيعية, مساحة واسعة, موقف سيارات"
            value={formData.features}
            onChange={(e) => onFormChange({ features: e.target.value })}
          />
        </div>
      </div>
      <div className="art-form-actions">
        <button className="art-btn" onClick={onSubmit}>
          <Plus size={18} aria-hidden="true" />
          إضافة
        </button>
        <button className="art-btn art-btn-secondary" onClick={onCancel}>
          إلغاء
        </button>
      </div>
    </div>
  );
}

/**
 * مكون شريط البحث والأدوات
 */
interface SearchToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
  onAddClick: () => void;
}

function SearchToolbar({ searchQuery, onSearchChange, onSearch, onAddClick }: SearchToolbarProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") onSearch();
    },
    [onSearch]
  );

  return (
    <div className="art-toolbar">
      <div className="art-search-box">
        <input
          type="text"
          className="art-input"
          placeholder="ابحث عن موقع..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="البحث عن موقع"
        />
        <button className="art-btn" onClick={onSearch}>
          <Search size={18} aria-hidden="true" />
          بحث
        </button>
      </div>
      <button className="art-btn" onClick={onAddClick}>
        <Plus size={18} aria-hidden="true" />
        إضافة موقع جديد
      </button>
    </div>
  );
}

/**
 * المكون الرئيسي لصفحة المواقع
 */
export default function Locations() {
  const [locations, setLocations] = useState<LocationSimple[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<LocationFormData>(DEFAULT_FORM_DATA);
  const [error, setError] = useState<string | null>(null);

  /**
   * البحث عن المواقع
   */
  const handleSearch = useCallback(async () => {
    setError(null);
    
    try {
      const response = await fetch("/api/locations/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery || undefined }),
      });
      
      const data: ApiResponse<{ locations: LocationSimple[] }> = await response.json();
      
      if (data.success && data.data?.locations) {
        setLocations(data.data.locations);
      } else {
        setLocations([]);
        if (data.error) setError(data.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ أثناء البحث";
      setError(errorMessage);
      setLocations([]);
    }
  }, [searchQuery]);

  /**
   * إضافة موقع جديد
   */
  const handleAddLocation = useCallback(async () => {
    setError(null);
    
    try {
      const response = await fetch("/api/locations/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          features: formData.features
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean),
        }),
      });
      
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setShowAddForm(false);
        setFormData(DEFAULT_FORM_DATA);
        handleSearch();
      } else {
        setError(data.error ?? "فشل في إضافة الموقع");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ أثناء الإضافة";
      setError(errorMessage);
    }
  }, [formData, handleSearch]);

  /**
   * تحديث بيانات النموذج
   */
  const handleFormChange = useCallback((data: Partial<LocationFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  /**
   * إلغاء نموذج الإضافة
   */
  const handleCancelForm = useCallback(() => {
    setShowAddForm(false);
    setFormData(DEFAULT_FORM_DATA);
  }, []);

  /**
   * شبكة المواقع أو حالة فارغة
   */
  const locationsContent = useMemo(() => {
    if (locations.length === 0) {
      return <EmptyState />;
    }

    return locations.map((location) => (
      <LocationCard key={location.id} location={location} />
    ));
  }, [locations]);

  return (
    <div className="art-director-page">
      {/* رأس الصفحة */}
      <header className="art-page-header">
        <MapPin size={32} className="header-icon" aria-hidden="true" />
        <div>
          <h1>إدارة المواقع</h1>
          <p>قاعدة بيانات مواقع التصوير والديكورات</p>
        </div>
      </header>

      {/* شريط الأدوات */}
      <SearchToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
        onAddClick={() => setShowAddForm(true)}
      />

      {/* رسالة الخطأ */}
      {error && (
        <div className="art-alert art-alert-error" style={{ marginBottom: "24px" }} role="alert">
          {error}
        </div>
      )}

      {/* نموذج الإضافة */}
      {showAddForm && (
        <AddLocationForm
          formData={formData}
          onFormChange={handleFormChange}
          onSubmit={handleAddLocation}
          onCancel={handleCancelForm}
        />
      )}

      {/* شبكة المواقع */}
      <div className="art-grid-3">{locationsContent}</div>
    </div>
  );
}
