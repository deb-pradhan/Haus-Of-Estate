import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Haus of Estate",
    short_name: "Haus of Estate",
    description:
      "We introduce overseas buyers and investors to local estate agents in Dubai, the UK, Bali and Cyprus.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#1F4F2F",
    background_color: "#ECE8E0",
    lang: "en-GB",
    categories: ["business", "finance", "lifestyle"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
