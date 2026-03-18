/**
 * Tools - صفحة جميع الأدوات
 * 
 * @description يعرض هذا المكون واجهة موحدة لتشغيل واختبار جميع أدوات CineArchitect
 * يتضمن قائمة جانبية بالأدوات المتاحة ومساحة عمل لتنفيذ الأداة المحددة
 * 
 * @architecture
 * - يستخدم Hook مخصص لجلب الإضافات
 * - يدعم أنواع مختلفة من المدخلات (text, number, select, textarea)
 * - يعرض نتائج التنفيذ بتنسيق JSON
 */

"use client";

import { useState, useCallback, useMemo, type ReactNode, type ChangeEvent } from "react";
import { Play, Loader2 } from "lucide-react";
import { toolConfigs, type ToolId, type ToolInput } from "../core/toolConfigs";
import { usePlugins } from "../hooks";
import type { PluginInfo, ApiResponse } from "../types";

/**
 * واجهة بيانات النموذج
 * تخزن قيم المدخلات بشكل ديناميكي
 */
type FormData = Record<string, string>;

/**
 * واجهة نتيجة التنفيذ
 */
interface ExecutionResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  [key: string]: unknown;
}

/**
 * مكون حقل الإدخال
 * يعرض نوع الإدخال المناسب بناءً على تكوين الأداة
 */
interface InputFieldProps {
  input: ToolInput;
  value: string;
  onChange: (name: string, value: string) => void;
}

function InputField({ input, value, onChange }: InputFieldProps) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      onChange(input.name, e.target.value);
    },
    [input.name, onChange]
  );

  if (input.type === "select" && input.options) {
    return (
      <select
        className="art-input"
        value={value}
        onChange={handleChange}
        aria-label={input.label}
      >
        <option value="">اختر...</option>
        {input.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (input.type === "textarea") {
    return (
      <textarea
        className="art-input"
        placeholder={input.placeholder}
        value={value}
        onChange={handleChange}
        rows={4}
        style={{ resize: "none" }}
        aria-label={input.label}
      />
    );
  }

  return (
    <input
      type={input.type}
      className="art-input"
      placeholder={input.placeholder}
      value={value}
      onChange={handleChange}
      aria-label={input.label}
    />
  );
}

/**
 * مكون مجموعة الحقول
 * يعرض جميع مدخلات الأداة المحددة
 */
interface FormFieldsProps {
  inputs: ToolInput[];
  formData: FormData;
  onFieldChange: (name: string, value: string) => void;
}

function FormFields({ inputs, formData, onFieldChange }: FormFieldsProps) {
  return (
    <>
      {inputs.map((input) => (
        <div
          key={input.name}
          className={`art-form-group ${input.type === "textarea" ? "full-width" : ""}`}
        >
          <label>{input.label}</label>
          <InputField
            input={input}
            value={formData[input.name] ?? ""}
            onChange={onFieldChange}
          />
        </div>
      ))}
    </>
  );
}

/**
 * واجهة CSS مع المتغيرات المخصصة
 * تسمح باستخدام CSS variables في React
 */
interface CSSPropertiesWithVars extends React.CSSProperties {
  '--tool-color'?: string;
}

/**
 * مكون عنصر الأداة في القائمة الجانبية
 */
interface ToolItemProps {
  plugin: PluginInfo;
  isActive: boolean;
  onClick: () => void;
}

function ToolItem({ plugin, isActive, onClick }: ToolItemProps) {
  const config = toolConfigs[plugin.id as ToolId];
  const Icon = config?.icon ?? Play;
  const color = config?.color ?? "#e94560";

  const buttonStyle: CSSPropertiesWithVars = {
    '--tool-color': color,
  };

  return (
    <button
      className={`art-tool-item ${isActive ? "active" : ""}`}
      onClick={onClick}
      style={buttonStyle}
      aria-current={isActive ? "true" : undefined}
    >
      <Icon size={20} style={{ color }} aria-hidden="true" />
      <div className="art-tool-info">
        <span className="art-tool-name-ar">{plugin.nameAr}</span>
        <span className="art-tool-category">{plugin.category}</span>
      </div>
    </button>
  );
}

/**
 * مكون الشريط الجانبي للأدوات
 */
interface ToolsSidebarProps {
  plugins: PluginInfo[];
  selectedTool: ToolId | null;
  onToolSelect: (toolId: ToolId) => void;
}

function ToolsSidebar({ plugins, selectedTool, onToolSelect }: ToolsSidebarProps) {
  return (
    <aside className="art-tools-sidebar">
      <h3>الأدوات المتاحة ({plugins.length})</h3>
      <div className="art-tools-list" role="listbox" aria-label="قائمة الأدوات">
        {plugins.map((plugin) => (
          <ToolItem
            key={plugin.id}
            plugin={plugin}
            isActive={selectedTool === plugin.id}
            onClick={() => onToolSelect(plugin.id as ToolId)}
          />
        ))}
      </div>
    </aside>
  );
}

/**
 * مكون حالة عدم وجود أداة محددة
 */
function NoToolSelected() {
  return (
    <div className="art-no-tool-selected">
      <Play size={64} aria-hidden="true" />
      <h2>اختر أداة للبدء</h2>
      <p>اختر أداة من القائمة الجانبية لتشغيلها</p>
    </div>
  );
}

/**
 * مكون نتيجة التنفيذ
 */
interface ExecutionResultProps {
  result: ExecutionResult;
}

function ExecutionResultDisplay({ result }: ExecutionResultProps) {
  return (
    <div className="art-card art-result-card" style={{ animation: "fadeIn 0.3s ease-in-out" }}>
      <h3>النتيجة</h3>
      <div className={`art-result-status ${result.success ? "success" : "error"}`}>
        {result.success ? "تم بنجاح" : "حدث خطأ"}
      </div>
      <pre className="art-result-json">{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}

/**
 * مكون رسالة الخطأ
 */
interface ErrorAlertProps {
  message: string;
}

function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div className="art-alert art-alert-error" style={{ marginTop: "12px" }} role="alert">
      {message}
    </div>
  );
}

/**
 * مكون مساحة عمل الأداة
 */
interface ToolWorkspaceProps {
  selectedTool: ToolId;
  plugin: PluginInfo;
  formData: FormData;
  result: ExecutionResult | null;
  loading: boolean;
  error: string | null;
  onFieldChange: (name: string, value: string) => void;
  onExecute: () => void;
}

function ToolWorkspace({
  selectedTool,
  plugin,
  formData,
  result,
  loading,
  error,
  onFieldChange,
  onExecute,
}: ToolWorkspaceProps) {
  const config = toolConfigs[selectedTool];
  
  if (!config) {
    return <NoToolSelected />;
  }

  const Icon = config.icon;

  return (
    <div className="art-tool-workspace">
      {/* رأس الأداة */}
      <div
        className="art-tool-header"
        style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}
      >
        <Icon size={32} style={{ color: config.color }} aria-hidden="true" />
        <div>
          <h2 style={{ margin: 0 }}>{plugin.nameAr}</h2>
          <p style={{ color: "var(--art-text-muted)", margin: 0 }}>{plugin.name}</p>
        </div>
      </div>

      {/* نموذج المدخلات */}
      <div className="art-card art-tool-form">
        <h3 style={{ marginBottom: "16px" }}>المدخلات</h3>
        <div className="art-form-grid">
          <FormFields
            inputs={config.inputs}
            formData={formData}
            onFieldChange={onFieldChange}
          />
        </div>
        <button
          className="art-btn art-execute-btn"
          onClick={onExecute}
          disabled={loading}
          style={{ marginTop: "16px" }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="art-spinner" aria-hidden="true" />
              جاري التنفيذ...
            </>
          ) : (
            <>
              <Play size={18} aria-hidden="true" />
              تنفيذ
            </>
          )}
        </button>

        {error && <ErrorAlert message={error} />}
      </div>

      {/* نتيجة التنفيذ */}
      {result && <ExecutionResultDisplay result={result} />}
    </div>
  );
}

/**
 * المكون الرئيسي لصفحة الأدوات
 */
export default function Tools() {
  const { plugins } = usePlugins();
  const [selectedTool, setSelectedTool] = useState<ToolId | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * تحديث قيمة حقل في النموذج
   */
  const handleFieldChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  /**
   * اختيار أداة جديدة
   */
  const handleToolSelect = useCallback((toolId: ToolId) => {
    setSelectedTool(toolId);
    setFormData({});
    setResult(null);
    setError(null);
  }, []);

  /**
   * تنفيذ الأداة المحددة
   */
  const handleExecute = useCallback(async () => {
    if (!selectedTool) return;

    const config = toolConfigs[selectedTool];
    if (!config) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data: ApiResponse<Record<string, unknown>> = await response.json();
      
      setResult({
        success: data.success ?? response.ok,
        data: data.data,
        error: data.error,
      });

      if (!response.ok || data.success === false) {
        setError(data.error ?? "فشل تنفيذ الأداة");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "تعذر الاتصال بالخادم الرئيسي";
      setError(errorMessage);
      setResult({
        success: false,
        error: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [selectedTool, formData]);

  /**
   * الإضافة المحددة حالياً
   */
  const selectedPlugin = useMemo(
    () => (selectedTool ? plugins.find((p) => p.id === selectedTool) : null),
    [selectedTool, plugins]
  );

  return (
    <div className="art-director-page">
      {/* رأس الصفحة */}
      <header className="art-page-header">
        <Play size={32} className="header-icon" aria-hidden="true" />
        <div>
          <h1>جميع الأدوات</h1>
          <p>تشغيل واختبار أدوات CineArchitect</p>
        </div>
      </header>

      {/* تخطيط الأدوات */}
      <div className="art-tools-layout">
        <ToolsSidebar
          plugins={plugins}
          selectedTool={selectedTool}
          onToolSelect={handleToolSelect}
        />

        <main>
          {!selectedTool || !selectedPlugin ? (
            <NoToolSelected />
          ) : (
            <ToolWorkspace
              selectedTool={selectedTool}
              plugin={selectedPlugin}
              formData={formData}
              result={result}
              loading={loading}
              error={error}
              onFieldChange={handleFieldChange}
              onExecute={handleExecute}
            />
          )}
        </main>
      </div>
    </div>
  );
}
