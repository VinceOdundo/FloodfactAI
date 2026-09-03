/**
 * Minimal EWKB decoder for exactly the two shapes this app ever reads back
 * from a `geography` column: a Point (centroids) and a single-ring Polygon
 * (pilot-area boundaries — this codebase never creates one with holes).
 *
 * PostgREST returns `geography`/`geometry` columns as EWKB hex text, not
 * GeoJSON — there is no automatic GeoJSON negotiation for a plain base-table
 * column. Little-endian only (byte order 1), which is what every real
 * Postgres/PostGIS install actually emits.
 */

export interface GeoPointCoords {
  lon: number;
  lat: number;
}

const SRID_FLAG = 0x20000000;
const TYPE_POINT = 1;
const TYPE_POLYGON = 3;

function header(buf: Buffer): { geomType: number; offset: number } | null {
  if (buf.length < 5 || buf.readUInt8(0) !== 1) return null;
  const typeAndFlags = buf.readUInt32LE(1);
  const hasSrid = (typeAndFlags & SRID_FLAG) !== 0;
  const geomType = typeAndFlags & 0xff;
  return { geomType, offset: hasSrid ? 9 : 5 };
}

export function parseEwkbPoint(hex: string): GeoPointCoords | null {
  try {
    const buf = Buffer.from(hex, "hex");
    const h = header(buf);
    if (!h || h.geomType !== TYPE_POINT || buf.length < h.offset + 16) return null;
    return { lon: buf.readDoubleLE(h.offset), lat: buf.readDoubleLE(h.offset + 8) };
  } catch {
    return null;
  }
}

/** Returns the exterior ring only, as [lon, lat] pairs. */
export function parseEwkbPolygon(hex: string): [number, number][] | null {
  try {
    const buf = Buffer.from(hex, "hex");
    const h = header(buf);
    if (!h || h.geomType !== TYPE_POLYGON) return null;
    let offset = h.offset;
    const numRings = buf.readUInt32LE(offset);
    offset += 4;
    if (numRings < 1) return null;
    const numPoints = buf.readUInt32LE(offset);
    offset += 4;
    const ring: [number, number][] = [];
    for (let i = 0; i < numPoints; i++) {
      ring.push([buf.readDoubleLE(offset), buf.readDoubleLE(offset + 8)]);
      offset += 16;
    }
    return ring;
  } catch {
    return null;
  }
}
