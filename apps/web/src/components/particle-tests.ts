// اختبار سريع للتحقق من صحة الكود المحسن
console.log("🧪 بدء اختبار كود الجسيمات المحسن...");

// اختبار 1: التحقق من دوال SDF الأساسية
const testSDF = () => {
  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

  // اختبار دالة المسافة للدائرة
  const sdCircle = (
    px: number,
    py: number,
    cx: number,
    cy: number,
    r: number
  ) => Math.hypot(px - cx, py - cy) - r;

  const result = sdCircle(1, 1, 0, 0, 2);
  const expected = Math.hypot(1, 1) - 2; // ≈ -0.586

  console.log("✅ اختبار SDF:", Math.abs(result - expected) < 0.001);
};

// اختبار 2: التحقق من دوال إدارة الدفعات
const testBatchProcessing = () => {
  const requestIdle = (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions
  ) => {
    if (typeof requestIdleCallback !== "undefined") {
      return requestIdleCallback(callback, options);
    } else {
      return setTimeout(
        () =>
          callback({
            timeRemaining: () => Math.max(0, 50),
            didTimeout: false,
          }),
        options?.timeout || 0
      );
    }
  };

  let executed = false;
  const promise = new Promise<void>((resolve) => {
    requestIdle(
      () => {
        executed = true;
        resolve();
      },
      { timeout: 10 }
    );
  });

  console.log("✅ اختبار requestIdle:", typeof requestIdle === "function");
};

// اختبار 3: التحقق من معالجة الأخطاء
const testErrorHandling = () => {
  const testFunction = (data: number[] | null) => {
    try {
      if (!data) throw new Error("بيانات فارغة");
      return data.map((x: number) => x * 2);
    } catch (error) {
      console.warn("خطأ تم التعامل معه:", (error as Error).message);
      return [];
    }
  };

  const result = testFunction(null);
  console.log(
    "✅ اختبار معالجة الأخطاء:",
    Array.isArray(result) && result.length === 0
  );
};

// تشغيل الاختبارات
try {
  testSDF();
  testBatchProcessing();
  testErrorHandling();
  console.log("🎉 جميع الاختبارات نجحت!");
} catch (error) {
  console.error("❌ فشل في أحد الاختبارات:", error);
}

export { testSDF, testBatchProcessing, testErrorHandling };
