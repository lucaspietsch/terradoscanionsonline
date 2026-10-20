import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cambará Ornamentais",
    short_name: "Cambará",
    description: "Vasos de cimento feitos à mão.",
    start_url: "/",
    display: "standalone",
    background_color: "#ECEAE5",
    theme_color: "#2F3E2C",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}
