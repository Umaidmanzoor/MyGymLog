import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icons/*.png"],
      manifest: {
        name: "Coral Gym",
        short_name: "Coral Gym",
        description: "Your training. Your progress. On your device.",
        theme_color: "#E36952",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "./",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        clientsClaim: true,
        globPatterns: [
          "**/*.{js,css,html,png,jpg,svg,woff2}",
          "demos/**/*.mp4",
          "licenses/*.txt",
        ],
        runtimeCaching: [
          {
            urlPattern: /\/videos\//,
            handler: "CacheFirst",
            options: {
              cacheName: "exercise-videos",
              rangeRequests: true,
              expiration: { maxEntries: 250 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
});
