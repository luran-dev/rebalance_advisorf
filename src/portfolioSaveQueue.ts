export class PortfolioSaveQueue {
  #pending: Promise<void> = Promise.resolve();

  enqueue(task: () => Promise<void>): Promise<void> {
    const request = this.#pending.then(task);
    this.#pending = request.then(
      () => undefined,
      () => undefined,
    );
    return request;
  }
}
