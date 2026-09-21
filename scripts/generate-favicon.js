const fs = require("fs");
const path = require("path");

function generateIco() {
  const width = 32;
  const height = 32;

  // 32-bit BGRA buffer (bottom-up for Windows DIB)
  const bgra = Buffer.alloc(width * height * 4);

  // Line segment distance helper
  function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  // Generate 32x32 FloodFact AI Droplet
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // DIB is bottom-up: row 0 is bottom
      const dibY = y;
      const svgY = height - 1 - y;
      const svgX = x;

      const idx = (dibY * width + svgX) * 4;

      // Center x=16
      // Base circle center at (16, 20), radius 9.5
      // Apex at (16, 3)
      const cx = 15.5;
      const cy = 19.5;
      const r = 9.5;

      let inDroplet = false;
      let edgeDist = 999;

      if (svgY >= cy) {
        // Bottom circle
        const d = Math.hypot(svgX - cx, svgY - cy);
        edgeDist = r - d;
        inDroplet = edgeDist > -0.5;
      } else if (svgY >= 3) {
        // Cone to apex
        const t = (svgY - 3) / (cy - 3);
        const halfW = t * r;
        const dX = Math.abs(svgX - cx);
        edgeDist = halfW - dX;
        inDroplet = edgeDist > -0.5;
      }

      if (!inDroplet) {
        // Transparent
        bgra[idx] = 0;
        bgra[idx + 1] = 0;
        bgra[idx + 2] = 0;
        bgra[idx + 3] = 0;
        continue;
      }

      // Smooth anti-aliased edge
      const alpha = Math.max(0, Math.min(1, edgeDist + 0.5));

      // Droplet gradient: top (#06b6d4: R=6, G=182, B=212) -> mid (#0d9488: R=13, G=148, B=136) -> bottom (#0a474a: R=10, G=71, B=74)
      const tGrad = Math.max(0, Math.min(1, (svgY - 3) / 26));
      let red, green, blue;
      if (tGrad < 0.5) {
        const u = tGrad * 2;
        red = Math.round(6 * (1 - u) + 13 * u);
        green = Math.round(182 * (1 - u) + 148 * u);
        blue = Math.round(212 * (1 - u) + 136 * u);
      } else {
        const u = (tGrad - 0.5) * 2;
        red = Math.round(13 * (1 - u) + 10 * u);
        green = Math.round(148 * (1 - u) + 71 * u);
        blue = Math.round(136 * (1 - u) + 74 * u);
      }

      // Specular highlight on left shoulder
      if (svgX < cx - 1 && svgY < cy + 3 && svgY > 6) {
        const hDist = Math.abs(svgX - (cx - 4.5));
        if (hDist < 2.5) {
          const hFactor = (1 - hDist / 2.5) * 0.35;
          red = Math.round(red + (255 - red) * hFactor);
          green = Math.round(green + (255 - green) * hFactor);
          blue = Math.round(blue + (255 - blue) * hFactor);
        }
      }

      // Checkmark: (10.5, 19) -> (14.5, 23) -> (21.5, 14.5)
      const d1 = distToSegment(svgX, svgY, 10.5, 19, 14.5, 23);
      const d2 = distToSegment(svgX, svgY, 14.5, 23, 21.5, 14.5);
      const checkDist = Math.min(d1, d2);

      if (checkDist < 1.6) {
        const cFactor = Math.max(0, Math.min(1, 1.6 - checkDist));
        red = Math.round(red * (1 - cFactor) + 255 * cFactor);
        green = Math.round(green * (1 - cFactor) + 255 * cFactor);
        blue = Math.round(blue * (1 - cFactor) + 255 * cFactor);
      }

      // AI Beacon dot at checkmark tip (21.5, 14.5)
      const beaconDist = Math.hypot(svgX - 21.5, svgY - 14.5);
      if (beaconDist < 1.8) {
        const bFactor = Math.max(0, Math.min(1, 1.8 - beaconDist));
        // #38bdf8: R=56, G=189, B=248
        red = Math.round(red * (1 - bFactor) + 56 * bFactor);
        green = Math.round(green * (1 - bFactor) + 189 * bFactor);
        blue = Math.round(blue * (1 - bFactor) + 248 * bFactor);
      }

      // Write BGRA
      bgra[idx] = blue;
      bgra[idx + 1] = green;
      bgra[idx + 2] = red;
      bgra[idx + 3] = Math.round(alpha * 255);
    }
  }

  // 1-bit AND mask (32x32 = 128 bytes, all 0 for transparency handled by alpha)
  const mask = Buffer.alloc((width * height) / 8);

  // BITMAPINFOHEADER: 40 bytes
  const bih = Buffer.alloc(40);
  bih.writeUInt32LE(40, 0); // biSize
  bih.writeInt32LE(width, 4); // biWidth
  bih.writeInt32LE(height * 2, 8); // biHeight (doubled for ICO XOR+AND)
  bih.writeUInt16LE(1, 12); // biPlanes
  bih.writeUInt16LE(32, 14); // biBitCount (32-bit RGBA)
  bih.writeUInt32LE(0, 16); // biCompression (BI_RGB)
  bih.writeUInt32LE(bgra.length + mask.length, 20); // biSizeImage
  bih.writeInt32LE(0, 24); // biXPelsPerMeter
  bih.writeInt32LE(0, 28); // biYPelsPerMeter
  bih.writeUInt32LE(0, 32); // biClrUsed
  bih.writeUInt32LE(0, 36); // biClrImportant

  // ICONDIR: 6 bytes
  const iconDir = Buffer.alloc(6);
  iconDir.writeUInt16LE(0, 0); // reserved
  iconDir.writeUInt16LE(1, 2); // image type 1 = ICO
  iconDir.writeUInt16LE(1, 4); // number of images

  // ICONDIRENTRY: 16 bytes
  const iconEntry = Buffer.alloc(16);
  iconEntry.writeUInt8(width, 0); // width
  iconEntry.writeUInt8(height, 1); // height
  iconEntry.writeUInt8(0, 2); // color count
  iconEntry.writeUInt8(0, 3); // reserved
  iconEntry.writeUInt16LE(1, 4); // color planes
  iconEntry.writeUInt16LE(32, 6); // bits per pixel
  const totalImageSize = bih.length + bgra.length + mask.length;
  iconEntry.writeUInt32LE(totalImageSize, 8); // image size in bytes
  iconEntry.writeUInt32LE(22, 12); // offset (6 + 16 = 22)

  const icoBuffer = Buffer.concat([iconDir, iconEntry, bih, bgra, mask]);

  fs.writeFileSync(path.join(__dirname, "../app/favicon.ico"), icoBuffer);
  fs.writeFileSync(path.join(__dirname, "../public/favicon.ico"), icoBuffer);
  console.log("Successfully generated app/favicon.ico and public/favicon.ico!");
}

generateIco();
