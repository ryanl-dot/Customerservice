import type { DataMode } from '../../../shared/api/types';
import { dataMode as resolveDataMode, isProduction as resolveIsProduction } from './config';

// Data mode is chosen by SERVER-SIDE configuration only (see config.ts). A normal
// user can never flip production → mock. Production is enforced at startup by
// validateEnv (DATA_MODE=production required), so there is no silent fallback.

export function getDataMode(): DataMode {
  return resolveDataMode();
}

export function isProduction(): boolean {
  return resolveIsProduction();
}

// In production, real data only flows once an upstream connector (HubSpot/Enphase or
// a database) is configured. Until then we return NOTHING rather than silently
// falling back to mock data — the UI shows a proper empty state instead.
export function productionConnectorConfigured(): boolean {
  return Boolean(process.env.HUBSPOT_PRIVATE_APP_TOKEN || process.env.DATABASE_URL);
}
