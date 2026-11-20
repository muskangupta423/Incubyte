/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the API when it is not served from the same origin (e.g. on Vercel). Optional. */
  readonly VITE_API_BASE_URL?: string;
}
