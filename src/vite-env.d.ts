/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_NEO_ID_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
