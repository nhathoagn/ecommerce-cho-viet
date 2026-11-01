// Vercel Function entry for every /api/* request. The Nest app is compiled into
// apps/api/dist by the build step; this file only exposes its handler.
export { default } from '../apps/api/dist/serverless.js';
