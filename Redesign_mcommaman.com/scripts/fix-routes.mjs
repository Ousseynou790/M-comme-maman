import { rename, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * L'export de la maquette ne peut pas contenir de crochets dans les noms de dossier.
 * Ce script rétablit les routes dynamiques Next.js : -slug- → [slug].
 * Il s'exécute automatiquement après « npm install » et ne fait rien s'il n'y a rien à faire.
 */
async function walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOENT") return; // rien à faire si le dossier n'existe pas
    throw err;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === "node_modules" || entry.name === ".next") continue;

    const current = join(dir, entry.name);
    const match = entry.name.match(/^-(\.\.\.)?([a-zA-Z0-9_]+)-$/);

    if (match) {
      const target = join(dir, `[${match[1] ?? ""}${match[2]}]`);
      try {
        await stat(target);
      } catch {
        await rename(current, target);
        console.log(`route rétablie : ${entry.name} → [${match[1] ?? ""}${match[2]}]`);
        await walk(target);
        continue;
      }
    }
    await walk(current);
  }
}

await walk(fileURLToPath(new URL("../app", import.meta.url)));
