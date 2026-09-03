import { describe, expect, it } from "vitest";
import { parseEwkbPoint, parseEwkbPolygon } from "@/lib/core/geo-wkb";

// Real EWKB hex pulled from this project's own `pilot_areas` table (Mukuru
// kwa Reuben's centroid/boundary) — this is the actual wire format Supabase
// returns for `geography` columns, not a synthetic example.
const REAL_CENTROID_HEX = "0101000020E610000090B7ECB5E67042400BF173990F0BF5BF";

describe("parseEwkbPoint", () => {
  it("decodes a real Point EWKB hex string", () => {
    const point = parseEwkbPoint(REAL_CENTROID_HEX);
    expect(point).not.toBeNull();
    expect(point!.lon).toBeCloseTo(36.882, 3);
    expect(point!.lat).toBeCloseTo(-1.3152, 3);
  });

  it("returns null for garbage input", () => {
    expect(parseEwkbPoint("not-hex")).toBeNull();
    expect(parseEwkbPoint("")).toBeNull();
  });

  it("returns null when given polygon hex", () => {
    const buf = Buffer.alloc(21);
    buf.writeUInt8(1, 0);
    buf.writeUInt32LE(0x20000003, 1); // Polygon + SRID flag, not Point
    expect(parseEwkbPoint(buf.toString("hex"))).toBeNull();
  });
});

describe("parseEwkbPolygon", () => {
  it("decodes a simple square ring built by hand", () => {
    const ring: [number, number][] = [
      [36.86, -1.3],
      [36.87, -1.3],
      [36.87, -1.31],
      [36.86, -1.31],
      [36.86, -1.3],
    ];
    const buf = Buffer.alloc(5 + 4 + 4 + 4 + ring.length * 16);
    let offset = 0;
    buf.writeUInt8(1, offset); offset += 1;
    buf.writeUInt32LE(0x20000003, offset); offset += 4; // Polygon + SRID
    buf.writeUInt32LE(4326, offset); offset += 4;
    buf.writeUInt32LE(1, offset); offset += 4; // 1 ring
    buf.writeUInt32LE(ring.length, offset); offset += 4;
    for (const [lon, lat] of ring) {
      buf.writeDoubleLE(lon, offset); offset += 8;
      buf.writeDoubleLE(lat, offset); offset += 8;
    }

    const parsed = parseEwkbPolygon(buf.toString("hex"));
    expect(parsed).toEqual(ring);
  });

  it("returns null for garbage input", () => {
    expect(parseEwkbPolygon("zz")).toBeNull();
  });

  it("returns null when given point hex", () => {
    expect(parseEwkbPolygon(REAL_CENTROID_HEX)).toBeNull();
  });
});
