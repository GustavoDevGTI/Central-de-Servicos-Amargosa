const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const PREVIEW_PREFIX = "central-editor-react-preview-";

function reservePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

function writeJsonAtomic(filePath, content) {
  const temporary = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(content, null, 2)}\n`, "utf8");
  fs.renameSync(temporary, filePath);
}

function copyTree(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) copyTree(from, to);
    else if (entry.isFile()) fs.copyFileSync(from, to);
  }
}

function createProjectMirror(sourceDirectory, root, runtimeDirectory = path.join(__dirname, "..", "preview-runtime")) {
  const previewDirectory = path.join(root, "project");
  fs.mkdirSync(previewDirectory, { recursive: true });
  for (const directoryName of ["app", "content", "public"]) {
    const source = path.join(sourceDirectory, directoryName);
    if (fs.existsSync(source)) copyTree(source, path.join(previewDirectory, directoryName));
  }
  for (const fileName of ["package.json", "package-lock.json", "tsconfig.json", "next-env.d.ts", "next.config.ts"]) {
    const source = path.join(sourceDirectory, fileName);
    if (fs.existsSync(source)) fs.copyFileSync(source, path.join(previewDirectory, fileName));
  }
  fs.copyFileSync(path.join(runtimeDirectory, "vite.config.ts"), path.join(previewDirectory, "vite.config.ts"));
  fs.writeFileSync(path.join(previewDirectory, "index.html"), '<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prévia React</title></head><body><div id="root"></div><script type="module" src="/preview-entry.tsx"></script></body></html>', "utf8");
  fs.copyFileSync(path.join(runtimeDirectory, "preview-entry.tsx"), path.join(previewDirectory, "preview-entry.tsx"));
  fs.copyFileSync(path.join(runtimeDirectory, "next-link.tsx"), path.join(previewDirectory, "next-link.tsx"));
  fs.copyFileSync(path.join(runtimeDirectory, "editor-bridge.js"), path.join(previewDirectory, "editor-bridge.js"));
  const dependencies = path.join(sourceDirectory, "node_modules");
  if (!fs.existsSync(dependencies)) throw new Error("Execute npm install no projeto antes de abrir a prévia React.");
  fs.symlinkSync(dependencies, path.join(previewDirectory, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  return previewDirectory;
}

function waitForHttp(url, child, timeoutMs = 45_000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    let finished = false;
    const finish = (error) => {
      if (finished) return;
      finished = true;
      clearInterval(timer);
      child.off("exit", onExit);
      error ? reject(error) : resolve();
    };
    const onExit = (code) => finish(new Error(`A prévia React foi encerrada antes de iniciar (código ${code ?? "desconhecido"}).`));
    child.once("exit", onExit);
    const probe = () => {
      if (Date.now() - startedAt > timeoutMs) return finish(new Error("A prévia React demorou demais para iniciar."));
      const request = http.get(url, (response) => {
        response.resume();
        if ((response.statusCode || 500) < 500) finish();
      });
      request.setTimeout(900, () => request.destroy());
      request.on("error", () => {});
    };
    const timer = setInterval(probe, 250);
    probe();
  });
}

function createReactPreviewService({ temporaryDirectory = os.tmpdir(), runtimeDirectory = path.join(__dirname, "..", "preview-runtime") } = {}) {
  let runtime = null;

  async function stop() {
    const previous = runtime;
    runtime = null;
    if (!previous) return;
    if (previous.child && !previous.child.killed) {
      if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(previous.child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
      else previous.child.kill("SIGTERM");
    }
    const resolvedRoot = path.resolve(previous.root);
    const resolvedTemporary = path.resolve(temporaryDirectory);
    if (path.dirname(resolvedRoot) === resolvedTemporary && path.basename(resolvedRoot).startsWith(PREVIEW_PREFIX)) {
      try { fs.rmSync(resolvedRoot, { recursive: true, force: true }); } catch {}
    }
  }

  async function start(directory, content) {
    const projectDirectory = path.resolve(directory);
    if (runtime?.directory === projectDirectory && runtime.child && !runtime.child.killed) {
      writeJsonAtomic(runtime.draftFile, content);
      return { url: runtime.url, mode: "react", isolatedDraft: true };
    }
    await stop();
    const root = fs.mkdtempSync(path.join(path.resolve(temporaryDirectory), PREVIEW_PREFIX));
    const previewDirectory = createProjectMirror(projectDirectory, root, runtimeDirectory);
    const draftFile = path.join(previewDirectory, "content", "site.json");
    writeJsonAtomic(draftFile, content);
    const port = await reservePort();
    const url = `http://127.0.0.1:${port}`;
    const windows = process.platform === "win32";
    const command = windows ? process.env.ComSpec || "cmd.exe" : "npm";
    const args = windows
      ? ["/d", "/s", "/c", `npx vite --host 127.0.0.1 --port ${port} --strictPort`]
      : ["exec", "vite", "--", "--host", "127.0.0.1", "--port", String(port), "--strictPort"];
    const child = spawn(command, args, {
      cwd: previewDirectory,
      env: { ...process.env, BROWSER: "none", VINEXT_NO_DEV_LOCK: "1" },
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    const collect = (chunk) => { output = `${output}${chunk}`.slice(-8_000); };
    child.stdout?.on("data", collect);
    child.stderr?.on("data", collect);
    runtime = { child, directory: projectDirectory, draftFile, root, url, output };
    try {
      await waitForHttp(url, child);
      return { url, mode: "react", isolatedDraft: true };
    } catch (error) {
      const details = output.trim();
      await stop();
      throw new Error(details ? `${error.message}\n${details}` : error.message);
    }
  }

  function update(content) {
    if (!runtime) return { ok: false, error: "A prévia React ainda não foi iniciada." };
    writeJsonAtomic(runtime.draftFile, content);
    return { ok: true };
  }

  return { start, stop, update };
}

module.exports = { PREVIEW_PREFIX, copyTree, createProjectMirror, createReactPreviewService, reservePort, writeJsonAtomic };
