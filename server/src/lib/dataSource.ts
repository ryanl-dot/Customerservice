import type { CustomerCase, TruckRoll } from '../../../src/data/sampleData';
import type { TruckRollRecord } from '../../../src/data/truckRollData';
import type { AllKPIs } from '../../../src/utils/kpiCalculations';
import { cases as mockCases, truckRolls as mockLegacyTR } from '../../../src/data/sampleData';
import { canonicalTruckRolls } from '../../../src/data/truckRoll/source';
import { computeAllKPIs } from '../../../src/utils/kpiCalculations';
import { getDataMode, productionConnectorConfigured } from './dataMode';

// The server is the single place that decides which dataset is returned. Mock and
// test modes use the in-repo mock data; production mode returns real data ONLY when a
// connector is configured, otherwise empty (no silent fallback to mock). Demo
// identifiers therefore never appear in production metrics.

export interface SourceResult<T> { empty: boolean; data: T[] }

function emptyInProductionWithoutConnector(): boolean {
  return getDataMode() === 'production' && !productionConnectorConfigured();
}

export function getCases(): SourceResult<CustomerCase> {
  if (emptyInProductionWithoutConnector()) return { empty: true, data: [] };
  if (getDataMode() === 'production') return { empty: false, data: [] }; // real connector would populate here
  return { empty: false, data: mockCases };
}

export function getTruckRolls(): SourceResult<TruckRollRecord> {
  if (emptyInProductionWithoutConnector()) return { empty: true, data: [] };
  if (getDataMode() === 'production') return { empty: false, data: [] };
  return { empty: false, data: canonicalTruckRolls };
}

function getCaseLinkedTruckRolls(): TruckRoll[] {
  if (getDataMode() === 'production') return [];
  return mockLegacyTR;
}

export function getKpis(): { empty: boolean; data: AllKPIs | null } {
  if (emptyInProductionWithoutConnector()) return { empty: true, data: null };
  const cases = getCases().data;
  const trRecords = getTruckRolls().data;
  return { empty: false, data: computeAllKPIs(cases, getCaseLinkedTruckRolls(), trRecords) };
}
