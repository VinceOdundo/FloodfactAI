import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FloodFact AI — Ambassador",
    short_name: "FloodFact",
    description: "Flood early warning and rumour verification for Nairobi's informal settlements.",
    start_url: "/ambassador",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0c5a5e",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
