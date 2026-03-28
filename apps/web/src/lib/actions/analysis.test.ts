import { describe, expect, it } from "vitest";

import { runFullPipeline } from "./analysis";

describe("runFullPipeline", () => {
  it("يعيد نتيجة صالحة في وضع الاختبار عبر المسار الاحتياطي", async () => {
    const result = await runFullPipeline({
      fullText:
        "قالت سلمى: لن أترك المدينة. رد آدم بأن الخطر يقترب، وأن القرار القادم سيغيّر مصير العائلة كلها.",
      projectName: "اختبار خادمي",
    });

    expect(result.success).toBe(true);
    expect(result.mode).toBe("fallback");
    expect(result.stationOutputs.station7.finalReport).toBeTruthy();
  });

  it("يرفض الطلبات ذات النص الفارغ", async () => {
    await expect(
      runFullPipeline({
        fullText: "",
        projectName: "اختبار فشل",
      })
    ).rejects.toThrow();
  });
});
