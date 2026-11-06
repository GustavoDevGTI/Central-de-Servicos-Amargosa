import assert from "node:assert/strict";
import test from "node:test";
import { ServicePreviewSession } from "./service-preview-session";

type Preview = { draftId?: string; text: string };
function deferred() {
  let resolve!: (value: Preview) => void;
  const promise = new Promise<Preview>((done) => { resolve = done; });
  return { promise, resolve };
}

test("Save shares an in-flight automatic preview of the exact same input", async () => {
  const removed: string[] = [];
  const session = new ServicePreviewSession<Preview>(async (id) => { removed.push(id); });
  const pending = deferred();
  const automatic = session.read("service/version/edited-text", () => pending.promise);
  const save = session.read("service/version/edited-text", async () => { throw Error("Duplicate request"); });
  assert.equal(save, automatic);
  pending.resolve({ draftId: "current", text: "Edited text" });
  assert.equal((await save).text, "Edited text");
  assert.deepEqual(removed, []);
  session.clear();
  session.clear();
  assert.deepEqual(removed, ["current"]);
});

test("a late response from an older edit is retired without replacing the latest preview", async () => {
  const removed: string[] = [];
  const session = new ServicePreviewSession<Preview>(async (id) => { removed.push(id); });
  const old = deferred();
  const oldRequest = session.read("old", () => old.promise);
  const current = await session.read("latest", async () => ({ draftId: "latest", text: "Latest edit" }));
  old.resolve({ draftId: "old", text: "Old edit" });
  await oldRequest;
  assert.deepEqual(removed, ["old"]);
  assert.equal(await session.read("latest", async () => { throw Error("Lost latest preview"); }), current);
  session.clear();
  assert.deepEqual(removed, ["old", "latest"]);
});

test("discarding or closing an editor retires even a preview that has not finished yet", async () => {
  const removed: string[] = [];
  const session = new ServicePreviewSession<Preview>(async (id) => { removed.push(id); });
  const pending = deferred();
  const request = session.read("pending", () => pending.promise);
  session.clear();
  pending.resolve({ draftId: "discarded", text: "Discarded edit" });
  await request;
  assert.deepEqual(removed, ["discarded"]);
});

test("a failed preview can be retried, and draft cleanup failure does not prevent saving", async () => {
  const session = new ServicePreviewSession<Preview>(async () => { throw Error("Cleanup unavailable"); });
  await assert.rejects(session.read("same", async () => { throw Error("Preview unavailable"); }), /Preview unavailable/);
  const result = await session.read("same", async () => ({ draftId: "ready", text: "Retried edit" }));
  assert.equal(result.text, "Retried edit");
  session.clear();
  await Promise.resolve();
});
