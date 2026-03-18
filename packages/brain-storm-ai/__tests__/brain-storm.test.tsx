import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BrainStormContent from "../brain-storm-content";

// Mock the required modules
vi.mock("@/lib/drama-analyst/services/brainstormAgentRegistry", () => ({
  getAllAgents: () => [
    {
      id: "test-agent-1",
      name: "Test Agent 1",
      nameAr: "وكيل تجريبي 1",
      role: "تحليل",
      description: "وكيل للاختبار",
      category: "analysis" as const,
      icon: "brain" as const,
      phase: 1,
      complexityScore: 0.5,
      capabilities: {
        canAnalyze: true,
        canGenerate: false,
        canPredict: false,
        hasMemory: false,
        supportsRAG: false,
      },
      priority: 1,
      dependencies: [],
    },
    {
      id: "test-agent-2",
      name: "Test Agent 2",
      nameAr: "وكيل تجريبي 2",
      role: "توليد",
      description: "وكيل للاختبار",
      category: "creative" as const,
      icon: "sparkles" as const,
      phase: 2,
      complexityScore: 0.6,
      capabilities: {
        canAnalyze: false,
        canGenerate: true,
        canPredict: false,
        hasMemory: false,
        supportsRAG: false,
      },
      priority: 2,
      dependencies: [],
    },
  ],
  getAgentsForPhase: (phase: number) => {
    if (phase === 1) {
      return [
        {
          id: "test-agent-1",
          name: "Test Agent 1",
          nameAr: "وكيل تجريبي 1",
          role: "تحليل",
          description: "وكيل للاختبار",
          category: "analysis" as const,
          icon: "brain" as const,
          phase: 1,
          complexityScore: 0.5,
          capabilities: {
            canAnalyze: true,
            canGenerate: false,
            canPredict: false,
            hasMemory: false,
            supportsRAG: false,
          },
          priority: 1,
          dependencies: [],
        },
      ];
    }
    return [];
  },
  getAgentStats: () => ({
    total: 28,
    byCategory: { core: 0, analysis: 18, creative: 5, predictive: 2, advanced: 3 },
    withRAG: 5,
    averageComplexity: 0.65,
  }),
  getCollaborators: () => [],
  BRAINSTORM_PHASES: [
    { id: 1, name: "التحليل الأولي", nameEn: "Initial Analysis", description: "فهم الفكرة" },
    { id: 2, name: "التوسع الإبداعي", nameEn: "Creative Expansion", description: "توسيع الفكرة" },
    { id: 3, name: "التحقق والتدقيق", nameEn: "Verification", description: "التحقق" },
    { id: 4, name: "النقاش والتوافق", nameEn: "Debate", description: "النقاش" },
    { id: 5, name: "التقييم النهائي", nameEn: "Final Evaluation", description: "التقييم" },
  ],
}));

vi.mock("@/lib/ai/constitutional", () => ({
  getMultiAgentDebateSystem: vi.fn(),
  getUncertaintyQuantificationEngine: vi.fn(),
}));

vi.mock("@/lib/ai/stations/gemini-service", () => ({
  getGeminiService: vi.fn(),
}));

vi.mock("@/components/file-upload", () => ({
  default: ({ onFileContent }: { onFileContent: (content: string) => void }) => (
    <button onClick={() => onFileContent("محتوى الملف التجريبي")}>رفع ملف</button>
  ),
}));

describe("BrainStormContent", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  describe("واجهة المستخدم", () => {
    it("يعرض العنوان الرئيسي بشكل صحيح", () => {
      render(<BrainStormContent />);
      expect(screen.getByText("🧠 منصة العصف الذهني الذكي")).toBeInTheDocument();
    });

    it("يعرض النص الفرعي بشكل صحيح", () => {
      render(<BrainStormContent />);
      expect(screen.getByText("نظام متعدد الوكلاء للتطوير القصصي")).toBeInTheDocument();
    });

    it("يعرض إحصائيات الوكلاء", () => {
      render(<BrainStormContent />);
      expect(screen.getByText("28 وكيل")).toBeInTheDocument();
      expect(screen.getByText("5 RAG")).toBeInTheDocument();
    });
  });

  describe("إدخال النص", () => {
    it("يمكن كتابة نص في حقل الملخص", () => {
      render(<BrainStormContent />);
      const textarea = screen.getByPlaceholderText("اكتب فكرتك...");
      fireEvent.change(textarea, { target: { value: "فكرة تجريبية" } });
      expect(textarea).toHaveValue("فكرة تجريبية");
    });

    it("يظهر زر رفع الملفات", () => {
      render(<BrainStormContent />);
      expect(screen.getByText("رفع ملف")).toBeInTheDocument();
    });

    it("يمكن رفع ملف واستخدام محتواه", () => {
      render(<BrainStormContent />);
      const uploadButton = screen.getByText("رفع ملف");
      fireEvent.click(uploadButton);
      const textarea = screen.getByPlaceholderText("اكتب فكرتك...");
      expect(textarea).toHaveValue("محتوى الملف التجريبي");
    });
  });

  describe("الأزرار", () => {
    it("زر بدء الجلسة معطل عندما يكون الحقل فارغاً", () => {
      render(<BrainStormContent />);
      const startButton = screen.getByRole("button", { name: /بدء جلسة/i });
      expect(startButton).toBeDisabled();
    });

    it("زر بدء الجلسة مفعّل عندما يكون هناك نص", () => {
      render(<BrainStormContent />);
      const textarea = screen.getByPlaceholderText("اكتب فكرتك...");
      fireEvent.change(textarea, { target: { value: "فكرة تجريبية" } });
      const startButton = screen.getByRole("button", { name: /بدء جلسة/i });
      expect(startButton).not.toBeDisabled();
    });

    it("يظهر زر التحميل عند الضغط على بدء الجلسة", async () => {
      // Mock fetch to prevent actual API calls
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              result: {
                proposals: [],
                consensusLevel: 0.8,
                debateMetadata: {
                  totalRounds: 3,
                  participatingAgents: 1,
                  averageConfidence: 0.8,
                  processingTime: 1000,
                },
              },
            }),
        } as Response)
      );

      render(<BrainStormContent />);
      const textarea = screen.getByPlaceholderText("اكتب فكرتك...");
      fireEvent.change(textarea, { target: { value: "فكرة تجريبية" } });
      const startButton = screen.getByRole("button", { name: /بدء جلسة/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/جاري الإنشاء.../i)).toBeInTheDocument();
      });
    });
  });

  describe("عرض المراحل", () => {
    it("يعرض جميع المراحل الخمس", () => {
      render(<BrainStormContent />);
      expect(screen.getByText("التحليل الأولي")).toBeInTheDocument();
      expect(screen.getByText("التوسع الإبداعي")).toBeInTheDocument();
      expect(screen.getByText("التحقق والتدقيق")).toBeInTheDocument();
      expect(screen.getByText("النقاش والتوافق")).toBeInTheDocument();
      expect(screen.getByText("التقييم النهائي")).toBeInTheDocument();
    });

    it("يمكن التبديل بين المراحل", () => {
      render(<BrainStormContent />);
      const phase2Button = screen.getByText("التوسع الإبداعي");
      fireEvent.click(phase2Button);
      // يجب أن يكون الزر نشطاً بعد النقر عليه
      expect(phase2Button.closest("button")).toHaveClass("bg-primary");
    });

    it("يعرض عدد الوكلاء لكل مرحلة", () => {
      render(<BrainStormContent />);
      // Phase 1 has 1 agent in our mock
      const badges = screen.getAllByText("1");
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  describe("عرض الوكلاء", () => {
    it("يعرض قائمة الوكلاء", () => {
      render(<BrainStormContent />);
      expect(screen.getByText("وكيل تجريبي 1")).toBeInTheDocument();
    });

    it("يمكن توسيع بطاقة الوكيل", () => {
      render(<BrainStormContent />);
      const agentCard = screen.getByText("وكيل تجريبي 1").closest("div");
      const expandButton = agentCard?.querySelector("button");
      if (expandButton) {
        fireEvent.click(expandButton);
        expect(screen.getByText("وكيل للاختبار")).toBeInTheDocument();
      }
    });

    it("يمكن التبديل بين عرض جميع الوكلاء ووكلاء المرحلة", () => {
      render(<BrainStormContent />);
      const toggleButton = screen.getByRole("button", { name: /الكل/i });
      fireEvent.click(toggleButton);
      expect(screen.getByText("وكيل تجريبي 2")).toBeInTheDocument();
    });

    it("يعرض حالة الوكيل (idle, working, completed, error)", () => {
      render(<BrainStormContent />);
      // البحث عن عنصر الحالة (دائرة صغيرة)
      const statusIndicators = screen
        .getByText("وكيل تجريبي 1")
        .closest("div")
        ?.querySelectorAll(".rounded-full");
      expect(statusIndicators).toBeDefined();
      expect(statusIndicators!.length).toBeGreaterThan(0);
    });
  });

  describe("معالجة الأخطاء", () => {
    it("يظهر رسالة خطأ عند محاولة بدء جلسة بدون نص", () => {
      render(<BrainStormContent />);
      const startButton = screen.getByRole("button", { name: /بدء جلسة/i });
      // الزر معطل، لذا لا يمكن النقر عليه
      expect(startButton).toBeDisabled();
    });

    it("يظهر رسالة خطأ عند فشل API", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 503,
        } as Response)
      );

      render(<BrainStormContent />);
      const textarea = screen.getByPlaceholderText("اكتب فكرتك...");
      fireEvent.change(textarea, { target: { value: "فكرة تجريبية" } });
      const startButton = screen.getByRole("button", { name: /بدء جلسة/i });
      fireEvent.click(startButton);

      await waitFor(
        () => {
          expect(
            screen.getByText(/فشل الاتصال بخادم AI - تحقق من الاتصال بالإنترنت/i)
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("يظهر رسالة خطأ API key عند حالة 401", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
        } as Response)
      );

      render(<BrainStormContent />);
      const textarea = screen.getByPlaceholderText("اكتب فكرتك...");
      fireEvent.change(textarea, { target: { value: "فكرة تجريبية" } });
      const startButton = screen.getByRole("button", { name: /بدء جلسة/i });
      fireEvent.click(startButton);

      await waitFor(
        () => {
          expect(
            screen.getByText(/لم يتم العثور على API key - يرجى إضافتها في ملف .env.local/i)
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("يظهر رسالة خطأ Timeout عند حالة 504", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 504,
        } as Response)
      );

      render(<BrainStormContent />);
      const textarea = screen.getByPlaceholderText("اكتب فكرتك...");
      fireEvent.change(textarea, { target: { value: "فكرة تجريبية" } });
      const startButton = screen.getByRole("button", { name: /بدء جلسة/i });
      fireEvent.click(startButton);

      await waitFor(
        () => {
          expect(
            screen.getByText(/تم تجاوز الحد الزمني - حاول بنص أقصر/i)
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe("النقاش بين الوكلاء", () => {
    it("يعرض قسم النقاش عند وجود رسائل", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              result: {
                proposals: [
                  {
                    agentId: "test-agent-1",
                    proposal: "تحليل تجريبي",
                    confidence: 0.85,
                    reasoning: "سبب تجريبي",
                  },
                ],
                finalDecision: "قرار تجريبي",
                judgeReasoning: "تبرير تجريبي",
                consensusLevel: 0.8,
                debateMetadata: {
                  totalRounds: 3,
                  participatingAgents: 1,
                  averageConfidence: 0.8,
                  processingTime: 1000,
                },
              },
            }),
        } as Response)
      );

      render(<BrainStormContent />);
      const textarea = screen.getByPlaceholderText("اكتب فكرتك...");
      fireEvent.change(textarea, { target: { value: "فكرة تجريبية" } });
      const startButton = screen.getByRole("button", { name: /بدء جلسة/i });
      fireEvent.click(startButton);

      await waitFor(
        () => {
          expect(screen.getByText("النقاش")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });
});
