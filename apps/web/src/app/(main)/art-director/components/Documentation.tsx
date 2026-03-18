/**
 * Documentation - صفحة التوثيق التلقائي
 * 
 * @description يوفر هذا المكون أدوات لإنشاء كتب الإنتاج وأدلة الأسلوب
 * يدعم توثيق القرارات الإبداعية وتصدير المستندات بصيغ متعددة
 * 
 * @architecture
 * - يولد كتب إنتاج تلقائية
 * - ينشئ أدلة أسلوب للمشاريع
 * - يوثق القرارات الإبداعية
 * - يدعم التصدير بصيغ PDF و Word
 */

"use client";

import { useState, useCallback } from "react";
import { FileText, Book, PenTool, Download, Plus } from "lucide-react";
import type { ProductionBook, StyleGuide, ApiResponse } from "../types";

/**
 * واجهة بيانات نموذج كتاب الإنتاج
 */
interface BookFormData {
  projectName: string;
  projectNameAr: string;
  director: string;
  productionCompany: string;
}

/**
 * واجهة بيانات نموذج توثيق القرار
 */
interface DecisionFormData {
  title: string;
  description: string;
  category: string;
  rationale: string;
}

/**
 * القيم الافتراضية لنموذج كتاب الإنتاج
 */
const DEFAULT_BOOK_FORM: BookFormData = {
  projectName: "",
  projectNameAr: "",
  director: "",
  productionCompany: "",
};

/**
 * القيم الافتراضية لنموذج توثيق القرار
 */
const DEFAULT_DECISION_FORM: DecisionFormData = {
  title: "",
  description: "",
  category: "color",
  rationale: "",
};

/**
 * مكون بطاقة كتاب الإنتاج
 */
interface ProductionBookCardProps {
  book: ProductionBook;
  onExport: (format: string) => void;
}

function ProductionBookCard({ book, onExport }: ProductionBookCardProps) {
  return (
    <div className="art-card" style={{ animation: "fadeIn 0.3s ease-in-out" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <Book size={24} style={{ color: "var(--art-primary)" }} aria-hidden="true" />
        <div>
          <h3 style={{ margin: 0 }}>{book.titleAr}</h3>
          <p style={{ color: "var(--art-text-muted)", margin: 0, fontSize: "14px" }}>{book.title}</p>
        </div>
      </div>
      <div style={{ marginBottom: "16px" }}>
        <h4 style={{ marginBottom: "12px" }}>الأقسام:</h4>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }} role="list">
          {book.sections.map((section, index) => (
            <li 
              key={index} 
              style={{ 
                padding: "8px 12px", 
                background: "rgba(255,255,255,0.05)", 
                borderRadius: "6px", 
                marginBottom: "6px", 
                fontSize: "14px" 
              }}
            >
              {section}
            </li>
          ))}
        </ul>
      </div>
      <div style={{ color: "var(--art-text-muted)", fontSize: "12px", marginBottom: "16px" }}>
        تاريخ الإنشاء: {new Date(book.createdAt).toLocaleDateString("ar-EG")}
      </div>
      <div style={{ display: "flex", gap: "12px" }}>
        <button 
          className="art-btn art-btn-secondary" 
          onClick={() => onExport("pdf")}
          aria-label="تصدير بصيغة PDF"
        >
          <Download size={16} aria-hidden="true" /> PDF
        </button>
        <button 
          className="art-btn art-btn-secondary" 
          onClick={() => onExport("docx")}
          aria-label="تصدير بصيغة Word"
        >
          <Download size={16} aria-hidden="true" /> Word
        </button>
      </div>
    </div>
  );
}

/**
 * مكون بطاقة دليل الأسلوب
 */
interface StyleGuideCardProps {
  guide: StyleGuide;
}

function StyleGuideCard({ guide }: StyleGuideCardProps) {
  return (
    <div className="art-card" style={{ animation: "fadeIn 0.3s ease-in-out" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <PenTool size={24} style={{ color: "var(--art-purple)" }} aria-hidden="true" />
        <div>
          <h3 style={{ margin: 0 }}>{guide.nameAr}</h3>
          <p style={{ color: "var(--art-text-muted)", margin: 0, fontSize: "14px" }}>{guide.name}</p>
        </div>
      </div>
      <div>
        <h4 style={{ marginBottom: "12px" }}>العناصر:</h4>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {guide.elements.map((element, index) => (
            <span key={index} className="art-element-tag">{element}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * مكون نموذج إنشاء كتاب الإنتاج
 */
interface BookFormProps {
  formData: BookFormData;
  loading: boolean;
  onFormChange: (data: Partial<BookFormData>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function BookForm({ formData, loading, onFormChange, onSubmit, onCancel }: BookFormProps) {
  return (
    <div className="art-card" style={{ marginBottom: "24px", animation: "fadeIn 0.3s ease-in-out" }}>
      <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
        <Book size={20} aria-hidden="true" /> إنشاء كتاب الإنتاج
      </h3>
      <div className="art-form-grid">
        <div className="art-form-group">
          <label htmlFor="book-name-ar">اسم المشروع (عربي)</label>
          <input
            id="book-name-ar"
            type="text"
            className="art-input"
            placeholder="مثال: رحلة إلى المجهول"
            value={formData.projectNameAr}
            onChange={(e) => onFormChange({ projectNameAr: e.target.value })}
          />
        </div>
        <div className="art-form-group">
          <label htmlFor="book-name-en">اسم المشروع (إنجليزي)</label>
          <input
            id="book-name-en"
            type="text"
            className="art-input"
            placeholder="Example: Journey to the Unknown"
            value={formData.projectName}
            onChange={(e) => onFormChange({ projectName: e.target.value })}
          />
        </div>
        <div className="art-form-group">
          <label htmlFor="book-director">المخرج</label>
          <input
            id="book-director"
            type="text"
            className="art-input"
            placeholder="اسم المخرج"
            value={formData.director}
            onChange={(e) => onFormChange({ director: e.target.value })}
          />
        </div>
        <div className="art-form-group">
          <label htmlFor="book-company">شركة الإنتاج</label>
          <input
            id="book-company"
            type="text"
            className="art-input"
            placeholder="اسم الشركة"
            value={formData.productionCompany}
            onChange={(e) => onFormChange({ productionCompany: e.target.value })}
          />
        </div>
      </div>
      <div className="art-form-actions">
        <button className="art-btn" onClick={onSubmit} disabled={loading}>
          <Book size={18} aria-hidden="true" />
          {loading ? "جاري الإنشاء..." : "إنشاء"}
        </button>
        <button className="art-btn art-btn-secondary" onClick={onCancel}>
          إلغاء
        </button>
      </div>
    </div>
  );
}

/**
 * مكون نموذج توثيق القرار
 */
interface DecisionFormProps {
  formData: DecisionFormData;
  loading: boolean;
  onFormChange: (data: Partial<DecisionFormData>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function DecisionForm({ formData, loading, onFormChange, onSubmit, onCancel }: DecisionFormProps) {
  return (
    <div className="art-card" style={{ marginBottom: "24px", animation: "fadeIn 0.3s ease-in-out" }}>
      <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
        <PenTool size={20} aria-hidden="true" /> توثيق قرار إبداعي
      </h3>
      <div className="art-form-grid">
        <div className="art-form-group full-width">
          <label htmlFor="decision-title">عنوان القرار</label>
          <input
            id="decision-title"
            type="text"
            className="art-input"
            placeholder="مثال: اختيار اللون الرئيسي للديكور"
            value={formData.title}
            onChange={(e) => onFormChange({ title: e.target.value })}
          />
        </div>
        <div className="art-form-group full-width">
          <label htmlFor="decision-description">الوصف</label>
          <textarea
            id="decision-description"
            className="art-input"
            placeholder="وصف تفصيلي للقرار"
            value={formData.description}
            onChange={(e) => onFormChange({ description: e.target.value })}
            rows={3}
            style={{ resize: "none" }}
          />
        </div>
        <div className="art-form-group">
          <label htmlFor="decision-category">الفئة</label>
          <select
            id="decision-category"
            className="art-input"
            value={formData.category}
            onChange={(e) => onFormChange({ category: e.target.value })}
          >
            <option value="color">الألوان</option>
            <option value="lighting">الإضاءة</option>
            <option value="props">الإكسسوارات</option>
            <option value="furniture">الأثاث</option>
            <option value="texture">الخامات</option>
          </select>
        </div>
        <div className="art-form-group">
          <label htmlFor="decision-rationale">المبرر</label>
          <input
            id="decision-rationale"
            type="text"
            className="art-input"
            placeholder="سبب اتخاذ هذا القرار"
            value={formData.rationale}
            onChange={(e) => onFormChange({ rationale: e.target.value })}
          />
        </div>
      </div>
      <div className="art-form-actions">
        <button className="art-btn" onClick={onSubmit} disabled={loading}>
          <Plus size={18} aria-hidden="true" />
          توثيق
        </button>
        <button className="art-btn art-btn-secondary" onClick={onCancel}>
          إلغاء
        </button>
      </div>
    </div>
  );
}

/**
 * المكون الرئيسي لصفحة التوثيق
 */
export default function Documentation() {
  const [showBookForm, setShowBookForm] = useState(false);
  const [showDecisionForm, setShowDecisionForm] = useState(false);
  const [productionBook, setProductionBook] = useState<ProductionBook | null>(null);
  const [styleGuide, setStyleGuide] = useState<StyleGuide | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bookForm, setBookForm] = useState<BookFormData>(DEFAULT_BOOK_FORM);
  const [decisionForm, setDecisionForm] = useState<DecisionFormData>(DEFAULT_DECISION_FORM);

  /**
   * إنشاء كتاب الإنتاج
   */
  const handleGenerateBook = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/documentation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookForm),
      });
      
      const data: ApiResponse<ProductionBook> = await response.json();
      
      if (data.success && data.data) {
        setProductionBook(data.data);
        setShowBookForm(false);
        setBookForm(DEFAULT_BOOK_FORM);
      } else {
        setError(data.error ?? "فشل في إنشاء الكتاب");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ أثناء الإنشاء";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [bookForm]);

  /**
   * إنشاء دليل الأسلوب
   */
  const handleGenerateStyleGuide = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/documentation/style-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName: bookForm.projectName || "مشروع جديد" }),
      });
      
      const data: ApiResponse<StyleGuide> = await response.json();
      
      if (data.success && data.data) {
        setStyleGuide(data.data);
      } else {
        setError(data.error ?? "فشل في إنشاء دليل الأسلوب");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ أثناء الإنشاء";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [bookForm.projectName]);

  /**
   * توثيق قرار إبداعي
   */
  const handleLogDecision = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/documentation/log-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(decisionForm),
      });
      
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setShowDecisionForm(false);
        setDecisionForm(DEFAULT_DECISION_FORM);
      } else {
        setError(data.error ?? "فشل في توثيق القرار");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ أثناء التوثيق";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [decisionForm]);

  /**
   * تصدير المستند
   */
  const handleExport = useCallback(async (format: string) => {
    setError(null);
    
    try {
      const response = await fetch("/api/documentation/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });
      
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        // عرض رسالة نجاح بدلاً من alert
        // يمكن استخدام Toast notification هنا
      } else {
        setError(data.error ?? "فشل في التصدير");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ أثناء التصدير";
      setError(errorMessage);
    }
  }, []);

  /**
   * تحديث بيانات نموذج الكتاب
   */
  const handleBookFormChange = useCallback((data: Partial<BookFormData>) => {
    setBookForm((prev) => ({ ...prev, ...data }));
  }, []);

  /**
   * تحديث بيانات نموذج القرار
   */
  const handleDecisionFormChange = useCallback((data: Partial<DecisionFormData>) => {
    setDecisionForm((prev) => ({ ...prev, ...data }));
  }, []);

  return (
    <div className="art-director-page">
      {/* رأس الصفحة */}
      <header className="art-page-header">
        <FileText size={32} className="header-icon" aria-hidden="true" />
        <div>
          <h1>التوثيق التلقائي</h1>
          <p>إنشاء كتب الإنتاج وأدلة الأسلوب</p>
        </div>
      </header>

      {/* شريط الأدوات */}
      <div className="art-toolbar">
        <button className="art-btn" onClick={() => setShowBookForm(true)}>
          <Book size={18} aria-hidden="true" />
          إنشاء كتاب إنتاج
        </button>
        <button 
          className="art-btn art-btn-secondary" 
          onClick={handleGenerateStyleGuide} 
          disabled={loading}
        >
          <PenTool size={18} aria-hidden="true" />
          دليل الأسلوب
        </button>
        <button className="art-btn art-btn-secondary" onClick={() => setShowDecisionForm(true)}>
          <Plus size={18} aria-hidden="true" />
          توثيق قرار
        </button>
      </div>

      {/* رسالة الخطأ */}
      {error && (
        <div className="art-alert art-alert-error" style={{ marginBottom: "24px" }} role="alert">
          {error}
        </div>
      )}

      {/* نموذج إنشاء كتاب الإنتاج */}
      {showBookForm && (
        <BookForm
          formData={bookForm}
          loading={loading}
          onFormChange={handleBookFormChange}
          onSubmit={handleGenerateBook}
          onCancel={() => setShowBookForm(false)}
        />
      )}

      {/* نموذج توثيق القرار */}
      {showDecisionForm && (
        <DecisionForm
          formData={decisionForm}
          loading={loading}
          onFormChange={handleDecisionFormChange}
          onSubmit={handleLogDecision}
          onCancel={() => setShowDecisionForm(false)}
        />
      )}

      {/* عرض النتائج */}
      <div className="art-grid-2" style={{ gap: "24px" }}>
        {productionBook && (
          <ProductionBookCard book={productionBook} onExport={handleExport} />
        )}

        {styleGuide && <StyleGuideCard guide={styleGuide} />}
      </div>
    </div>
  );
}
