/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

declare const __PWA_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_CONVEX_SITE_URL: string;
  readonly VITE_CONVEX_URL: string;
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
