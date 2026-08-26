import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import portalServer from "../desktop/services/local-portal-service.cjs";

test("configura o servidor local de produção na pasta do portal", () => {
  const configuration = portalServer.serverConfiguration(process.cwd(), 3100);
  assert.equal(configuration.directory, path.resolve(process.cwd()));
  assert.match(configuration.args.join(" "), /npm run start|run start/);
  assert.match(configuration.args.join(" "), /3100/);
});

test("encontra uma porta local disponível", async () => {
  const port = await portalServer.availablePort(3190);
  assert.ok(port >= 3190 && port < 3210);
});
