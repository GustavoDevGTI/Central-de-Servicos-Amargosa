const http = require("node:http");
const net = require("node:net");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)));
  });
}

async function availablePort(preferred = 3100) {
  for (let port = preferred; port < preferred + 20; port += 1) if (await canListen(port)) return port;
  throw new Error("Não foi encontrada uma porta local livre para abrir o portal.");
}

function serverConfiguration(directory, port) {
  const resolved = path.resolve(directory);
  const windows = process.platform === "win32";
  return {
    directory: resolved,
    command: windows ? process.env.ComSpec || "cmd.exe" : "npm",
    args: windows
      ? ["/d", "/s", "/c", `npm run start -- --hostname 127.0.0.1 --port ${port}`]
      : ["run", "start", "--", "--hostname", "127.0.0.1", "--port", String(port)],
  };
}

function waitForPortal(url, child, timeoutMs = 30_000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error) => { if (settled) return; settled = true; clearInterval(timer); child.off("exit", onExit); error ? reject(error) : resolve(); };
    const onExit = (code) => finish(new Error(`O servidor local foi encerrado antes de iniciar (código ${code ?? "desconhecido"}).`));
    const probe = () => {
      if (Date.now() - startedAt > timeoutMs) return finish(new Error("O servidor local demorou demais para iniciar."));
      const request = http.get(url, (response) => { response.resume(); if ((response.statusCode || 500) < 500) finish(); });
      request.setTimeout(800, () => request.destroy()); request.on("error", () => {});
    };
    child.once("exit", onExit); const timer = setInterval(probe, 250); probe();
  });
}

function createLocalPortalService({ preferredPort = 3100 } = {}) {
  let runtime = null;

  async function stop() {
    const previous = runtime; runtime = null;
    if (!previous?.child || previous.child.killed) return;
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(previous.child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
    else previous.child.kill("SIGTERM");
  }

  async function restart(directory) {
    await stop();
    const port = await availablePort(preferredPort);
    const configuration = serverConfiguration(directory, port);
    const child = spawn(configuration.command, configuration.args, { cwd: configuration.directory, env: { ...process.env, BROWSER: "none" }, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let output = ""; const collect = (chunk) => { output = `${output}${chunk}`.slice(-8_000); };
    child.stdout?.on("data", collect); child.stderr?.on("data", collect);
    const url = `http://127.0.0.1:${port}`;
    runtime = { child, directory: configuration.directory, port, url };
    try { await waitForPortal(url, child); return { ok: true, url, port }; }
    catch (error) { await stop(); return { ok: false, error: output.trim() ? `${error.message}\n${output.trim()}` : error.message }; }
  }

  return { restart, stop };
}

module.exports = { availablePort, canListen, createLocalPortalService, serverConfiguration, waitForPortal };
