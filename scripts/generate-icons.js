import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawPixel) {
  // Uncompressed raw scanlines: each row starts with filter byte 0
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // None filter
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixel(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // color type 6 (RGBA)
  ihdrData.writeUInt8(0, 10); // compression method 0
  ihdrData.writeUInt8(0, 11); // filter method 0
  ihdrData.writeUInt8(0, 12); // interlace method 0

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', deflated);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(4 + 4 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crcTarget = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = crc32(crcTarget);
  chunk.writeUInt32BE(crc, 8 + length);

  return chunk;
}

// CRC32 implementation
function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }

  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function drawAuraIcon(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxR = w / 2;

  // Background circle
  if (dist > maxR - 0.5) {
    return [0, 0, 0, 0]; // transparent outside
  }

  const normDist = dist / maxR;
  // Gradient from Indigo (#6366f1) to Purple (#8b5cf6) to Cyan (#06b6d4)
  const angle = Math.atan2(dy, dx);
  const t = (angle + Math.PI) / (2 * Math.PI);

  // Inner ring glow
  let r = Math.floor(99 * (1 - t) + 6 * t);
  let g = Math.floor(102 * (1 - t) + 182 * t);
  let b = Math.floor(241 * (1 - t) + 212 * t);
  let a = 255;

  // Smooth antialias on border
  if (dist > maxR - 1.5) {
    const aa = (maxR - dist) / 1.5;
    a = Math.floor(255 * Math.max(0, Math.min(1, aa)));
  }

  // Central symbol (sparkle / A shape)
  const innerDist = dist / maxR;
  if (innerDist < 0.45) {
    // bright core
    r = Math.min(255, r + 120);
    g = Math.min(255, g + 120);
    b = Math.min(255, b + 120);
  }

  return [r, g, b, a];
}

const iconsDir = path.resolve('public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 32, 48, 128].forEach(size => {
  const pngBuffer = createPNG(size, size, drawAuraIcon);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), pngBuffer);
  console.log(`Generated icon-${size}.png (${size}x${size})`);
});
