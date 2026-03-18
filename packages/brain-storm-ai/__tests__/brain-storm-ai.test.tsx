import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import BrainStormPage from "../page";

// Mock the BrainStormContent component
vi.mock("../brain-storm-content", () => ({
  default: () => (
    <div>
      <h1>جاري تحميل منصة العصف الذهني الذكي...</h1>
      <div className="container">Brain Storm AI Content</div>
    </div>
  ),
}));

describe("Brain Storm AI - Smoke Tests", () => {
  it("should render the loading state initially", () => {
    render(<BrainStormPage />);
    expect(screen.getByText(/جاري تحميل منصة العصف الذهني/i)).toBeInTheDocument();
  });

  it("should have the correct page structure", () => {
    const { container } = render(<BrainStormPage />);
    expect(container).toBeInTheDocument();
    expect(container.querySelector(".container")).toBeTruthy();
  });
});
