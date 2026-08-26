const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const OUTPUT_LIMIT = 12_000;

function buildConfiguration(directory) {
  const resolved = path.resolve(directory);
  const packagePath = path.join(resolved, "package.json");
  if (!fs.existsSync(packagePath)) throw new Error("O projeto React não contém package.json.");
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  if (!packageJson.scripts?.build) throw new Error("O projeto React não possui o comando de compilação.");
  const windows = process.platform === "win32";
  return {
    directory: resolved,
    command: windows ? process.env.ComSpec || "cmd.exe" : "npm",
    args: windows ? ["/d", "/s", "/c", `pushd "${resolved}" && npm run build`] : ["run", "build"],
  };
}

function appendOutput(current, chunk) {
  const next = `${current}${chunk}`;
  return next.length > OUTPUT_LIMIT ? next.slice(-OUTPUT_LIMIT) : next;
}

function runPortalBuild(directory) {
  let configuration;
  try { configuration = buildConfiguration(directory); } catch (error) {
    return Promise.resolve({ ok: false, error: error.message });
  }
  return new Promise((resolve) => {
    const startedAt = Date.now();
    let output = "";
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve({ ...result, durationMs: Date.now() - startedAt, output: output.trim() });
    };
    let child;
    try {
      child = spawn(configuration.command, configuration.args, {
        cwd: configuration.directory,
        env: { ...process.env, CI: "1" },
        windowsHide: true,
      });
    } catch (error) {
      finish({ ok: false, error: error.message });
      return;
    }
    child.stdout?.on("data", (chunk) => { output = appendOutput(output, chunk.toString()); });
    child.stderr?.on("data", (chunk) => { output = appendOutput(output, chunk.toString()); });
    child.on("error", (error) => finish({ ok: false, error: error.code === "ENOENT" ? "O Node.js e o npm precisam estar instalados para compilar o portal React." : error.message }));
    child.on("close", (code) => finish(code === 0 ? { ok: true } : {
      ok: false,
      error: `A compilação terminou com o código ${code}.${output.trim() ? `\n\n${output.trim()}` : ""}`,
    }));
  });
}

module.exports = { buildConfiguration, runPortalBuild };
