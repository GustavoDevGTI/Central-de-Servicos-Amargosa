/** Share the exact preview between automatic updates and Save, and retire unused drafts. */
export class ServicePreviewSession<Result extends { draftId?: string }> {
  private current?: { key: string; promise: Promise<Result>; result?: Result };
  private released = new Set<string>();

  constructor(private remove: (draftId: string) => Promise<unknown>) {}

  read(key: string, create: () => Promise<Result>): Promise<Result> {
    if (this.current?.key === key) return this.current.promise;
    this.clear();
    const entry: NonNullable<typeof this.current> = { key, promise: undefined! };
    this.current = entry;
    entry.promise = Promise.resolve().then(create).then((result) => {
      entry.result = result;
      if (this.current !== entry) this.release(result);
      return result;
    }, (reason: unknown) => {
      if (this.current === entry) this.current = undefined;
      throw reason;
    });
    return entry.promise;
  }

  clear() {
    const previous = this.current;
    this.current = undefined;
    if (previous?.result) this.release(previous.result);
  }

  private release(result: Result) {
    if (!result.draftId || this.released.has(result.draftId)) return;
    this.released.add(result.draftId);
    // Cleanup must not turn a valid preview or publication into an editor error.
    void this.remove(result.draftId).catch(() => {});
  }
}
