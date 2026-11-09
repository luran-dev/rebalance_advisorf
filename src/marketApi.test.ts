import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchMarketHistory, fetchMarketQuote } from "./marketApi";

afterEach(() => vi.unstubAllGlobals());

describe("latest market quote", () => {
  it("uses fresh short-range data when six-month data ends on an older date", async () => {
    const fetchMock = vi.fn(async (url: string) => new Response(JSON.stringify({
      items: url.includes("range=1w")
        ? [{ date: "2026-11-06", close: 22015 }]
        : [{ date: "2026-09-23", close: 25020 }],
    })));
    vi.stubGlobal("fetch", fetchMock);
    expect(await fetchMarketQuote("161510")).toMatchObject({ price: 22015, updatedAt: "2026-11-06" });
    expect(fetchMock).toHaveBeenCalledWith("/api/market?code=161510&range=1w", { cache: "no-store" });
  });

  it("bypasses previously cached chart responses for every period", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ items: [{ date: "2026-11-06", close: 22015 }] })));
    vi.stubGlobal("fetch", fetchMock);
    await fetchMarketHistory("161510", "6m");
    expect(fetchMock).toHaveBeenCalledWith("/api/market?code=161510&range=6m", { cache: "no-store" });
  });

  it("selects the latest dated close rather than response order or a period average", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      items: [
        { date: "2026-11-06", close: 300 },
        { date: "2026-05-06", close: 100 },
        { date: "2026-11-05", close: 200 },
      ],
    }))));
    expect(await fetchMarketQuote("069500")).toMatchObject({ price: 300, updatedAt: "2026-11-06" });
  });

  it.each([null, "", 0, -1, "not-a-price"])("does not replace the last valid price with %s", async (close) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      items: [{ date: "2026-11-05", close: 200 }, { date: "2026-11-06", close }],
    }))));
    expect(await fetchMarketQuote("069500")).toMatchObject({ price: 200, updatedAt: "2026-11-05" });
  });

  it("rejects an undated price instead of labeling it as today's quote", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({items:[{close:100}]}))));
    await expect(fetchMarketQuote("069500")).rejects.toThrow("시세 응답이 비어 있습니다.");
  });
});
