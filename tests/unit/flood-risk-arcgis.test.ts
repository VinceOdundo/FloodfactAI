import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/env", () => ({
  env: { ARCGIS_FLOOD_LAYER_URL: "https://example.test/FeatureServer/0", ARCGIS_API_KEY: undefined },
}));

import { extractRiskLevel, getFloodRiskLive } from "@/lib/providers/flood-risk-arcgis/live";

function mockFetchOnce(features: Array<{ attributes: Record<string, unknown> }>) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ features }),
    })
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("extractRiskLevel", () => {
  it("reads a plain HAZARD/RiskLevel-style field", () => {
    expect(extractRiskLevel({ RiskLevel: "High" })).toBe("high");
    expect(extractRiskLevel({ HAZARD: "Low risk area" })).toBe("low");
  });

  it("reads WRI Aqueduct's rfr_label, including its 'Low - Medium' blend", () => {
    expect(extractRiskLevel({ rfr_label: "Low - Medium (1 in 1,000 to 2 in 1,000)" })).toBe("low");
    expect(extractRiskLevel({ rfr_label: "Extremely High (>1 in 10)" })).toBe("high");
  });

  it("returns null (not a fabricated default) when no recognized field is present", () => {
    expect(extractRiskLevel({ some_other_column: "whatever" })).toBeNull();
    expect(extractRiskLevel(undefined)).toBeNull();
  });
});

describe("getFloodRiskLive — inRiskZone derivation", () => {
  const point = { lat: -1.3152, lon: 36.882 };

  it("binary hazard-zone polygon (no risk field): presence means in-zone", () => {
    mockFetchOnce([{ attributes: { OBJECTID: 1 } }]);
    return getFloodRiskLive(point).then((result) => {
      expect(result.inRiskZone).toBe(true);
      expect(result.riskLevel).toBe("moderate");
    });
  });

  it("binary hazard-zone polygon: no intersecting feature means not in-zone", () => {
    mockFetchOnce([]);
    return getFloodRiskLive(point).then((result) => {
      expect(result.inRiskZone).toBe(false);
    });
  });

  it("wall-to-wall risk-category dataset: a low-risk label means NOT in-zone despite a feature always being present", () => {
    mockFetchOnce([{ attributes: { rfr_label: "Low - Medium (1 in 1,000 to 2 in 1,000)" } }]);
    return getFloodRiskLive(point).then((result) => {
      expect(result.inRiskZone).toBe(false);
      expect(result.riskLevel).toBe("low");
    });
  });

  it("wall-to-wall risk-category dataset: a high-risk label means in-zone", () => {
    mockFetchOnce([{ attributes: { rfr_label: "Extremely High (>1 in 10)" } }]);
    return getFloodRiskLive(point).then((result) => {
      expect(result.inRiskZone).toBe(true);
      expect(result.riskLevel).toBe("high");
    });
  });
});
