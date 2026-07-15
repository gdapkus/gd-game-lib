// vite.config.mjs
import Components from "file:///C:/Users/greg/OneDrive/Documents/nodesites/MyGameLibrary/node_modules/unplugin-vue-components/dist/vite.js";
import Vue from "file:///C:/Users/greg/OneDrive/Documents/nodesites/MyGameLibrary/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import Vuetify, { transformAssetUrls } from "file:///C:/Users/greg/OneDrive/Documents/nodesites/MyGameLibrary/node_modules/vite-plugin-vuetify/dist/index.mjs";
import ViteFonts from "file:///C:/Users/greg/OneDrive/Documents/nodesites/MyGameLibrary/node_modules/unplugin-fonts/dist/vite.mjs";
import VueRouter from "file:///C:/Users/greg/OneDrive/Documents/nodesites/MyGameLibrary/node_modules/unplugin-vue-router/dist/vite.js";
import { defineConfig } from "file:///C:/Users/greg/OneDrive/Documents/nodesites/MyGameLibrary/node_modules/vite/dist/node/index.js";
import { fileURLToPath, URL } from "node:url";
var __vite_injected_original_import_meta_url = "file:///C:/Users/greg/OneDrive/Documents/nodesites/MyGameLibrary/vite.config.mjs";
var vite_config_default = defineConfig({
  plugins: [
    VueRouter(),
    Vue({
      template: { transformAssetUrls }
    }),
    // Vuetify plugin with auto import and custom styles
    Vuetify({
      autoImport: true,
      styles: {
        configFile: "src/styles/settings.scss"
      }
    }),
    // Component auto importing
    Components(),
    // Custom fonts from Google Fonts
    ViteFonts({
      google: {
        families: [
          {
            name: "Roboto",
            styles: "wght@100;300;400;500;700;900"
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: [
      "vuetify/lib/components/VCard/index.mjs",
      "vuetify/lib/components/VKbd/index.mjs",
      "vuetify/lib/components/VOverlay/index.mjs",
      "vuetify/lib/components/VResponsive/index.mjs"
    ]
    // Exclude specific Vuetify components from optimization
  },
  define: {
    "process.env": {}
    // Pass environment variables
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
      // Alias for cleaner imports
    },
    extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"]
    // File extensions for resolution
  },
  server: {
    port: 3e3,
    // Vite development server port
    proxy: {
      // Proxy API calls to the Express server running on port 5000
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "")
        // Remove /api prefix before forwarding
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubWpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcZ3JlZ1xcXFxPbmVEcml2ZVxcXFxEb2N1bWVudHNcXFxcbm9kZXNpdGVzXFxcXE15R2FtZUxpYnJhcnlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGdyZWdcXFxcT25lRHJpdmVcXFxcRG9jdW1lbnRzXFxcXG5vZGVzaXRlc1xcXFxNeUdhbWVMaWJyYXJ5XFxcXHZpdGUuY29uZmlnLm1qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvZ3JlZy9PbmVEcml2ZS9Eb2N1bWVudHMvbm9kZXNpdGVzL015R2FtZUxpYnJhcnkvdml0ZS5jb25maWcubWpzXCI7Ly8gUGx1Z2luc1xuaW1wb3J0IENvbXBvbmVudHMgZnJvbSAndW5wbHVnaW4tdnVlLWNvbXBvbmVudHMvdml0ZSc7XG5pbXBvcnQgVnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSc7XG5pbXBvcnQgVnVldGlmeSwgeyB0cmFuc2Zvcm1Bc3NldFVybHMgfSBmcm9tICd2aXRlLXBsdWdpbi12dWV0aWZ5JztcbmltcG9ydCBWaXRlRm9udHMgZnJvbSAndW5wbHVnaW4tZm9udHMvdml0ZSc7XG5pbXBvcnQgVnVlUm91dGVyIGZyb20gJ3VucGx1Z2luLXZ1ZS1yb3V0ZXIvdml0ZSc7XG5cbi8vIFV0aWxpdGllc1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoLCBVUkwgfSBmcm9tICdub2RlOnVybCc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgVnVlUm91dGVyKCksXG4gICAgVnVlKHtcbiAgICAgIHRlbXBsYXRlOiB7IHRyYW5zZm9ybUFzc2V0VXJscyB9LFxuICAgIH0pLFxuICAgIC8vIFZ1ZXRpZnkgcGx1Z2luIHdpdGggYXV0byBpbXBvcnQgYW5kIGN1c3RvbSBzdHlsZXNcbiAgICBWdWV0aWZ5KHtcbiAgICAgIGF1dG9JbXBvcnQ6IHRydWUsXG4gICAgICBzdHlsZXM6IHtcbiAgICAgICAgY29uZmlnRmlsZTogJ3NyYy9zdHlsZXMvc2V0dGluZ3Muc2NzcycsXG4gICAgICB9LFxuICAgIH0pLFxuICAgIC8vIENvbXBvbmVudCBhdXRvIGltcG9ydGluZ1xuICAgIENvbXBvbmVudHMoKSxcbiAgICAvLyBDdXN0b20gZm9udHMgZnJvbSBHb29nbGUgRm9udHNcbiAgICBWaXRlRm9udHMoe1xuICAgICAgZ29vZ2xlOiB7XG4gICAgICAgIGZhbWlsaWVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ1JvYm90bycsXG4gICAgICAgICAgICBzdHlsZXM6ICd3Z2h0QDEwMDszMDA7NDAwOzUwMDs3MDA7OTAwJyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICB9KSxcbiAgXSxcbiAgICBvcHRpbWl6ZURlcHM6IHtcbiAgICBleGNsdWRlOiBbXG4gICAgICAndnVldGlmeS9saWIvY29tcG9uZW50cy9WQ2FyZC9pbmRleC5tanMnLFxuICAgICAgJ3Z1ZXRpZnkvbGliL2NvbXBvbmVudHMvVktiZC9pbmRleC5tanMnLFxuICAgICAgJ3Z1ZXRpZnkvbGliL2NvbXBvbmVudHMvVk92ZXJsYXkvaW5kZXgubWpzJyxcbiAgICAgICd2dWV0aWZ5L2xpYi9jb21wb25lbnRzL1ZSZXNwb25zaXZlL2luZGV4Lm1qcydcbiAgICBdLCAvLyBFeGNsdWRlIHNwZWNpZmljIFZ1ZXRpZnkgY29tcG9uZW50cyBmcm9tIG9wdGltaXphdGlvblxuICB9LFxuICBkZWZpbmU6IHtcbiAgICAncHJvY2Vzcy5lbnYnOiB7fSwgLy8gUGFzcyBlbnZpcm9ubWVudCB2YXJpYWJsZXNcbiAgfSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKSwgLy8gQWxpYXMgZm9yIGNsZWFuZXIgaW1wb3J0c1xuICAgIH0sXG4gICAgZXh0ZW5zaW9uczogWycuanMnLCAnLmpzb24nLCAnLmpzeCcsICcubWpzJywgJy50cycsICcudHN4JywgJy52dWUnXSwgLy8gRmlsZSBleHRlbnNpb25zIGZvciByZXNvbHV0aW9uXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsIC8vIFZpdGUgZGV2ZWxvcG1lbnQgc2VydmVyIHBvcnRcbiAgICBwcm94eToge1xuICAgICAgLy8gUHJveHkgQVBJIGNhbGxzIHRvIHRoZSBFeHByZXNzIHNlcnZlciBydW5uaW5nIG9uIHBvcnQgNTAwMFxuICAgICAgJy9hcGknOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMScsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaS8sICcnKSwgLy8gUmVtb3ZlIC9hcGkgcHJlZml4IGJlZm9yZSBmb3J3YXJkaW5nXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxPQUFPLGdCQUFnQjtBQUN2QixPQUFPLFNBQVM7QUFDaEIsT0FBTyxXQUFXLDBCQUEwQjtBQUM1QyxPQUFPLGVBQWU7QUFDdEIsT0FBTyxlQUFlO0FBR3RCLFNBQVMsb0JBQW9CO0FBQzdCLFNBQVMsZUFBZSxXQUFXO0FBVG1NLElBQU0sMkNBQTJDO0FBWXZSLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLFVBQVU7QUFBQSxJQUNWLElBQUk7QUFBQSxNQUNGLFVBQVUsRUFBRSxtQkFBbUI7QUFBQSxJQUNqQyxDQUFDO0FBQUE7QUFBQSxJQUVELFFBQVE7QUFBQSxNQUNOLFlBQVk7QUFBQSxNQUNaLFFBQVE7QUFBQSxRQUNOLFlBQVk7QUFBQSxNQUNkO0FBQUEsSUFDRixDQUFDO0FBQUE7QUFBQSxJQUVELFdBQVc7QUFBQTtBQUFBLElBRVgsVUFBVTtBQUFBLE1BQ1IsUUFBUTtBQUFBLFFBQ04sVUFBVTtBQUFBLFVBQ1I7QUFBQSxZQUNFLE1BQU07QUFBQSxZQUNOLFFBQVE7QUFBQSxVQUNWO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDRSxjQUFjO0FBQUEsSUFDZCxTQUFTO0FBQUEsTUFDUDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQTtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLGVBQWUsQ0FBQztBQUFBO0FBQUEsRUFDbEI7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssY0FBYyxJQUFJLElBQUksU0FBUyx3Q0FBZSxDQUFDO0FBQUE7QUFBQSxJQUN0RDtBQUFBLElBQ0EsWUFBWSxDQUFDLE9BQU8sU0FBUyxRQUFRLFFBQVEsT0FBTyxRQUFRLE1BQU07QUFBQTtBQUFBLEVBQ3BFO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUE7QUFBQSxJQUNOLE9BQU87QUFBQTtBQUFBLE1BRUwsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsU0FBUyxDQUFDLFNBQVMsS0FBSyxRQUFRLFVBQVUsRUFBRTtBQUFBO0FBQUEsTUFDOUM7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
