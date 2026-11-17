const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.resolve("release");
const installers = fs
  .readdirSync(root)
  .filter((name) => /^Reinos-de-Acero-Setup-.*\.exe$/.test(name));
if (!installers.length)
  throw new Error("No se encontró el instalador de Windows.");
const lines = installers.map((name) => {
  const file = fs.readFileSync(path.join(root, name));
  if (file.length < 1024 * 1024 || file.toString("ascii", 0, 2) !== "MZ")
    throw new Error(`El archivo ${name} no es un ejecutable completo.`);
  const peOffset = file.readUInt32LE(0x3c);
  if (file.toString("ascii", peOffset, peOffset + 4) !== "PE\0\0")
    throw new Error(`Cabecera PE inválida: ${name}`);
  return `${crypto.createHash("sha256").update(file).digest("hex")}  ${name}`;
});
fs.writeFileSync(path.join(root, "SHA256SUMS.txt"), lines.join("\n") + "\n");
console.log(lines.join("\n"));
