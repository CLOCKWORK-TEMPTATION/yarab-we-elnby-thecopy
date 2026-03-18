import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WritingEditor } from "@/app/(main)/arabic-creative-writing-studio/components/WritingEditor";
import { vi, describe, it, expect } from "vitest";

const mockProject = {
  id: "test-project",
  title: "Test Project",
  content: "Test content",
  promptId: "test-prompt",
  genre: "fantasy" as const,
  wordCount: 2,
  characterCount: 12,
  paragraphCount: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: ["test"],
  isCompleted: false,
};

const mockPrompt = {
  id: "test-prompt",
  title: "Test Prompt",
  description: "A test prompt",
  genre: "fantasy" as const,
  technique: "character_driven" as const,
  difficulty: "intermediate" as const,
  wordCount: 1000,
  timeEstimate: "30 دقيقة",
  tags: ["test"],
  arabic: "محفز اختبار",
  tips: ["نصيحة 1", "نصيحة 2"],
};

describe("WritingEditor", () => {
  const defaultProps = {
    project: mockProject,
    selectedPrompt: mockPrompt,
    onProjectChange: vi.fn(),
    onSave: vi.fn(),
    onAnalyze: vi.fn().mockResolvedValue(null),
    onExport: vi.fn(),
    settings: {
      language: "ar" as const,
      theme: "dark" as const,
      textDirection: "rtl" as const,
      fontSize: "medium" as const,
      autoSave: true,
      autoSaveInterval: 30000,
      geminiModel: "gemini-2.5-pro" as const,
      geminiTemperature: 0.7,
      geminiMaxTokens: 8192,
    },
    loading: false,
  };

  it("renders project title and content", () => {
    render(<WritingEditor {...defaultProps} />);

    expect(screen.getByDisplayValue("Test Project")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test content")).toBeInTheDocument();
  });

  it("displays selected prompt information", () => {
    render(<WritingEditor {...defaultProps} />);

    expect(
      screen.getByText("📝 المحفز الإبداعي: Test Prompt")
    ).toBeInTheDocument();
    expect(screen.getByText("محفز اختبار")).toBeInTheDocument();
  });

  it("shows statistics panel", () => {
    render(<WritingEditor {...defaultProps} />);

    expect(screen.getByText("📊 إحصائيات النص")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // word count
    expect(screen.getByText("12")).toBeInTheDocument(); // character count
  });

  it("shows tips panel", () => {
    render(<WritingEditor {...defaultProps} />);

    expect(screen.getByText("💡 نصائح سريعة")).toBeInTheDocument();
    expect(
      screen.getByText("اكتب بدون توقف لأول 10 دقائق")
    ).toBeInTheDocument();
  });

  it("calls onSave when save button is clicked", () => {
    render(<WritingEditor {...defaultProps} />);

    fireEvent.click(screen.getByText("💾 حفظ"));
    expect(defaultProps.onSave).toHaveBeenCalled();
  });

  it("calls onAnalyze when analyze button is clicked", async () => {
    render(<WritingEditor {...defaultProps} />);

    fireEvent.click(screen.getByText("🔍 تحليل النص"));
    await waitFor(() => {
      expect(defaultProps.onAnalyze).toHaveBeenCalledWith("Test content");
    });
  });

  it("updates title when input changes", () => {
    render(<WritingEditor {...defaultProps} />);

    const titleInput = screen.getByDisplayValue("Test Project");
    fireEvent.change(titleInput, { target: { value: "New Title" } });

    expect(defaultProps.onProjectChange).toHaveBeenCalled();
  });

  it("updates content when textarea changes", () => {
    render(<WritingEditor {...defaultProps} />);

    const textarea = screen.getByDisplayValue("Test content");
    fireEvent.change(textarea, { target: { value: "New content" } });

    expect(defaultProps.onProjectChange).toHaveBeenCalled();
  });

  it("shows export dropdown when export button is clicked", () => {
    render(<WritingEditor {...defaultProps} />);

    const exportButton = screen.getByText("📤 تصدير");
    fireEvent.click(exportButton);

    expect(screen.getByText("📄 نص خالي (TXT)")).toBeInTheDocument();
    expect(screen.getByText("🌐 صفحة ويب (HTML)")).toBeInTheDocument();
  });

  it("calls onExport with correct format", () => {
    render(<WritingEditor {...defaultProps} />);

    const exportButton = screen.getByText("📤 تصدير");
    fireEvent.click(exportButton);

    fireEvent.click(screen.getByText("📄 نص خالي (TXT)"));
    expect(defaultProps.onExport).toHaveBeenCalledWith(mockProject, "txt");
  });

  it("shows empty state when no project", () => {
    render(<WritingEditor {...defaultProps} project={null} />);

    expect(screen.getByText("لا يوجد مشروع مفتوح")).toBeInTheDocument();
    expect(screen.getByText("✍️")).toBeInTheDocument();
  });

  it("disables analyze button when content is empty", () => {
    const emptyProject = { ...mockProject, content: "" };
    render(<WritingEditor {...defaultProps} project={emptyProject} />);

    const analyzeButton = screen.getByText("🔍 تحليل النص");
    expect(analyzeButton).toBeDisabled();
  });
});
