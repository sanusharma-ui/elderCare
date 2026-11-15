import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

function createPng(width, height, drawFn) {
  const bytesPerPixel = 4;
  const scanlineLength = width * bytesPerPixel;
  const rawData = Buffer.alloc((scanlineLength + 1) * height);

  for (let y = 0; y < height; y++) {
    const lineStart = y * (scanlineLength + 1);
    rawData[lineStart] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelOffset = lineStart + 1 + x * bytesPerPixel;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression method
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // interlace method

  function createChunk(type, data) {
    const chunkLength = data.length;
    const chunk = Buffer.alloc(4 + 4 + chunkLength + 4);
    chunk.writeUInt32BE(chunkLength, 0);
    chunk.write(type, 4, 4, "ascii");
    data.copy(chunk, 8);

    // CRC32 calculation
    let crc = 0xffffffff;
    for (let i = 4; i < 8 + chunkLength; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ chunk[i]) & 0xff];
    }
    crc = (crc ^ 0xffffffff) >>> 0;
    chunk.writeUInt32BE(crc, 8 + chunkLength);
    return chunk;
  }

  const ihdrChunk = createChunk("IHDR", ihdr);
  const idatChunk = createChunk("IDAT", compressedData);
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

// Brand Palette
// Forest: 31, 92, 74 (#1F5C4A)
// Saffron: 227, 155, 43 (#E39B2B)
// Paper: 250, 245, 234 (#FAF5EA)
// Surface White: 255, 253, 247 (#FFFDF7)

function brandIconDrawer(x, y, w, h, isMaskable = false) {
  // Normalize coordinates [-1, 1]
  const nx = (x / w) * 2 - 1;
  const ny = (y / h) * 2 - 1;
  const r = Math.sqrt(nx * nx + ny * ny);

  // Background: Forest Green (#1F5C4A)
  let bgR = 31, bgG = 92, bgB = 74, bgA = 255;

  if (!isMaskable) {
    // Rounded rect badge with border radius 22%
    const cornerR = 0.44;
    const dx = Math.max(0, Math.abs(nx) - (1 - cornerR));
    const dy = Math.max(0, Math.abs(ny) - (1 - cornerR));
    const cornerDist = Math.sqrt(dx * dx + dy * dy);
    if (cornerDist > cornerR) {
      return [0, 0, 0, 0]; // Transparent outer
    }
  }

  // Draw diya flame & leaf motif in center
  // Center is (0, 0.05), flame peaks at (0, -0.45)
  const fx = nx;
  const fy = ny + 0.08;

  // Outer leaf/flame shape
  // Parametric teardrop/leaf: (x^2 + y^2)^2 < a * (y - x^2)
  const distFlame = Math.sqrt(fx * fx + fy * fy);
  const isFlameTop = fy < 0.25 && Math.abs(fx) < (0.35 * (0.35 - fy));
  const isPillBase = Math.abs(fx) < 0.38 && fy >= -0.15 && fy < 0.35;
  const isBaseCircle = fx * fx + (fy - 0.2) * (fy - 0.2) < 0.16;

  // Saffron diya flame (#E39B2B)
  const flameOuter = (fx * fx * 3.5) + ((fy + 0.1) * (fy + 0.1)) < 0.16 && fy < 0.22;
  const flamePeak = Math.abs(fx) < 0.2 && fy < 0 && fy > -0.55 && Math.abs(fx) < (0.55 + fy) * 0.45;

  // Golden Saffron leaf/diya
  if (flameOuter || flamePeak) {
    // Inner white pearl/pill highlight
    const isInnerHighlight = (fx * fx * 6) + ((fy + 0.05) * (fy + 0.05)) < 0.035;
    if (isInnerHighlight) {
      return [255, 253, 247, 255]; // Soft surface white
    }
    return [227, 155, 43, 255]; // Saffron #E39B2B
  }

  // Horizontal soothing pill band at base
  const isBaseBand = Math.abs(fx) < 0.42 && Math.abs(fy - 0.28) < 0.09;
  const isBasePillCaps = (Math.abs(fx) - 0.33) * (Math.abs(fx) - 0.33) + (fy - 0.28) * (fy - 0.28) < 0.0081;
  if (isBaseBand || isBasePillCaps) {
    return [250, 245, 234, 255]; // Warm paper #FAF5EA
  }

  return [bgR, bgG, bgB, bgA];
}

const outDir = path.resolve("public", "icons");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Generate icons
const sizes = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "icon-maskable-512.png", size: 512, maskable: true },
  { file: "apple-touch-icon.png", size: 180, maskable: false },
  { file: "favicon.png", size: 64, maskable: false },
];

for (const { file, size, maskable } of sizes) {
  const buf = createPng(size, size, (x, y, w, h) => brandIconDrawer(x, y, w, h, maskable));
  fs.writeFileSync(path.join(outDir, file), buf);
  console.log(`Generated public/icons/${file} (${size}x${size})`);
}

// Write SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="112" fill="#1F5C4A"/>
  <!-- Diya flame & medicinal leaf motif -->
  <path d="M256 96 C296 176 348 232 348 296 C348 352 308 392 256 392 C204 392 164 352 164 296 C164 232 216 176 256 96 Z" fill="#E39B2B"/>
  <!-- Inner calming leaf vein / pill center -->
  <path d="M256 160 C274 216 304 256 304 300 C304 336 280 360 256 360 C232 360 208 336 208 300 C208 256 238 216 256 160 Z" fill="#FFFDF7" opacity="0.95"/>
  <!-- Calming medicine base -->
  <rect x="180" y="328" width="152" height="44" rx="22" fill="#FAF5EA"/>
  <circle cx="256" cy="350" r="8" fill="#1F5C4A"/>
</svg>`;

fs.writeFileSync(path.join(outDir, "icon.svg"), svgContent);
fs.writeFileSync(path.resolve("public", "favicon.svg"), svgContent);
console.log("Generated SVG brand icons.");
