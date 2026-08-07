import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        name: "Chit chat",
        short_name: "Chit chat",
        description: "A modern real-time chatting application",
        theme_color: "#000000",
        background_color: "#000000",
        display: "standalone",
        start_url: "/",
        scope: "/",

        icons: [
  {
    src: "/chit-chat-logo-192x192.png",
    sizes: "512x512",
    type: "image/png",
  },
  {
    src: "/chit-chat-logo-1024x1024.png",
    sizes: "1024x1024",
    type: "image/png",
  },
  {
    src: "/chit-chat-logo-1024x1024.png",
    sizes: "1024x1024",
    type: "image/png",
    purpose: "any maskable",
  },
]
      },
    }),
  ],
});
