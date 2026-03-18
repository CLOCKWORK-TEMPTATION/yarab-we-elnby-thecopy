import React from "react";
import { ScreenplayClassifier } from "../classes/ScreenplayClassifier";

/**
 * @function handlePaste
 * @description معالج اللصق - يقوم بتصنيف النص المُلصق سطرًا بسطر وتطبيق التنسيق المناسب
 * @param e - حدث اللصق
 * @param editorRef - مرجع للمحرر
 * @param getFormatStylesFn - دالة للحصول على الـ styles
 * @param updateContentFn - دالة لتحديث المحتوى
 */
export const handlePaste = (
  e: React.ClipboardEvent,
  editorRef: React.RefObject<HTMLDivElement | null>,
  getFormatStylesFn: (formatType: string) => React.CSSProperties,
  updateContentFn: () => void
) => {
  e.preventDefault();
  const textData = e.clipboardData.getData("text/plain");
  if (!textData) return;

  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;

  // 1. المعالجة باستخدام Sliding Window
  const classifiedLines = ScreenplayClassifier.classifyBatch(textData);

  // 2. بناء HTML بناءً على التصنيف الدقيق
  let formattedHTML = '';

  classifiedLines.forEach(line => {
    // إنشاء العنصر
    const div = document.createElement('div');
    div.className = line.type;
    div.textContent = line.text; // استخدم textContent للأمان

    // تطبيق الستايل (مهم جداً عشان يظهر صح فوراً)
    const styles = getFormatStylesFn(line.type);

    // تحويل الستايل إلى string
    const styleString = Object.entries(styles)
      .map(([key, value]) => {
        const cssKey = key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
        return `${cssKey}: ${String(value)}`;
      })
      .join("; ");

    div.setAttribute('style', styleString);

    formattedHTML += div.outerHTML;
  });

  // 3. إدخال المحتوى في المحرر
  const range = selection.getRangeAt(0);
  range.deleteContents();

  const fragment = range.createContextualFragment(formattedHTML);
  const lastNode = fragment.lastChild;
  range.insertNode(fragment);

  // تصحيح وضع المؤشر بعد اللصق
  if (lastNode) {
    range.setStartAfter(lastNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  updateContentFn();
};
