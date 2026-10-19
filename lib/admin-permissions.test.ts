import assert from "node:assert/strict";
import test from "node:test";
import { canManageUsers, isAdminRole, userAccessChangeError } from "./admin-permissions";

test("only the two configured roles enter the admin; user management belongs to general admins", () => {
  assert.equal(isAdminRole("admin"), true);
  assert.equal(isAdminRole("catalog_admin"), true);
  for (const role of [undefined, null, "user", "superadmin", "admin,catalog_admin", "ADMIN"]) {
    assert.equal(isAdminRole(role), false);
    assert.equal(canManageUsers(role), false);
  }
  assert.equal(canManageUsers("admin"), true);
  assert.equal(canManageUsers("catalog_admin"), false);
});

test("self access and the last active manager cannot be removed", () => {
  const target = { id: "general", role: "admin", banned: false };
  assert.match(userAccessChangeError("general", target, "catalog_admin", false, 2)!, /próprio acesso/);
  assert.match(userAccessChangeError("general", target, "admin", true, 2)!, /próprio acesso/);
  assert.match(userAccessChangeError("another", target, "catalog_admin", false, 1)!, /pelo menos um/);
  assert.match(userAccessChangeError("another", target, "admin", true, 1)!, /pelo menos um/);
  assert.equal(userAccessChangeError("another", target, "catalog_admin", false, 2), null);
  assert.equal(userAccessChangeError("general", target, "admin", false, 1), null);
});
