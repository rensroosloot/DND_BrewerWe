import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const publicDataFile = path.join(rootDir, "docs", "data", "kanka-public.json");
const npcDir = path.join(rootDir, "DND", "06_NPCs", "Kanka");
const assetDir = path.join(rootDir, "DND", "08_Assets", "Kanka", "Characters");

function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function extensionFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname);
    return ext || ".jpg";
  } catch {
    return ".jpg";
  }
}

async function downloadImage(url, filePath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Afbeelding kon niet worden opgehaald: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(filePath, buffer);
}

function buildNpcNote(character, imageVaultPath) {
  const imageBlock = imageVaultPath ? `![[${imageVaultPath}]]\n\n` : "";
  const typeLine = character.type ? `- Rol: ${character.type}\n` : "- Rol:\n";
  const summary = character.summary || "Nog geen publieke samenvatting.";
  const fullText = character.fullText || summary;

  return `# ${character.name}

${imageBlock}## Publiek
${typeLine}- Eerste indruk: ${summary}
- Verbinding met brouwerij:

## Privé
- Wil:
- Drukmiddel:
- Geheim:

## Status
- Houding: neutraal
- Laatst gezien:

## Kanka
- Bron: ${character.module}
- Kanka entity id: ${character.entityId ?? ""}
- Laatst bijgewerkt: ${character.updatedAt ?? ""}

## Notities
${fullText}
`;
}

async function main() {
  const raw = JSON.parse(await readFile(publicDataFile, "utf8"));
  const characters = raw.modules?.characters || [];

  await mkdir(npcDir, { recursive: true });
  await mkdir(assetDir, { recursive: true });

  for (const character of characters) {
    const safeName = slugify(character.name || "unnamed-character");
    let imageVaultPath = "";

    if (character.image) {
      const imageFileName = `${safeName}${extensionFromUrl(character.image)}`;
      const imageFilePath = path.join(assetDir, imageFileName);
      await downloadImage(character.image, imageFilePath);
      imageVaultPath = path.posix.join("08_Assets", "Kanka", "Characters", imageFileName);
    }

    const noteFilePath = path.join(npcDir, `${character.name}.md`);
    const noteContent = buildNpcNote(character, imageVaultPath);
    await writeFile(noteFilePath, noteContent, "utf8");
    console.log(`Bijgewerkt: ${path.relative(rootDir, noteFilePath)}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
