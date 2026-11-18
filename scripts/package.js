import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { zipSync, unzipSync, strToU8 } from "fflate";
import { root, env } from "../backend/config/env.js";
const included = [
  "shared",
  "backend",
  "frontend",
  "scripts",
  "tests",
  "docs",
  "dist",
  "package.json",
  "package-lock.json",
  "vite.config.js",
  ".env.example",
  ".gitignore",
  "README.md",
  "PROJECT_STATUS.md",
  "ARCHITECTURE.md",
  "EVALUATION_COMPLIANCE.md",
  "IMPLEMENTATION_ROADMAP.md",
  "DATA_SOURCES.md",
  "API_INTEGRATIONS.md",
  "TEST_RESULTS.md",
  "DEVELOPMENT_LOG.md",
  "QA_REPORT.md",
  "IMPLEMENTATION_PLAN.md",
  "START-WINDOWS.cmd",
];
const source = {};
async function add(relative) {
  const absolute = path.join(root, relative);
  let s;
  try {
    s = await fs.stat(absolute);
  } catch {
    return;
  }
  if (s.isDirectory()) {
    for (const name of await fs.readdir(absolute)) {
      if (name === "node_modules" || name === ".vite") continue;
      await add(`${relative}/${name}`);
    }
  } else
    source[`PUBLIXIA/${relative.replaceAll("\\", "/")}`] = new Uint8Array(
      await fs.readFile(absolute),
    );
}
for (const entry of included) await add(entry);
if (!source["PUBLIXIA/dist/index.html"])
  throw new Error("Run npm run build before packaging.");
const secrets = [
  env.geminiKey,
  env.smtp.pass,
  env.jwtSecret,
  env.mongoUri,
  process.env.ADMIN_PASSWORD,
].filter(value => value && value.length >= 12);
try {const team=JSON.parse(await fs.readFile(path.join(root,'.local-data/team-credentials.json'),'utf8'));secrets.push(...team.map(u=>u.password).filter(value=>value && value.length>=12));}catch{}
for (const [name, bytes] of Object.entries(source)) {
  const value = Buffer.from(bytes).toString();
  if (secrets.some((secret) => value.includes(secret)))
    throw new Error(`Secret detected in shareable archive: ${name}`);
}
const out = path.join(root, "deliverables");
await fs.mkdir(out, { recursive: true });
const archives = [];
for (const privateBuild of [false, true]) {
  const entries = { ...source };
  if (privateBuild) {
    try { entries['PUBLIXIA/PRIVATE_PRESENTATION_ACCOUNTS.md']=new Uint8Array(await fs.readFile(path.join(root,'PRIVATE_PRESENTATION_ACCOUNTS.md'))); } catch {}
    try {const files=JSON.parse(await fs.readFile(path.join(root,'.local-data/presentation-files.json'),'utf8'));for(const file of files){if(path.basename(file)!==file)throw new Error('Invalid presentation file path');entries[`PUBLIXIA/uploads/${file}`]=new Uint8Array(await fs.readFile(path.join(env.uploads,file)));}}catch(e){if(e.code!=='ENOENT')throw e;}
    try { entries['PUBLIXIA/PRIVATE_ALL_CREDENTIALS.md'] = new Uint8Array(await fs.readFile(path.join(root,'PRIVATE_ALL_CREDENTIALS.md'))); } catch {}
    try {
      entries["PUBLIXIA/PRIVATE_TEAM_CREDENTIALS.md"] = new Uint8Array(
        await fs.readFile(path.join(root, "PRIVATE_TEAM_CREDENTIALS.md")),
      );
    } catch {}
    entries["PUBLIXIA/.env"] = new Uint8Array(
      await fs.readFile(path.join(root, ".env")),
    );
    entries["PUBLIXIA/PRIVATE_SETUP.md"] = new Uint8Array(
      await fs.readFile(path.join(root, "PRIVATE_SETUP.md")),
    );
    entries["PUBLIXIA/PRIVATE-ARCHIVE.txt"] = strToU8(
      "This archive includes private API, database, SMTP and administrator credentials. Keep it private. Use Publixia-Source.zip when sharing code.\n",
    );
  }
  const bytes = zipSync(entries, { level: 6 });
  const file = privateBuild
    ? "Publixia-Configured-PRIVATE.zip"
    : "Publixia-Source.zip";
  await fs.writeFile(path.join(out, file), bytes);
  const checked = unzipSync(bytes);
  if (!checked["PUBLIXIA/package.json"] || !checked["PUBLIXIA/dist/index.html"])
    throw new Error("Archive verification failed.");
  if (!privateBuild && checked["PUBLIXIA/.env"])
    throw new Error("Source archive contains credentials.");
  archives.push({
    file,
    bytes: bytes.length,
    files: Object.keys(entries).length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}
await fs.writeFile(
  path.join(out, "checksums.json"),
  JSON.stringify(archives, null, 2) + "\n",
);
console.log(JSON.stringify(archives, null, 2));
