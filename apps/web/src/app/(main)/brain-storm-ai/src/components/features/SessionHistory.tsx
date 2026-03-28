"use client";

/**
 * @module SessionHistory
 * @description لوحة عرض الجلسات المحفوظة مع إمكانية التحميل والحذف والتصدير
 *
 * السبب: يتيح للمستخدم الرجوع لجلسات سابقة واستعادتها
 * أو تصديرها لمشاركتها مع فريق العمل
 */

import { useCallback } from "react";
import type { SavedSession } from "../../hooks/useSessionPersistence";
import { exportToJSON, exportToMarkdown } from "../../lib/export";

interface SessionHistoryProps {
  sessions: SavedSession[];
  onLoad: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onClearAll: () => void;
}

export function SessionHistory({
  sessions,
  onLoad,
  onDelete,
  onClearAll,
}: SessionHistoryProps) {
  /**
   * تصدير جلسة محفوظة بصيغة JSON
   */
  const handleExportJSON = useCallback((saved: SavedSession): void => {
    exportToJSON(saved.session, saved.messages);
  }, []);

  /**
   * تصدير جلسة محفوظة بصيغة Markdown
   */
  const handleExportMD = useCallback((saved: SavedSession): void => {
    exportToMarkdown(saved.session, saved.messages);
  }, []);

  if (sessions.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground text-sm font-cairo">
          لا توجد جلسات محفوظة بعد
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-foreground font-cairo">
          الجلسات المحفوظة ({sessions.length})
        </h3>
        <button
          onClick={onClearAll}
          className="text-xs text-destructive hover:text-destructive/80 transition font-cairo"
        >
          مسح الكل
        </button>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {sessions.map((saved) => (
          <div
            key={saved.session.id}
            className="border border-border rounded-lg p-3 hover:bg-muted/50 transition"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate font-cairo">
                  {saved.session.brief}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 font-cairo">
                  المرحلة {saved.session.phase}/5 — {saved.messages.length} رسالة
                </p>
              </div>
              <span
                className={`shrink-0 px-2 py-0.5 text-xs rounded-full ${
                  saved.session.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : saved.session.status === "active"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                }`}
              >
                {saved.session.status === "completed"
                  ? "مكتمل"
                  : saved.session.status === "active"
                    ? "نشط"
                    : "متوقف"}
              </span>
            </div>

            <p className="text-xs text-muted-foreground mb-2 font-cairo">
              {new Date(saved.savedAt).toLocaleString("ar-SA")}
            </p>

            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => onLoad(saved.session.id)}
                className="px-2.5 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition font-cairo"
              >
                تحميل
              </button>
              <button
                onClick={() => handleExportJSON(saved)}
                className="px-2.5 py-1 text-xs border border-border bg-background text-foreground rounded hover:bg-muted transition font-cairo"
              >
                JSON
              </button>
              <button
                onClick={() => handleExportMD(saved)}
                className="px-2.5 py-1 text-xs border border-border bg-background text-foreground rounded hover:bg-muted transition font-cairo"
              >
                Markdown
              </button>
              <button
                onClick={() => onDelete(saved.session.id)}
                className="px-2.5 py-1 text-xs text-destructive border border-destructive/30 rounded hover:bg-destructive/10 transition font-cairo"
              >
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
