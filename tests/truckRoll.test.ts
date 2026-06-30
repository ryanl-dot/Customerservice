import { describe, it, expect } from 'vitest';
import type { TruckRollRecord, TRStatus } from '../src/data/truckRollData';
import {
  computeTruckRollKPIs, TR_VIEWS, AGING_VIEWS, trInAgingBucket,
  issueCategoryToSlug, trIsOpen, getTRCompletionRate, getTRRevisitRate,
  getGNRRemoteRate,
} from '../src/data/truckRollData';
import { truckRollRecords } from '../src/data/truckRollData';
import { canonicalTruckRolls, legacyToCanonical } from '../src/data/truckRoll/source';

let n = 0;
function mkTR(over: Partial<TruckRollRecord> = {}): TruckRollRecord {
  n += 1;
  return {
    id: `TR-${9000 + n}`, ticketName: 'tr',
    customerName: 'Cust', customerPhone: '', customerAddress: '',
    hubspotContactId: '', hubspotContactLink: '', hubspotDealId: '', hubspotDealLink: '',
    hubspotTicketId: '', hubspotTicketLink: '',
    paymentType: '', customerType: 'Residential', leaseDeal: false, ptoDate: '',
    monitoringPlatform: 'Enphase', systemId: '', systemName: '', enphaseSiteLink: '',
    currentMonitoringStatus: 'Unknown', gatewayStatus: '', lastEnphaseReportDate: '',
    repeatIssueCount: 0, previousTruckRollCount: 0,
    issueCategory: 'Production Issue', truckRollReason: '',
    ticketCreatedDate: '2026-06-10', status: 'Scheduled',
    assignedTechnician: '', truckRollOwner: '',
    siteAccessType: 'Open Access', accessInstructions: '',
    ladderRequired: false, specialEquipmentRequired: '',
    scheduledVisitDate: '', firstVisitDate: '', mostRecentVisitDate: '',
    completionDate: '', lastCustomerContactDate: '', nextFollowUpDate: '',
    partsRequired: false, pendingDeliveryOfItems: false, estimatedDeliveryDate: '',
    revisitRequired: false, revisitReason: '', revisitScheduledDate: '',
    numberOfVisits: 0, technicianNotes: '', nextSteps: '',
    enphaseCases: [], rmas: [], visits: [], activityHistory: [],
    ...over,
  };
}

describe('Canonical truck-roll KPIs (mock dataset)', () => {
  const tr = computeTruckRollKPIs(canonicalTruckRolls);

  it('totals match the dataset length', () => {
    expect(tr.total).toBe(truckRollRecords.length);
  });

  it('open / aging buckets / issue types all sum to open', () => {
    const agingSum = (['0-7','8-14','15-21','22-30','30-plus'] as const)
      .reduce((s, k) => s + canonicalTruckRolls.filter(t => trInAgingBucket(t, k)).length, 0);
    expect(agingSum).toBe(tr.open);

    const byCat: Record<string, number> = {};
    canonicalTruckRolls.filter(trIsOpen).forEach(t => { byCat[t.issueCategory] = (byCat[t.issueCategory] ?? 0) + 1; });
    expect(Object.values(byCat).reduce((a, b) => a + b, 0)).toBe(tr.open);
  });

  it('each KPI card count equals its drill-down predicate count (no divergence)', () => {
    expect(canonicalTruckRolls.filter(TR_VIEWS['open'].predicate).length).toBe(tr.open);
    expect(canonicalTruckRolls.filter(TR_VIEWS['needs-scheduling'].predicate).length).toBe(tr.needsScheduling);
    expect(canonicalTruckRolls.filter(TR_VIEWS['scheduled'].predicate).length).toBe(tr.scheduled);
    expect(canonicalTruckRolls.filter(TR_VIEWS['awaiting-parts'].predicate).length).toBe(tr.awaitingParts);
    expect(canonicalTruckRolls.filter(TR_VIEWS['active-rma'].predicate).length).toBe(tr.activeRMA);
    expect(canonicalTruckRolls.filter(TR_VIEWS['overdue'].predicate).length).toBe(tr.overdue);
    expect(canonicalTruckRolls.filter(TR_VIEWS['critical'].predicate).length).toBe(tr.critical);
    expect(canonicalTruckRolls.filter(TR_VIEWS['completed-this-month'].predicate).length).toBe(tr.completedThisMonth);
  });
});

describe('Truck-roll KPIs — controlled fixtures', () => {
  it('open excludes Completed / Cancelled / Unable to Complete', () => {
    const recs = [
      mkTR({ status: 'Scheduled' }),
      mkTR({ status: 'Completed', completionDate: '2026-06-12' }),
      mkTR({ status: 'Cancelled' }),
      mkTR({ status: 'Unable to Complete' }),
    ];
    expect(recs.filter(TR_VIEWS['open'].predicate)).toHaveLength(1);
  });

  it('completion rate, revisit rate handle zero denominator', () => {
    expect(getTRCompletionRate([])).toBe(0);
    expect(getTRRevisitRate([])).toBe(0);
    expect(getGNRRemoteRate([])).toBe(0);
  });

  it('completion rate = completed / total', () => {
    const recs = [
      mkTR({ status: 'Completed', completionDate: '2026-06-12' }),
      mkTR({ status: 'Scheduled' }),
      mkTR({ status: 'Scheduled' }),
      mkTR({ status: 'Scheduled' }),
    ];
    expect(getTRCompletionRate(recs)).toBe(25);
  });

  it('a completed record carrying an open-looking flag is still not "open"', () => {
    // revisitRequired flag set but status Completed → must NOT count as open
    const rec = mkTR({ status: 'Completed', completionDate: '2026-06-12', revisitRequired: true });
    expect(TR_VIEWS['open'].predicate(rec)).toBe(false);
    expect(rec.revisitRequired).toBe(true);
  });

  it('handles multiple RMAs on one record for active-RMA detection', () => {
    const rec = mkTR({
      status: 'Awaiting Parts',
      rmas: [
        { id: 'a', rmaNumber: 'R1', enphaseCaseNumber: '', rmaRequired: 'Yes', rmaSubmittedDate: '', rmaStatus: 'RMA Closed', trackingNumber: '', replacementEquipmentReceivedDate: '', replacementEquipmentInstalledDate: '', laborReimbursementStatus: 'Not Eligible', laborSubmittedDate: '', projectedReimbursementAmount: 0, totalReimbursementReceived: 0, reimbursementDateReceived: '', returnedDefectiveRMA: 'Not Required', defectiveRMAReturnDate: '', defectiveRMAReturnTracking: '', rmaNote: '' },
        { id: 'b', rmaNumber: 'R2', enphaseCaseNumber: '', rmaRequired: 'Yes', rmaSubmittedDate: '', rmaStatus: 'RMA Submitted', trackingNumber: '', replacementEquipmentReceivedDate: '', replacementEquipmentInstalledDate: '', laborReimbursementStatus: 'Not Submitted', laborSubmittedDate: '', projectedReimbursementAmount: 100, totalReimbursementReceived: 0, reimbursementDateReceived: '', returnedDefectiveRMA: 'Not Required', defectiveRMAReturnDate: '', defectiveRMAReturnTracking: '', rmaNote: '' },
      ],
    });
    expect(TR_VIEWS['active-rma'].predicate(rec)).toBe(true); // one closed, one active → active
  });

  it('missing dates do not throw in aging computation', () => {
    const rec = mkTR({ ticketCreatedDate: '', status: 'Scheduled' });
    expect(() => AGING_VIEWS['0-7'].match(0)).not.toThrow();
    expect(() => computeTruckRollKPIs([rec])).not.toThrow();
  });

  it('empty dataset yields all-zero KPIs', () => {
    const tr = computeTruckRollKPIs([]);
    expect(tr.total).toBe(0);
    expect(tr.open).toBe(0);
    expect(tr.completionRate).toBe(0);
  });
});

describe('Legacy → canonical adapter (data-source unification)', () => {
  it('maps a legacy truck roll into the canonical shape with status translation', () => {
    const rec = legacyToCanonical({
      id: 'TR-001', caseId: 'C-1', customerName: 'X', issueType: 'GNR',
      technician: 'Tech', visitDate: '2026-06-10', status: 'Revisit Required',
      outcome: '', revisitRequired: true, rmaRequired: false, rmaCaseNumber: '',
      troubleshootIssue: 'thing', couldBeDoneRemotely: null, isRevisitNeeded: null,
      couldHaveBeenAvoided: null, avoidedDetails: '', nextSteps: 'next', customerUpdated: false,
    });
    expect(rec.status).toBe<TRStatus>('Return Visit Required');
    expect(rec.legacyCaseId).toBe('C-1');
    expect(rec.revisitRequired).toBe(true);
  });
});

describe('issue-category slug round-trips for URL drill-down', () => {
  it('slug is URL-safe and stable', () => {
    expect(issueCategoryToSlug('Gateway Not Reporting')).toBe('gateway-not-reporting');
    expect(issueCategoryToSlug('Failed Microinverter')).toBe('failed-microinverter');
  });
});
