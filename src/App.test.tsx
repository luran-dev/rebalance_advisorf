import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { portfolioSeed } from "./data";

const mocks = vi.hoisted(() => ({
  saveNow: vi.fn<() => Promise<boolean>>(),
  onLogout: vi.fn<() => Promise<void>>(),
  confirm: vi.fn<(message: string) => boolean>(),
  alert: vi.fn<(message: string) => void>(),
  navLogout: undefined as (() => Promise<void>) | undefined,
}));

vi.mock("./usePortfolioState", () => ({
  usePortfolioState: (portfolio: typeof portfolioSeed) => ({
    portfolio, setPortfolio: vi.fn(), saveStatus: "error", saveNow: mocks.saveNow,
  }),
}));
vi.mock("./components/AppShellNav", () => ({
  AppShellNav: ({ onLogout }: { onLogout: () => Promise<void> }) => {
    mocks.navLogout = onLogout;
    return null;
  },
}));

describe("logout with unsaved portfolio changes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.onLogout.mockResolvedValue();
    vi.stubGlobal("window", { confirm: mocks.confirm, alert: mocks.alert, localStorage: { getItem: () => null } });
    renderToString(<App initialPortfolio={portfolioSeed} userEmail="test@example.com" onLogout={mocks.onLogout} />);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("allows logout after saving fails when the user accepts losing unsaved changes", async () => {
    mocks.saveNow.mockResolvedValue(false);
    mocks.confirm.mockReturnValue(true);
    await mocks.navLogout?.();
    expect(mocks.confirm).toHaveBeenCalledOnce();
    expect(mocks.onLogout).toHaveBeenCalledOnce();
  });

  it("keeps the portfolio open when the user cancels after a failed save", async () => {
    mocks.saveNow.mockResolvedValue(false);
    mocks.confirm.mockReturnValue(false);
    await mocks.navLogout?.();
    expect(mocks.confirm).toHaveBeenCalledOnce();
    expect(mocks.onLogout).not.toHaveBeenCalled();
  });

  it("logs out without confirmation after a successful save", async () => {
    mocks.saveNow.mockResolvedValue(true);
    await mocks.navLogout?.();
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(mocks.onLogout).toHaveBeenCalledOnce();
  });

  it("reports a failed logout request instead of silently rejecting", async () => {
    mocks.saveNow.mockResolvedValue(true);
    mocks.onLogout.mockRejectedValue(new Error("offline"));
    await mocks.navLogout?.();
    expect(mocks.alert).toHaveBeenCalledWith(expect.stringContaining("로그아웃하지 못했습니다"));
  });
});
