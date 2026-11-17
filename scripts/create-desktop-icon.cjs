// Original procedural shield/sword icon. No build-time image converter is needed.
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const size = 256,
  pixels = Buffer.alloc((size * 4 + 1) * size);
const polygon = (x, y, points) => {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i],
      [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
};
const shield = [
  [43, 47],
  [128, 20],
  [213, 47],
  [203, 159],
  [174, 203],
  [128, 238],
  [82, 203],
  [53, 159],
];
const inner = [
  [54, 56],
  [128, 32],
  [202, 56],
  [192, 155],
  [166, 194],
  [128, 224],
  [90, 194],
  [64, 155],
];
for (let y = 0; y < size; y++)
  for (let x = 0; x < size; x++) {
    const distance = Math.hypot(x - 128, y - 115) / 180;
    let color = [
      Math.round(27 - distance * 10),
      Math.round(48 - distance * 17),
      Math.round(40 - distance * 14),
      255,
    ];
    if (polygon(x, y, shield))
      color = [
        194 + Math.round(25 * (1 - y / 256)),
        161 + Math.round(23 * (1 - y / 256)),
        87,
        255,
      ];
    if (polygon(x, y, inner))
      color = [
        36 + Math.round(18 * (1 - y / 256)),
        67 + Math.round(15 * (1 - y / 256)),
        57,
        255,
      ];
    if (x > 123 && x < 133 && y > 53 && y < 162)
      color = x < 128 ? [223, 232, 215, 255] : [150, 174, 158, 255];
    if (
      polygon(x, y, [
        [123, 54],
        [128, 43],
        [133, 54],
      ])
    )
      color = [231, 238, 218, 255];
    if (y >= 160 && y < 167 && x > 102 && x < 154) color = [218, 182, 100, 255];
    if (x >= 123 && x < 133 && y >= 167 && y < 195) color = [116, 80, 44, 255];
    if (Math.hypot(x - 128, y - 199) < 7) color = [218, 182, 100, 255];
    const index = y * (size * 4 + 1) + 1 + x * 4;
    for (let c = 0; c < 4; c++) pixels[index + c] = color[c];
  }
function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type),
    out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length);
  name.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.length);
  return out;
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(size);
ihdr.writeUInt32BE(size, 4);
ihdr[8] = 8;
ihdr[9] = 6;
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(pixels)),
  chunk("IEND", Buffer.alloc(0)),
]);
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(22, 18);
const destination = path.join(__dirname, "..", "desktop", "resources");
fs.mkdirSync(destination, { recursive: true });
fs.writeFileSync(path.join(destination, "icon.png"), png);
fs.writeFileSync(
  path.join(destination, "icon.ico"),
  Buffer.concat([header, png]),
);
console.log("Iconos PNG e ICO generados.");
