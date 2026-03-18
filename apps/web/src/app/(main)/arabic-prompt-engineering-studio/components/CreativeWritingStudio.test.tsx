import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CreativeWritingStudio } from "@/app/(main)/arabic-creative-writing-studio/components/CreativeWritingStudio";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock the child components
vi.mock("./PromptLibrary", () => ({
  PromptLibrary: ({ onPromptSelect, onEnhancePrompt, loading }: any) => (
    <div data-testid="prompt-library">
      <button
        onClick={() => onPromptSelect({ id: "test", title: "Test Prompt" })}
      >
        Select Prompt
      </button>
      <button
        onClick={() =>
          onEnhancePrompt("test prompt", "fantasy", "character_driven")
        }
      >
        Enhance Prompt
      </button>
      {loading && <div>Loading...</div>}
    </div>
  ),
}));

vi.mock("./WritingEditor", () => ({
  WritingEditor: ({ onSave }: any) => (
    <div data-testid="writing-editor">
      <button onClick={() => onSave({ id: "test", title: "Test Project" })}>
        Save Project
      </button>
    </div>
  ),
}));

vi.mock("./SettingsPanel", () => ({
  SettingsPanel: ({ onSettingsUpdate }: any) => (
    <div data-testid="settings-panel">
      <button onClick={() => onSettingsUpdate({ language: "ar" })}>
        Update Settings
      </button>
    </div>
  ),
}));

// Mock GeminiService
vi.mock("../lib/gemini-service", () => ({
  GeminiService: class {
    analyzeText = vi
      .fn()
      .mockResolvedValue({ success: true, data: { qualityMetrics: {} } });
    testConnection = vi.fn().mockResolvedValue({ success: true });
  },
}));

describe("CreativeWritingStudio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the main interface with navigation", () => {
    render(<CreativeWritingStudio />);

    expect(
      screen.getByText("🎨 استوديو الكتابة الإبداعية")
    ).toBeInTheDocument();
    expect(screen.getByText("🏠 الرئيسية")).toBeInTheDocument();
    expect(screen.getByText("📚 مكتبة المحفزات")).toBeInTheDocument();
    expect(screen.getByText("✍️ المحرر")).toBeInTheDocument();
    expect(screen.getByText("⚙️ الإعدادات")).toBeInTheDocument();
  });

  it("displays home view by default", () => {
    render(<CreativeWritingStudio />);

    expect(
      screen.getByText("مرحباً بك في عالم الإبداع! 🌟")
    ).toBeInTheDocument();
    expect(screen.getByText("مكتبة المحفزات")).toBeInTheDocument();
    expect(screen.getByText("ابدأ الكتابة")).toBeInTheDocument();
  });

  it("navigates to library view", () => {
    render(<CreativeWritingStudio />);

    fireEvent.click(screen.getByText("📚 مكتبة المحفزات"));
    expect(screen.getByTestId("prompt-library")).toBeInTheDocument();
  });

  it("navigates to settings view", () => {
    render(<CreativeWritingStudio />);

    fireEvent.click(screen.getByText("⚙️ الإعدادات"));
    expect(screen.getByTestId("settings-panel")).toBeInTheDocument();
  });

  it("creates new project from home", () => {
    render(<CreativeWritingStudio />);

    fireEvent.click(screen.getByText("ابدأ الكتابة"));
    expect(screen.getByTestId("writing-editor")).toBeInTheDocument();
  });

  it("shows notification when project is saved", async () => {
    render(<CreativeWritingStudio />);

    // Navigate to editor
    fireEvent.click(screen.getByText("ابدأ الكتابة"));

    // Click save
    fireEvent.click(screen.getByText("Save Project"));

    await waitFor(() => {
      expect(screen.getByText("تم حفظ المشروع بنجاح 🎉")).toBeInTheDocument();
    });
  });

  it("handles prompt selection from library", () => {
    render(<CreativeWritingStudio />);

    // Navigate to library
    fireEvent.click(screen.getByText("📚 مكتبة المحفزات"));

    // Select prompt
    fireEvent.click(screen.getByText("Select Prompt"));

    // Should navigate to editor
    expect(screen.getByTestId("writing-editor")).toBeInTheDocument();
  });

  it("updates settings", () => {
    render(<CreativeWritingStudio />);

    // Navigate to settings
    fireEvent.click(screen.getByText("⚙️ الإعدادات"));

    // Update settings
    fireEvent.click(screen.getByText("Update Settings"));

    // Should show notification
    expect(screen.getByText("تم حفظ الإعدادات ⚙️")).toBeInTheDocument();
  });
});
