import { render, screen, fireEvent } from "@testing-library/react";
import { PromptLibrary } from "@/app/(main)/arabic-creative-writing-studio/components/PromptLibrary";
import { vi, describe, it, expect } from "vitest";

describe("PromptLibrary", () => {
  const defaultProps = {
    onPromptSelect: vi.fn(),
    onEnhancePrompt: vi.fn().mockResolvedValue(null),
    loading: false,
  };

  it("renders the library title", () => {
    render(<PromptLibrary {...defaultProps} />);

    expect(screen.getByText("📚 مكتبة المحفزات الإبداعية")).toBeInTheDocument();
  });

  it("displays search input and filters", () => {
    render(<PromptLibrary {...defaultProps} />);

    expect(
      screen.getByPlaceholderText("ابحث في المحفزات...")
    ).toBeInTheDocument();
    expect(screen.getByText("جميع الأنواع")).toBeInTheDocument();
    expect(screen.getByText("جميع التقنيات")).toBeInTheDocument();
    expect(screen.getByText("جميع المستويات")).toBeInTheDocument();
  });

  it("shows prompt count", () => {
    render(<PromptLibrary {...defaultProps} />);

    expect(screen.getByText(/ت�� العثور على \d+ محفز/)).toBeInTheDocument();
  });

  it("renders prompt cards", () => {
    render(<PromptLibrary {...defaultProps} />);

    // Should show at least one prompt
    expect(screen.getByText("إيقاف الزمن")).toBeInTheDocument();
    expect(
      screen.getByText("شخصية تملك قدرة إيقاف الزمن مع ثمن باهظ")
    ).toBeInTheDocument();
  });

  it("filters prompts by search term", () => {
    render(<PromptLibrary {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("ابحث في المحفزات...");
    fireEvent.change(searchInput, { target: { value: "تنين" } });

    expect(screen.getByText("التنين الشقيق")).toBeInTheDocument();
    expect(screen.queryByText("إيقاف الزمن")).not.toBeInTheDocument();
  });

  it("calls onPromptSelect when prompt is selected", () => {
    render(<PromptLibrary {...defaultProps} />);

    // Find and click the first "ابدأ الكتابة" button
    const startButtons = screen.getAllByText("✍️ ابدأ الكتابة");
    fireEvent.click(startButtons[0]);

    expect(defaultProps.onPromptSelect).toHaveBeenCalled();
  });

  it("calls onEnhancePrompt when enhance button is clicked", () => {
    render(<PromptLibrary {...defaultProps} />);

    // Find and click the first "تحسين" button
    const enhanceButtons = screen.getAllByText("🚀 تحسين");
    fireEvent.click(enhanceButtons[0]);

    expect(defaultProps.onEnhancePrompt).toHaveBeenCalled();
  });

  it("shows loading state", () => {
    render(<PromptLibrary {...defaultProps} loading={true} />);

    // Should still render but enhance buttons should be disabled
    const enhanceButtons = screen.getAllByText("🚀 تحسين");
    expect(enhanceButtons[0]).toBeDisabled();
  });

  it("expands prompt details", () => {
    render(<PromptLibrary {...defaultProps} />);

    // Click expand button
    const expandButtons = screen.getAllByText("▼ عرض التفاصيل");
    fireEvent.click(expandButtons[0]);

    // Should show full prompt text
    expect(
      screen.getByText(
        "اكتب عن شخصية لديها القدرة على إيقاف الزمن، لكن كل مرة توقفه تكبر سنة واحدة. كيف ستستخدم هذه القدرة؟ وما الثمن الذي ستدفعه؟"
      )
    ).toBeInTheDocument();

    // Should show tips
    expect(
      screen.getByText("فكر في المواق�� التي تستحق التضحية بسنة من العمر")
    ).toBeInTheDocument();
  });

  it("shows empty state when no prompts match filter", () => {
    render(<PromptLibrary {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("ابحث في المحفزات...");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    expect(screen.getByText("لا توجد محفزات مطابقة")).toBeInTheDocument();
    expect(screen.getByText("🔍")).toBeInTheDocument();
  });
});
