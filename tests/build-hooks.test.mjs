import assert from "node:assert/strict";
import { test } from "node:test";

import hooks from "../desktop/build-hooks.cjs";

test("desktop packaging handles runtime dependencies without portal node_modules", async () => {
  assert.equal(await hooks.beforeBuild(), false);
});
