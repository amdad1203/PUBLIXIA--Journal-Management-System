import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { unzipSync } from "fflate";
import { root } from "../backend/config/env.js";
const parent = path.resolve(root, ".local-data");
const target = await fs.mkdtemp(
  await fs
    .mkdir(parent, { recursive: true })
    .then(() => path.join(parent, "archive-check-")),
);
let child;
try {
  const zip = unzipSync(
    new Uint8Array(
      await fs.readFile(
        path.join(root, "deliverables/Publixia-Configured-PRIVATE.zip"),
      ),
    ),
  );
  for (const [name, bytes] of Object.entries(zip)) {
    const destination = path.resolve(target, name);
    if (!destination.startsWith(target + path.sep))
      throw new Error("Archive path escapes the validation directory.");
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, bytes);
  }
  const packageRoot = path.join(target, "PUBLIXIA");
  // Runtime imports resolve to the already installed, locked workspace dependencies.
  child = spawn(
    process.execPath,
    [path.join(packageRoot, "backend/server.js")],
    {
      cwd: packageRoot,
      windowsHide: true,
      env: {
        ...process.env,
        PORT: "4101",
        APP_URL: "http://localhost:4101",
        EMAIL_WORKER_ENABLED: "false",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let errors = "";
  child.stderr.on("data", (b) => {
    errors += b.toString();
  });
  let ok = false;
  for (let i = 0; i < 40; i++) {
    if (child.exitCode !== null)
      throw new Error("Extracted server exited before readiness.");
    try {
      const health = await fetch("http://127.0.0.1:4101/api/health", {
        signal: AbortSignal.timeout(1000),
      });
      if (health.ok) {
        ok = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ok) throw new Error("Extracted server failed to become ready.");
  const html = await fetch("http://127.0.0.1:4101/");
  const page = await html.text();
  if (!html.ok || !page.includes("Publixia"))
    throw new Error(
      "Packaged frontend failed: " + html.status + " " + page.slice(0, 200),
    );
  const journals = await fetch("http://127.0.0.1:4101/api/journals");
  if (!journals.ok || !(await journals.json()).length)
    throw new Error("Packaged database API failed.");
  const privateData = await fetch("http://127.0.0.1:4101/api/projects");
  if (privateData.status !== 401)
    throw new Error("Packaged authentication guard failed.");
  console.log(
    JSON.stringify(
      {
        archiveExtraction: true,
        serverStarts: true,
        atlas: true,
        frontend: true,
        publicCatalog: true,
        privateApiProtected: true,
        standaloneDependencyReinstall: false,
      },
      null,
      2,
    ),
  );
} finally {
  if (child && child.exitCode === null) {
    child.kill();
    await new Promise((resolve) => child.once("exit", resolve));
  }
  const resolved = path.resolve(target);
  if (
    !resolved.startsWith(parent + path.sep) ||
    !path.basename(resolved).startsWith("archive-check-")
  )
    throw new Error("Unsafe validation cleanup path.");
  await fs.rm(resolved, { recursive: true, force: true });
}
