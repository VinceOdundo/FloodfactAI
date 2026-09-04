import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FloodFact AI — Ambassador",
    short_name: "FloodFact",
    description: "Flood early warning and rumour verification for Nairobi's informal settlements.",
    start_url: "/ambassador",
    display: "standalone",
    background_color: "#faf7f1",
    theme_color: "#0c5a5e",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
