/**
 * Generates icon16.png, icon48.png, icon128.png using only Node.js built-ins.
 * Run: node packages/extension/scripts/generate-icons.js
 *
 * Design: purple gradient (#667eea → #764ba2) rounded square
 *         with a white 4-pointed star (✦) — matching the extension's brand.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ── CRC32 (required by PNG format) ──────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) crc = CRC_TABLE[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// ── PNG writer ───────────────────────────────────────────────────────────────

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(d.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, d])));
  return Buffer.concat([len, t, d, crc]);
}

function writePNG(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA

  // Filter byte 0 (None) before each row
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 4)] = 0;
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4;
      const dst = y * (1 + size * 4) + 1 + x * 4;
      raw[dst]     = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
      raw[dst + 3] = pixels[src + 3];
    }
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Geometry helpers ─────────────────────────────────────────────────────────

/** Is point (px, py) inside a rounded rectangle of given size? */
function inRoundedRect(px, py, size, r) {
  const dx = Math.max(r - px, 0, px - (size - 1 - r));
  const dy = Math.max(r - py, 0, py - (size - 1 - r));
  return dx * dx + dy * dy <= r * r;
}

/** Is point (px, py) inside the 4-pointed star polygon? */
function inStar(px, py, cx, cy, outer, inner) {
  // Star vertices: outer at 0°/90°/180°/270°, inner at 45°/135°/225°/315°
  const inv = inner / Math.SQRT2;
  const verts = [
    [cx,        cy - outer], // top
    [cx + inv,  cy - inv  ], // top-right inner
    [cx + outer,cy        ], // right
    [cx + inv,  cy + inv  ], // bottom-right inner
    [cx,        cy + outer], // bottom
    [cx - inv,  cy + inv  ], // bottom-left inner
    [cx - outer,cy        ], // left
    [cx - inv,  cy - inv  ], // top-left inner
  ];

  // Ray-casting point-in-polygon
  let inside = false;
  for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
    const [xi, yi] = verts[i];
    const [xj, yj] = verts[j];
    const intersect = (yi > py) !== (yj > py) &&
      px < (xj - xi) * (py - yi) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// ── Icon renderer ────────────────────────────────────────────────────────────

function renderIcon(size) {
  const pixels = new Uint8Array(size * size * 4);
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;

  // Proportional values
  const r   = size * 0.19;     // corner radius
  const outer = size * 0.358;  // star outer radius
  const inner = size * 0.155;  // star inner radius (at 45° diagonals)

  // Anti-alias width (in pixels) — skip for 16px (too small)
  const aaWidth = size >= 48 ? 1.2 : 0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      if (!inRoundedRect(x, y, size, r)) {
        pixels[idx + 3] = 0; // transparent outside rounded rect
        continue;
      }

      // ── Background gradient: #667eea → #764ba2 (diagonal) ──
      const t = (x + y) / (2 * (size - 1));
      pixels[idx]     = Math.round(0x66 + (0x76 - 0x66) * t); // R
      pixels[idx + 1] = Math.round(0x7e + (0x4b - 0x7e) * t); // G
      pixels[idx + 2] = Math.round(0xea + (0xa2 - 0xea) * t); // B
      pixels[idx + 3] = 255;

      // ── 4-pointed star (white) ──
      if (aaWidth > 0) {
        // Simple super-sample anti-alias (2×2)
        let hits = 0;
        const offsets = [-0.25, 0.25];
        for (const ox of offsets) for (const oy of offsets) {
          if (inStar(x + ox, y + oy, cx, cy, outer, inner)) hits++;
        }
        if (hits === 4) {
          pixels[idx] = pixels[idx + 1] = pixels[idx + 2] = 255;
        } else if (hits > 0) {
          const alpha = hits / 4;
          pixels[idx]     = Math.round(pixels[idx]     + (255 - pixels[idx])     * alpha);
          pixels[idx + 1] = Math.round(pixels[idx + 1] + (255 - pixels[idx + 1]) * alpha);
          pixels[idx + 2] = Math.round(pixels[idx + 2] + (255 - pixels[idx + 2]) * alpha);
        }
      } else {
        if (inStar(x, y, cx, cy, outer, inner)) {
          pixels[idx] = pixels[idx + 1] = pixels[idx + 2] = 255;
        }
      }
    }
  }

  return pixels;
}

// ── Generate & save ──────────────────────────────────────────────────────────

const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

for (const size of [16, 48, 128]) {
  const pixels = renderIcon(size);
  const png = writePNG(size, pixels);
  const file = path.join(outDir, `icon${size}.png`);
  fs.writeFileSync(file, png);
  console.log(`✓ icon${size}.png (${png.length} bytes)`);
}

console.log('\nDone! Icons saved to packages/extension/public/icons/');
