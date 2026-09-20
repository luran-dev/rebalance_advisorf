import { describe, expect, it } from "vitest";
import { PortfolioSaveQueue } from "./portfolioSaveQueue";

describe("PortfolioSaveQueue", () => {
  it("runs portfolio saves in request order", async () => {
    // Given
    const queue = new PortfolioSaveQueue();
    const order: number[] = [];
    let releaseFirst = (): void => {
      throw new Error("first save was not started");
    };
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    // When
    const first = queue.enqueue(async () => {
      order.push(1);
      await firstGate;
    });
    const second = queue.enqueue(async () => {
      order.push(2);
    });
    await Promise.resolve();

    // Then
    expect(order).toEqual([1]);
    releaseFirst();
    await Promise.all([first, second]);
    expect(order).toEqual([1, 2]);
  });
});
