#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|mjs)$/.test(entry.name)) out.push(path.relative(root, full));
  }
  return out;
}

const isServerFile = (rel) =>
  /^src\/features\/[^/]+\/actions\.ts$/.test(rel) || rel.startsWith("src/server/");

const isClientFile = (rel) =>
  rel.startsWith("src/components/") ||
  /^src\/features\/[^/]+\/(ui\.tsx|index\.ts)$/.test(rel) ||
  /^src\/lib\/(?:.*\/)?use-[^/]+\.ts$/.test(rel) ||
  rel.startsWith("src/app/");

for (const rel of walk(path.join(root, "src"))) {
  const text = fs.readFileSync(path.join(root, rel), "utf8");
  const head = text.split("\n").slice(0, 5).join("\n");

  if (/^\s*["\']use server["\'];?/m.test(head) && !isServerFile(rel)) {
    failures.push(`${rel}: "use server" разрешён только в features/*/actions.ts или src/server/**`);
  }
  if (/^\s*["\']use client["\'];?/m.test(head) && !isClientFile(rel)) {
    failures.push(`${rel}: "use client" разрешён только в components/**, features/*/{ui.tsx,index.ts}, app/**`);
  }
  if (/^src\/features\/[^/]+\/index\.ts$/.test(rel) && /from\s+["\']\.\/actions["\']/.test(text)) {
    failures.push(`${rel}: index.ts не должен экспортировать серверные действия`);
  }
  if (/^src\/features\/[^/]+\/contract\.ts$/.test(rel) && /from\s+["\'](react|rwsdk\/|@\/components|@\/features)/.test(text)) {
    failures.push(`${rel}: contract.ts должен оставаться чистыми данными без React и UI`);
  }
}

if (failures.length > 0) {
  console.error("Нарушения границ:");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}

console.log("Границы в порядке: server-файл и ui-файл по одному на фичу.");