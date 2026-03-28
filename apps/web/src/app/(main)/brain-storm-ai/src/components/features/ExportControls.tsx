"use client";

/**
 * @module ExportControls
 * @description أزرار تصدير نتائج الجلسة الحالية
 *
 * السبب: يتيح تصدير النتائج بصيغ مختلفة
 * لمشاركتها مع فريق الإنتاج
 */

import { useCallback, useState } from "react";
import { exportToJSON, exportToMarkdown, copyToClipboard } from "../../lib/export";
import type { Session, DebateMessage } from "../../types";

interface ExportControlsProps {
  session: Session;
  messages: DebateMessage[];
}

export function ExportControls({ session, messages }: ExportControlsProps) {
  const [copied, setCopied] = useState(false);

  const handleExportJSON = useCallback((): void => {
    exportToJSON(session, messages);
  }, [session, messages]);

  const handleExportMD = useCallback((): void => {
    exportToMarkdown(session, messages);
  }, [session, messages]);

  const handleCopy = useCallback(async (): Promise<void> => {
    try {
      await copyToClipboard(session, messages);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // تجاهل أخطاء النسخ
    }
  }, [session, messages]);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground font-cairo">تصدير:</span>
      <button
        onClick={handleExportJSON}
        className="px-3 py-1.5 text-xs border border-border bg-background text-foreground rounded-md hover:bg-muted transition font-cairo"
        title="تصدير بصيغة JSON"
      >
        JSON
      </button>
      <button
        onClick={handleExportMD}
        className="px-3 py-1.5 text-xs border border-border bg-background text-foreground rounded-md hover:bg-muted transition font-cairo"
        title="تصدير بصيغة Markdown"
      >
        Markdown
      </button>
      <button
        onClick={handleCopy}
        className={`px-3 py-1.5 text-xs border rounded-md transition font-cairo ${
          copied
            ? "border-green-500 bg-green-50 text-green-700"
            : "border-border bg-background text-foreground hover:bg-muted"
        }`}
        title="نسخ الملخص"
      >
        {copied ? "تم النسخ!" : "نسخ"}
      </button>
    </div>
  );
}
