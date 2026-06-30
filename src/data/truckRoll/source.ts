// Canonical truck-roll source — the ONE dataset every page derives truck-roll
// numbers from. The Truck Roll Center, the main Dashboard, the KPI Center, and the
// Executive Dashboard all consume `canonicalTruckRolls`, so their open/scheduled/
// overdue/completion/etc. figures reconcile by construction.
//
// The legacy `sampleData.truckRolls` shape (case-linked, used only for case risk
// scoring) differs from the rich operational `TruckRollRecord`. `legacyToCanonical`
// is the adapter that normalizes the legacy structure into the canonical one so the
// two can be merged once real HubSpot data replaces both mocks.

import type { TruckRoll } from '../sampleData';
import type { TruckRollRecord, TRStatus } from '../truckRollData';
import { truckRollRecords } from '../truckRollData';

const LEGACY_STATUS_MAP: Record<TruckRoll['status'], TRStatus> = {
  'Scheduled': 'Scheduled',
  'In Progress': 'Troubleshooting in Progress',
  'Completed': 'Completed',
  'Pending Approval': 'Pending Approval',
  'Revisit Required': 'Return Visit Required',
  'Closed': 'Completed',
};

/** Normalize a legacy case-linked TruckRoll into the canonical operational shape. */
export function legacyToCanonical(t: TruckRoll): TruckRollRecord {
  return {
    id: t.id,
    ticketName: `${t.id} — ${t.issueType}`,
    customerName: t.customerName,
    customerPhone: '',
    customerAddress: '',
    hubspotContactId: '', hubspotContactLink: '',
    hubspotDealId: '', hubspotDealLink: '',
    hubspotTicketId: '', hubspotTicketLink: '',
    paymentType: '', customerType: 'Residential', leaseDeal: false, ptoDate: '',
    monitoringPlatform: 'Enphase',
    systemId: '', systemName: '', enphaseSiteLink: '',
    currentMonitoringStatus: 'Unknown', gatewayStatus: '', lastEnphaseReportDate: '',
    repeatIssueCount: 0, previousTruckRollCount: 0,
    issueCategory: 'Other',
    truckRollReason: t.troubleshootIssue || t.issueType,
    ticketCreatedDate: t.visitDate,
    status: LEGACY_STATUS_MAP[t.status],
    assignedTechnician: t.technician,
    truckRollOwner: '',
    siteAccessType: 'Open Access', accessInstructions: '',
    ladderRequired: false, specialEquipmentRequired: '',
    scheduledVisitDate: t.status === 'Scheduled' ? t.visitDate : '',
    firstVisitDate: '', mostRecentVisitDate: t.visitDate,
    completionDate: t.status === 'Completed' ? t.visitDate : '',
    lastCustomerContactDate: '', nextFollowUpDate: '',
    partsRequired: t.rmaRequired, pendingDeliveryOfItems: false, estimatedDeliveryDate: '',
    revisitRequired: t.revisitRequired, revisitReason: '', revisitScheduledDate: '',
    numberOfVisits: t.status === 'Completed' ? 1 : 0,
    technicianNotes: t.nextSteps, nextSteps: t.nextSteps,
    enphaseCases: [], rmas: [], visits: [], activityHistory: [],
    legacyCaseId: t.caseId,
  };
}

/** The canonical operational truck-roll dataset (mock mode). */
export const canonicalTruckRolls: TruckRollRecord[] = truckRollRecords;
