/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AWS_REGION?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_COGNITO_USER_POOL_ID?: string;
  readonly VITE_COGNITO_CLIENT_ID?: string;
  readonly VITE_S3_UPLOAD_BUCKET?: string;
  readonly VITE_USE_SIMULATED_AI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
