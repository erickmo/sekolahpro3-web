import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { QRCountdown } from "../QRCountdown";

describe("QRCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-29T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders QR code with token payload", () => {
    const exp = new Date(Date.now() + 30_000).toISOString();
    render(
      <QRCountdown token="abc.123" expIso={exp} onRefreshNeeded={() => {}} />,
    );
    // QR is rendered as canvas or svg; check the wrapper exposes data-testid
    expect(screen.getByTestId("qr-countdown")).toBeInTheDocument();
  });

  it("counts down the remaining seconds", () => {
    const exp = new Date(Date.now() + 30_000).toISOString();
    render(
      <QRCountdown token="abc.123" expIso={exp} onRefreshNeeded={() => {}} />,
    );
    expect(screen.getByTestId("qr-remaining").textContent).toContain("30");
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(screen.getByTestId("qr-remaining").textContent).toContain("25");
  });

  it("calls onRefreshNeeded when the token expires", () => {
    const exp = new Date(Date.now() + 5_000).toISOString();
    const onRefresh = vi.fn();
    render(
      <QRCountdown token="abc.123" expIso={exp} onRefreshNeeded={onRefresh} />,
    );
    expect(onRefresh).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(6_000);
    });
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
