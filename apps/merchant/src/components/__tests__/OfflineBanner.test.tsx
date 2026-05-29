import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OfflineBanner } from "../OfflineBanner";

describe("OfflineBanner", () => {
  it("renders when offline", () => {
    render(<OfflineBanner online={false} />);
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });
  it("renders nothing when online", () => {
    const { container } = render(<OfflineBanner online={true} />);
    expect(container).toBeEmptyDOMElement();
  });
});
