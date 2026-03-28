/**
 * @module export
 * @description أدوات تصدير نتائج جلسات العصف الذهني
 *
 * السبب: يتيح للمستخدمين حفظ نتائج الجلسات
 * ومشاركتها مع فريق الإنتاج بصيغ مختلفة
 */

import type { Session, DebateMessage } from "../types";

/**
 * بيانات التصدير المُنظّمة
 */
interface ExportData {
  /** معلومات الجلسة الأساسية */
  session: {
    id: string;
    brief: string;
    phase: number;
    status: string;
    startTime: string;
  };
  /** رسائل النقاش مُرتّبة زمنياً */
  messages: Array<{
    agent: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
  /** النتائج النهائية */
  results: Record<string, unknown>;
  /** تاريخ التصدير */
  exportedAt: string;
  /** إصدار التصدير */
  version: string;
}

/**
 * تجهيز بيانات التصدير من الجلسة والرسائل
 */
function prepareExportData(
  session: Session,
  messages: DebateMessage[]
): ExportData {
  return {
    session: {
      id: session.id,
      brief: session.brief,
      phase: session.phase,
      status: session.status,
      startTime:
        session.startTime instanceof Date
          ? session.startTime.toISOString()
          : String(session.startTime),
    },
    messages: messages.map((m) => ({
      agent: m.agentName,
      type: m.type,
      message: m.message,
      timestamp:
        m.timestamp instanceof Date
          ? m.timestamp.toISOString()
          : String(m.timestamp),
    })),
    results: session.results || {},
    exportedAt: new Date().toISOString(),
    version: "1.0",
  };
}

/**
 * تنزيل ملف نصي
 */
function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * تصدير الجلسة بصيغة JSON
 *
 * @param session - بيانات الجلسة
 * @param messages - رسائل النقاش
 */
export function exportToJSON(
  session: Session,
  messages: DebateMessage[]
): void {
  const data = prepareExportData(session, messages);
  const json = JSON.stringify(data, null, 2);
  const filename = `brainstorm_${session.id}_${Date.now()}.json`;
  downloadFile(json, filename, "application/json;charset=utf-8");
}

/**
 * تصدير الجلسة بصيغة Markdown
 *
 * @param session - بيانات الجلسة
 * @param messages - رسائل النقاش
 */
export function exportToMarkdown(
  session: Session,
  messages: DebateMessage[]
): void {
  const data = prepareExportData(session, messages);

  let md = `# تقرير جلسة العصف الذهني\n\n`;
  md += `**المعرّف:** ${data.session.id}\n\n`;
  md += `**الموجز:** ${data.session.brief}\n\n`;
  md += `**المرحلة:** ${data.session.phase} / 5\n\n`;
  md += `**الحالة:** ${data.session.status}\n\n`;
  md += `**تاريخ البدء:** ${data.session.startTime}\n\n`;
  md += `**تاريخ التصدير:** ${data.exportedAt}\n\n`;
  md += `---\n\n`;
  md += `## مسار النقاش\n\n`;

  const typeLabels: Record<string, string> = {
    proposal: "اقتراح",
    critique: "نقد",
    agreement: "اتفاق",
    decision: "قرار",
  };

  for (const msg of data.messages) {
    const typeLabel = typeLabels[msg.type] || msg.type;
    md += `### ${msg.agent} — ${typeLabel}\n\n`;
    md += `${msg.message}\n\n`;
    md += `_${msg.timestamp}_\n\n`;
    md += `---\n\n`;
  }

  if (Object.keys(data.results).length > 0) {
    md += `## النتائج\n\n`;
    md += `\`\`\`json\n${JSON.stringify(data.results, null, 2)}\n\`\`\`\n`;
  }

  const filename = `brainstorm_${session.id}_${Date.now()}.md`;
  downloadFile(md, filename, "text/markdown;charset=utf-8");
}

/**
 * نسخ ملخص الجلسة إلى الحافظة
 *
 * @param session - بيانات الجلسة
 * @param messages - رسائل النقاش
 * @returns وعد يُحل عند نجاح النسخ
 */
export async function copyToClipboard(
  session: Session,
  messages: DebateMessage[]
): Promise<void> {
  let text = `جلسة عصف ذهني: ${session.brief}\n\n`;

  const decisions = messages.filter((m) => m.type === "decision");
  if (decisions.length > 0) {
    text += `القرارات:\n`;
    decisions.forEach((d) => {
      text += `- ${d.agentName}: ${d.message}\n`;
    });
    text += `\n`;
  }

  const proposals = messages.filter((m) => m.type === "proposal");
  if (proposals.length > 0) {
    text += `الاقتراحات:\n`;
    proposals.forEach((p) => {
      text += `- ${p.agentName}: ${p.message.substring(0, 200)}...\n`;
    });
  }

  await navigator.clipboard.writeText(text);
}
