/**
 * The marketplace rules the server runs. Built by `npm run build:server` into
 * supabase/functions/_shared/platform-core.js, so the Edge Function enforces
 * exactly the same authorization, field whitelists, moderation and state
 * changes as the app, from one source.
 */
export { authorize, isPlatformState } from '../platform/authorize';
export { platformReducer } from '../platform/platformReducer';
export type { PlatformAction } from '../platform/platformReducer';
export { projectFor } from '../platform/project';
export { createPlatformSeed } from '../data/platformSeed';
export type { PlatformState, Session } from '../types';
