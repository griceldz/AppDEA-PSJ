import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        name: "Mapa de DEAs - Mi Pueblo",
        short_name: "DEAs",
        description: "Localizador de Desfibriladores para emergencias",
        theme_color: "#ffffff",
        display: "standalone",
        icons: [],
      },

      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "mapa-tiles-cache",
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 * 30,
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          },
        ],
      },
    }),
  ],
});
