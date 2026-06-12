/// <reference types="vite/client" />

declare const __PWA_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_CONVEX_SITE_URL: string;
  readonly VITE_CONVEX_URL: string;
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
