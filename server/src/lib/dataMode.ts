import type { DataMode } from '../../../shared/api/types';

// Data mode is chosen by SERVER-SIDE configuration only. A normal user can never
// flip production → mock. Unknown/unset values fall back to the safest mode (mock)
// for local dev, but a deployment MUST set DATA_MODE=production explicitly.

export function getDataMode(): DataMode {
  const raw = (process.env.DATA_MODE ?? 'mock').toLowerCase();
  if (raw === 'production') return 'production';
  if (raw === 'test') return 'test';
  return 'mock';
}

export function isProduction(): boolean {
  return getDataMode() === 'production';
}

// In production, real data only flows once an upstream connector (HubSpot/Enphase or
// a database) is configured. Until then we return NOTHING rather than silently
// falling back to mock data — the UI shows a proper empty state instead.
export function productionConnectorConfigured(): boolean {
  return Boolean(process.env.HUBSPOT_PRIVATE_APP_TOKEN || process.env.DATABASE_URL);
}
