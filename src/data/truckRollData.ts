// ── Truck Roll Operational Data Model ─────────────────────────────────────────
// This is the comprehensive TR dataset used by the Truck Roll Center.
// Isolated from live APIs — adapters will normalize real data into these types.

export type TRStatus =
  | 'New'
  | 'Needs Review'
  | 'Customer Contact Required'
  | 'Awaiting Customer Scheduling'
  | 'Scheduled'
  | 'Awaiting Technician'
  | 'Technician En Route'
  | 'Pending Approval'
  | 'Visit Completed'
  | 'Troubleshooting in Progress'
  | 'Awaiting Parts'
  | 'Awaiting RMA Approval'
  | 'RMA Submitted'
  | 'RMA Approved'
  | 'Replacement Shipped'
  | 'Replacement Received'
  | 'Return Visit Required'
  | 'Revisit Scheduled'
  | 'Awaiting Customer Confirmation'
  | 'Completed'
  | 'Cancelled'
  | 'Unable to Complete';

export type RMAStatus =
  | 'Not Required'
  | 'Under Review'
  | 'Case Opened'
  | 'Awaiting Enphase Response'
  | 'RMA Submitted'
  | 'RMA Approved'
  | 'RMA Denied'
  | 'Replacement Processing'
  | 'Replacement Shipped'
  | 'Replacement Delivered'
  | 'Replacement Installed'
  | 'Defective Equipment Return Pending'
  | 'Defective Equipment Returned'
  | 'Labor Reimbursement Submitted'
  | 'Labor Reimbursement Pending'
  | 'Labor Reimbursement Partially Received'
  | 'Labor Reimbursement Received'
  | 'RMA Closed';

export type RMARequired = 'No' | 'Under Review' | 'Yes' | 'Not Applicable';

export type LaborReimbursementStatus =
  | 'Not Eligible'
  | 'Not Submitted'
  | 'Submitted'
  | 'Partially Received'
  | 'Fully Received'
  | 'Denied';

export type DefectiveReturnStatus = 'Not Required' | 'Pending' | 'Yes' | 'No' | 'Overdue';

export type IssueCategory =
  | 'Gateway Not Reporting'
  | 'Failed Microinverter'
  | 'Production Issue'
  | 'Roof Leak'
  | 'Electrical Issue'
  | 'Utility Meter Issue'
  | 'Complaint — Property Damage'
  | 'Other';

export type SiteAccessType =
  | 'Gate Code Required'
  | 'Key Required'
  | 'Customer Must Be Present'
  | 'Open Access'
  | 'HOA Approval Required';

export type MonitoringPlatform = 'Enphase' | 'SolarEdge' | 'SMA' | 'Other';

export interface TechnicianVisit {
  id: string;
  visitDate: string;
  technicianName: string;
  outcomeNotes: string;
  issueIdentified: string;
  resolvedRemotely: boolean | null;
  revisitRequired: boolean | null;
  revisitReason: string;
  partsUsed: string[];
  technicalNotes: string;
  customerUpdated: boolean;
  closeoutComplete: boolean;
  closeoutMissingFields: string[];
}

export interface EnphaseCase {
  id: string;
  enphaseCaseNumber: string;
  caseStatus: string;
  openedDate: string;
  lastUpdatedDate: string;
  caseNotes: string;
}

export interface EnphaseRMA {
  id: string;
  rmaNumber: string;
  enphaseCaseNumber: string;
  rmaRequired: RMARequired;
  rmaSubmittedDate: string;
  rmaStatus: RMAStatus;
  trackingNumber: string;
  replacementEquipmentReceivedDate: string;
  replacementEquipmentInstalledDate: string;
  laborReimbursementStatus: LaborReimbursementStatus;
  laborSubmittedDate: string;
  projectedReimbursementAmount: number;
  totalReimbursementReceived: number;
  reimbursementDateReceived: string;
  returnedDefectiveRMA: DefectiveReturnStatus;
  defectiveRMAReturnDate: string;
  defectiveRMAReturnTracking: string;
  rmaNote: string;
}

export interface ActivityEvent {
  id: string;
  date: string;
  author: string;
  event: string;
  note: string;
}

export interface TruckRollRecord {
  id: string;
  ticketName: string;

  // Customer & HubSpot
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  hubspotContactId: string;
  hubspotContactLink: string;
  hubspotDealId: string;
  hubspotDealLink: string;
  hubspotTicketId: string;
  hubspotTicketLink: string;
  paymentType: string;
  customerType: 'Residential' | 'Commercial';
  leaseDeal: boolean;
  ptoDate: string;

  // Solar System
  monitoringPlatform: MonitoringPlatform;
  systemId: string;
  systemName: string;
  enphaseSiteLink: string;
  currentMonitoringStatus: 'Reporting' | 'Not Reporting' | 'Partial' | 'Unknown';
  gatewayStatus: string;
  lastEnphaseReportDate: string;
  repeatIssueCount: number;
  previousTruckRollCount: number;

  // TR Core
  issueCategory: IssueCategory;
  truckRollReason: string;
  ticketCreatedDate: string;
  status: TRStatus;
  assignedTechnician: string;
  truckRollOwner: string;
  siteAccessType: SiteAccessType;
  accessInstructions: string;
  ladderRequired: boolean;
  specialEquipmentRequired: string;
  scheduledVisitDate: string;
  firstVisitDate: string;
  mostRecentVisitDate: string;
  completionDate: string;
  lastCustomerContactDate: string;
  nextFollowUpDate: string;
  partsRequired: boolean;
  pendingDeliveryOfItems: boolean;
  estimatedDeliveryDate: string;
  revisitRequired: boolean;
  revisitReason: string;
  revisitScheduledDate: string;
  numberOfVisits: number;
  technicianNotes: string;
  nextSteps: string;

  // Enphase Cases, RMAs, History
  enphaseCases: EnphaseCase[];
  rmas: EnphaseRMA[];
  visits: TechnicianVisit[];
  activityHistory: ActivityEvent[];

  // Legacy linkage
  legacyCaseId?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export const TODAY_TR = '2026-06-15';

export function trDaysOpen(t: TruckRollRecord): number {
  const end = t.completionDate && t.status === 'Completed' ? t.completionDate : TODAY_TR;
  return Math.max(0, Math.floor(
    (new Date(end).getTime() - new Date(t.ticketCreatedDate).getTime()) / 86_400_000
  ));
}

export function trIsOverdue(t: TruckRollRecord): boolean {
  if (t.status === 'Completed' || t.status === 'Cancelled') return false;
  const days = trDaysOpen(t);
  const limit = t.issueCategory === 'Gateway Not Reporting' ? 14 : 21;
  return days > limit;
}

export function trIsCritical(t: TruckRollRecord): boolean {
  return !['Completed','Cancelled','Unable to Complete'].includes(t.status) && trDaysOpen(t) > 30;
}

export function trAgingBucket(t: TruckRollRecord): string {
  const d = trDaysOpen(t);
  if (d <= 7)  return '0–7 Days';
  if (d <= 14) return '8–14 Days';
  if (d <= 21) return '15–21 Days';
  if (d <= 30) return '22–30 Days';
  return '30+ Days';
}

export const OPEN_STATUSES: TRStatus[] = [
  'New','Needs Review','Customer Contact Required','Awaiting Customer Scheduling',
  'Scheduled','Awaiting Technician','Technician En Route','Pending Approval',
  'Visit Completed','Troubleshooting in Progress','Awaiting Parts',
  'Awaiting RMA Approval','RMA Submitted','RMA Approved','Replacement Shipped',
  'Replacement Received','Return Visit Required','Revisit Scheduled',
  'Awaiting Customer Confirmation',
];

export function trIsOpen(t: TruckRollRecord): boolean {
  return OPEN_STATUSES.includes(t.status);
}

export function trCompletedThisMonth(t: TruckRollRecord): boolean {
  return t.status === 'Completed' && t.completionDate.startsWith('2026-06');
}

// Outstanding reimbursement: projected − received, floor 0
export function outstandingReimbursement(rma: EnphaseRMA): number {
  return Math.max(0, rma.projectedReimbursementAmount - rma.totalReimbursementReceived);
}

// RMA statuses that mean the RMA no longer needs CS action.
const INACTIVE_RMA_STATUSES: RMAStatus[] = ['Not Required', 'RMA Closed', 'RMA Denied'];

export function hasActiveRMA(t: TruckRollRecord): boolean {
  return t.rmas.some(r => r.rmaRequired !== 'No' && !INACTIVE_RMA_STATUSES.includes(r.rmaStatus));
}

export function hasPendingDefectiveReturn(t: TruckRollRecord): boolean {
  return t.rmas.some(r => r.returnedDefectiveRMA === 'Pending' || r.returnedDefectiveRMA === 'Overdue');
}

export function closeoutMissingFields(v: TechnicianVisit): string[] {
  const missing: string[] = [];
  if (!v.issueIdentified) missing.push('Issue Identified');
  if (v.resolvedRemotely === null) missing.push('Resolved Remotely');
  if (v.revisitRequired === null) missing.push('Revisit Required');
  if (!v.technicalNotes) missing.push('Technician Notes');
  if (!v.outcomeNotes) missing.push('Outcome Summary');
  return missing;
}

// ── Shared Drill-Down Predicates ──────────────────────────────────────────────
// Single source of truth for KPI card counts AND "All Truck Rolls" drill-down.
// A card and its drill-down MUST share the same predicate so totals never diverge.

export function trNeedsScheduling(t: TruckRollRecord): boolean {
  if (!trIsOpen(t)) return false;
  if (t.status === 'Awaiting Customer Scheduling' ||
      t.status === 'New' ||
      t.status === 'Customer Contact Required' ||
      t.status === 'Awaiting Customer Confirmation') return true;
  // Revisit needed but no revisit date set yet
  if (t.status === 'Return Visit Required' && !t.revisitScheduledDate) return true;
  return false;
}

export function trScheduledView(t: TruckRollRecord): boolean {
  return trIsOpen(t) && (t.status === 'Scheduled' || t.status === 'Revisit Scheduled');
}

export function trAwaitingPartsView(t: TruckRollRecord): boolean {
  if (!trIsOpen(t)) return false;
  return (
    t.status === 'Awaiting Parts' ||
    t.pendingDeliveryOfItems ||
    t.status === 'RMA Approved' ||
    t.status === 'Replacement Shipped'
  );
}

export type TRViewKey =
  | 'open' | 'needs-scheduling' | 'scheduled' | 'awaiting-parts'
  | 'active-rma' | 'overdue' | 'critical' | 'completed-this-month';

export interface TRViewDef {
  label: string;
  predicate: (t: TruckRollRecord) => boolean;
}

export const TR_VIEWS: Record<TRViewKey, TRViewDef> = {
  'open':                 { label: 'Open Truck Rolls',     predicate: trIsOpen },
  'needs-scheduling':     { label: 'Needs Scheduling',     predicate: trNeedsScheduling },
  'scheduled':            { label: 'Scheduled',            predicate: trScheduledView },
  'awaiting-parts':       { label: 'Awaiting Parts',       predicate: trAwaitingPartsView },
  'active-rma':           { label: 'Active RMA',           predicate: hasActiveRMA },
  'overdue':              { label: 'Overdue',              predicate: trIsOverdue },
  'critical':             { label: 'Critical',             predicate: trIsCritical },
  'completed-this-month': { label: 'Completed This Month', predicate: trCompletedThisMonth },
};

export function isTRViewKey(v: string | null): v is TRViewKey {
  return v != null && Object.prototype.hasOwnProperty.call(TR_VIEWS, v);
}

// Aging buckets — keyed by URL-safe slug, share trAgingBucket's boundaries.
export type AgingKey = '0-7' | '8-14' | '15-21' | '22-30' | '30-plus';

export const AGING_VIEWS: Record<AgingKey, { label: string; match: (days: number) => boolean }> = {
  '0-7':     { label: '0–7 Days',        match: d => d <= 7 },
  '8-14':    { label: '8–14 Days',       match: d => d >= 8  && d <= 14 },
  '15-21':   { label: '15–21 Days',      match: d => d >= 15 && d <= 21 },
  '22-30':   { label: '22–30 Days',      match: d => d >= 22 && d <= 30 },
  '30-plus': { label: 'More Than 30 Days', match: d => d > 30 },
};

export const AGING_BUCKET_TO_KEY: Record<string, AgingKey> = {
  '0–7 Days': '0-7', '8–14 Days': '8-14', '15–21 Days': '15-21',
  '22–30 Days': '22-30', '30+ Days': '30-plus',
};

export function isAgingKey(v: string | null): v is AgingKey {
  return v != null && Object.prototype.hasOwnProperty.call(AGING_VIEWS, v);
}

// Open truck roll in a specific aging bucket (completed excluded — they aren't open).
export function trInAgingBucket(t: TruckRollRecord, key: AgingKey): boolean {
  return trIsOpen(t) && AGING_VIEWS[key].match(trDaysOpen(t));
}

// Slug ↔ issue category for URL params.
export function issueCategoryToSlug(c: string): string {
  return c.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Operational Truck-Roll KPIs (canonical) ─────────────────────────────────────
// These run on the canonical TruckRollRecord[] so every page (Dashboard, Truck Roll
// Center, KPI Center, Executive Dashboard) reports the SAME truck-roll numbers.

/** A GNR ticket resolved remotely = completed with no on-site visit, or a visit flagged resolvedRemotely. */
export function trGnrRemoteResolved(t: TruckRollRecord): boolean {
  if (t.issueCategory !== 'Gateway Not Reporting' || t.status !== 'Completed') return false;
  return t.numberOfVisits === 0 || t.visits.some(v => v.resolvedRemotely === true);
}

export function getTRCompletionRate(records: TruckRollRecord[]): number {
  if (!records.length) return 0;
  const completed = records.filter(t => t.status === 'Completed').length;
  return Math.round((completed / records.length) * 1000) / 10;
}

export function getTRRevisitRate(records: TruckRollRecord[]): number {
  if (!records.length) return 0;
  const flagged = records.filter(t => t.revisitRequired).length;
  return Math.round((flagged / records.length) * 1000) / 10;
}

export function getGNRRemoteRate(records: TruckRollRecord[]): number {
  const gnr = records.filter(t => t.issueCategory === 'Gateway Not Reporting');
  if (!gnr.length) return 0;
  return Math.round((gnr.filter(trGnrRemoteResolved).length / gnr.length) * 1000) / 10;
}

export interface TruckRollKPIs {
  total: number;
  open: number;
  needsScheduling: number;
  scheduled: number;
  awaitingParts: number;
  activeRMA: number;
  overdue: number;
  critical: number;
  completed: number;
  completedThisMonth: number;
  inRevisitStatus: number;
  revisitFlagged: number;
  completionRate: number;
  revisitRate: number;
  gnrRemoteRate: number;
}

export function computeTruckRollKPIs(records: TruckRollRecord[]): TruckRollKPIs {
  return {
    total:              records.length,
    open:               records.filter(TR_VIEWS['open'].predicate).length,
    needsScheduling:    records.filter(TR_VIEWS['needs-scheduling'].predicate).length,
    scheduled:          records.filter(TR_VIEWS['scheduled'].predicate).length,
    awaitingParts:      records.filter(TR_VIEWS['awaiting-parts'].predicate).length,
    activeRMA:          records.filter(TR_VIEWS['active-rma'].predicate).length,
    overdue:            records.filter(TR_VIEWS['overdue'].predicate).length,
    critical:           records.filter(TR_VIEWS['critical'].predicate).length,
    completed:          records.filter(t => t.status === 'Completed').length,
    completedThisMonth: records.filter(TR_VIEWS['completed-this-month'].predicate).length,
    inRevisitStatus:    records.filter(t => t.status === 'Return Visit Required').length,
    revisitFlagged:     records.filter(t => t.revisitRequired).length,
    completionRate:     getTRCompletionRate(records),
    revisitRate:        getTRRevisitRate(records),
    gnrRemoteRate:      getGNRRemoteRate(records),
  };
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

export const truckRollRecords: TruckRollRecord[] = [
  // 1 — GNR, Awaiting Customer Scheduling
  {
    id: 'TR-2001',
    ticketName: 'TR-GNR-001 — Gateway Not Reporting (Fontaine)',
    customerName: 'Theresa Fontaine',
    customerPhone: '(518) 555-0142',
    customerAddress: '44 Maple Ridge Dr, Clifton Park, NY 12065',
    hubspotContactId: 'HS-C-44201',
    hubspotContactLink: '#hs/contacts/44201',
    hubspotDealId: 'HS-D-89201',
    hubspotDealLink: '#hs/deals/89201',
    hubspotTicketId: 'HS-T-77301',
    hubspotTicketLink: '#hs/tickets/77301',
    paymentType: 'Loan', customerType: 'Residential', leaseDeal: false,
    ptoDate: '2024-08-15',
    monitoringPlatform: 'Enphase',
    systemId: 'EN-4420199',
    systemName: 'Fontaine — 9.6 kW System',
    enphaseSiteLink: '#enphase/systems/4420199',
    currentMonitoringStatus: 'Not Reporting',
    gatewayStatus: 'Offline — Last seen 2026-06-05',
    lastEnphaseReportDate: '2026-06-05',
    repeatIssueCount: 1,
    previousTruckRollCount: 0,
    issueCategory: 'Gateway Not Reporting',
    truckRollReason: 'IQ Gateway offline for 10 days. Remote reboot failed. Remote cellular reconnect attempted twice. Customer Wi-Fi changed — new credentials not updated in gateway.',
    ticketCreatedDate: '2026-06-05',
    status: 'Awaiting Customer Scheduling',
    assignedTechnician: 'Mike Torres',
    truckRollOwner: 'Sarah Mitchell',
    siteAccessType: 'Customer Must Be Present',
    accessInstructions: 'Customer works from home Mon–Fri. Available 9AM–3PM.',
    ladderRequired: false,
    specialEquipmentRequired: '',
    scheduledVisitDate: '',
    firstVisitDate: '',
    mostRecentVisitDate: '',
    completionDate: '',
    lastCustomerContactDate: '2026-06-10',
    nextFollowUpDate: '2026-06-16',
    partsRequired: false,
    pendingDeliveryOfItems: false,
    estimatedDeliveryDate: '',
    revisitRequired: false,
    revisitReason: '',
    revisitScheduledDate: '',
    numberOfVisits: 0,
    technicianNotes: '',
    nextSteps: 'Call customer to schedule visit. Bring IQ Gateway config tool. Update Wi-Fi credentials on site.',
    enphaseCases: [{ id: 'EC-001', enphaseCaseNumber: 'ENP-2026-44201', caseStatus: 'Open', openedDate: '2026-06-06', lastUpdatedDate: '2026-06-11', caseNotes: 'Gateway offline after customer router upgrade. Remote resolution attempted.' }],
    rmas: [],
    visits: [],
    activityHistory: [
      { id: 'A1', date: '2026-06-05', author: 'System', event: 'Ticket Created', note: 'GNR alert triggered — gateway offline 24h+.' },
      { id: 'A2', date: '2026-06-06', author: 'Sarah Mitchell', event: 'Enphase Case Created', note: 'Opened Enphase support case ENP-2026-44201.' },
      { id: 'A3', date: '2026-06-08', author: 'Mike Torres', event: 'Remote Troubleshooting', note: 'Attempted remote cellular reconnect — failed.' },
      { id: 'A4', date: '2026-06-10', author: 'Sarah Mitchell', event: 'Customer Contacted', note: 'Called customer. Customer confirmed router was replaced Jun 4. Scheduling truck roll.' },
    ],
    legacyCaseId: undefined,
  },

  // 2 — Failed Microinverter, Scheduled, RMA Submitted
  {
    id: 'TR-2002',
    ticketName: 'TR-MICRO-002 — Failed Microinverters (Marchetti)',
    customerName: 'David & Susan Marchetti',
    customerPhone: '(518) 555-0198',
    customerAddress: '17 Birchwood Ct, Saratoga Springs, NY 12866',
    hubspotContactId: 'HS-C-44202',
    hubspotContactLink: '#hs/contacts/44202',
    hubspotDealId: 'HS-D-89202',
    hubspotDealLink: '#hs/deals/89202',
    hubspotTicketId: 'HS-T-77302',
    hubspotTicketLink: '#hs/tickets/77302',
    paymentType: 'Cash Purchase', customerType: 'Residential', leaseDeal: false,
    ptoDate: '2023-05-10',
    monitoringPlatform: 'Enphase',
    systemId: 'EN-4420298',
    systemName: 'Marchetti — 12.8 kW System',
    enphaseSiteLink: '#enphase/systems/4420298',
    currentMonitoringStatus: 'Partial',
    gatewayStatus: 'Online — 14 of 16 microinverters reporting',
    lastEnphaseReportDate: '2026-06-14',
    repeatIssueCount: 0,
    previousTruckRollCount: 0,
    issueCategory: 'Failed Microinverter',
    truckRollReason: '2 microinverters (panels 5 and 11) showing consistent AC voltage failure. Enphase confirmed hardware defect via remote diagnosis.',
    ticketCreatedDate: '2026-06-01',
    status: 'Scheduled',
    assignedTechnician: 'Jason Park',
    truckRollOwner: 'James Rivera',
    siteAccessType: 'Open Access',
    accessInstructions: 'Equipment is on rear roof, accessible from backyard. Gate code: 4821.',
    ladderRequired: true,
    specialEquipmentRequired: '28-ft extension ladder, microinverter swap kit',
    scheduledVisitDate: '2026-06-18',
    firstVisitDate: '',
    mostRecentVisitDate: '',
    completionDate: '',
    lastCustomerContactDate: '2026-06-12',
    nextFollowUpDate: '2026-06-18',
    partsRequired: true,
    pendingDeliveryOfItems: false,
    estimatedDeliveryDate: '',
    revisitRequired: false,
    revisitReason: '',
    revisitScheduledDate: '',
    numberOfVisits: 0,
    technicianNotes: '',
    nextSteps: 'Replace IQ8A-72-2-US microinverters on panels 5 and 11. Verify output post-replacement.',
    enphaseCases: [{ id: 'EC-002', enphaseCaseNumber: 'ENP-2026-44202', caseStatus: 'RMA Processing', openedDate: '2026-06-02', lastUpdatedDate: '2026-06-09', caseNotes: 'Hardware defect confirmed. RMA approved for 2 IQ8A units.' }],
    rmas: [{
      id: 'RMA-A', rmaNumber: 'RMA-50221', enphaseCaseNumber: 'ENP-2026-44202',
      rmaRequired: 'Yes', rmaSubmittedDate: '2026-06-04', rmaStatus: 'RMA Submitted',
      trackingNumber: '', replacementEquipmentReceivedDate: '', replacementEquipmentInstalledDate: '',
      laborReimbursementStatus: 'Not Submitted', laborSubmittedDate: '',
      projectedReimbursementAmount: 320, totalReimbursementReceived: 0, reimbursementDateReceived: '',
      returnedDefectiveRMA: 'Not Required', defectiveRMAReturnDate: '', defectiveRMAReturnTracking: '',
      rmaNote: 'Awaiting Enphase RMA confirmation. Replacement units expected June 14–16.',
    }],
    visits: [],
    activityHistory: [
      { id: 'A1', date: '2026-06-01', author: 'System', event: 'Ticket Created', note: 'Production alert: 2 microinverters offline 72h+.' },
      { id: 'A2', date: '2026-06-02', author: 'James Rivera', event: 'Enphase Case Created', note: 'Opened ENP-2026-44202. Enphase remote diagnosis requested.' },
      { id: 'A3', date: '2026-06-04', author: 'James Rivera', event: 'RMA Submitted', note: 'Enphase confirmed hardware defect. Submitted RMA-50221 for 2 IQ8A units.' },
      { id: 'A4', date: '2026-06-12', author: 'James Rivera', event: 'Customer Contacted', note: 'Confirmed June 18 visit. Customer confirmed availability.' },
    ],
  },

  // 3 — Production Issue, Pending Approval, INCOMPLETE closeout
  {
    id: 'TR-2003',
    ticketName: 'TR-PROD-003 — Production Issue (Kingsley)',
    customerName: 'Robert Kingsley',
    customerPhone: '(518) 555-0271',
    customerAddress: '89 Orchard Hill Rd, Ballston Spa, NY 12020',
    hubspotContactId: 'HS-C-44203',
    hubspotContactLink: '#hs/contacts/44203',
    hubspotDealId: 'HS-D-89203',
    hubspotDealLink: '#hs/deals/89203',
    hubspotTicketId: 'HS-T-77303',
    hubspotTicketLink: '#hs/tickets/77303',
    paymentType: 'Loan', customerType: 'Residential', leaseDeal: false,
    ptoDate: '2022-11-20',
    monitoringPlatform: 'Enphase',
    systemId: 'EN-4420310',
    systemName: 'Kingsley — 8.0 kW System',
    enphaseSiteLink: '#enphase/systems/4420310',
    currentMonitoringStatus: 'Partial',
    gatewayStatus: 'Online — production below expected',
    lastEnphaseReportDate: '2026-06-14',
    repeatIssueCount: 0,
    previousTruckRollCount: 1,
    issueCategory: 'Production Issue',
    truckRollReason: 'System producing 30% below expected output. Customer reporting billing discrepancy.',
    ticketCreatedDate: '2026-06-01',
    status: 'Pending Approval',
    assignedTechnician: 'Sam Wilson',
    truckRollOwner: 'Priya Patel',
    siteAccessType: 'Customer Must Be Present',
    accessInstructions: 'Dog in backyard — customer must secure before technician arrives.',
    ladderRequired: true,
    specialEquipmentRequired: '',
    scheduledVisitDate: '2026-06-12',
    firstVisitDate: '2026-06-12',
    mostRecentVisitDate: '2026-06-12',
    completionDate: '',
    lastCustomerContactDate: '2026-06-12',
    nextFollowUpDate: '2026-06-16',
    partsRequired: false,
    pendingDeliveryOfItems: false,
    estimatedDeliveryDate: '',
    revisitRequired: false,
    revisitReason: '',
    revisitScheduledDate: '',
    numberOfVisits: 1,
    technicianNotes: 'Found 3 panels with significant shading from new neighbor tree growth. Discussed trimming with customer.',
    nextSteps: '',
    enphaseCases: [],
    rmas: [],
    visits: [{
      id: 'V1', visitDate: '2026-06-12', technicianName: 'Sam Wilson',
      outcomeNotes: '',
      issueIdentified: '3 panels shaded by neighbor tree growth reducing output 28%',
      resolvedRemotely: false,
      revisitRequired: null,
      revisitReason: '',
      partsUsed: [],
      technicalNotes: 'Confirmed shading impact with I-V curve tracer. Customer needs tree trimming or panel relocation.',
      customerUpdated: true,
      closeoutComplete: false,
      closeoutMissingFields: ['Outcome Summary', 'Revisit Required', 'Next Steps'],
    }],
    activityHistory: [
      { id: 'A1', date: '2026-06-01', author: 'Priya Patel', event: 'Ticket Created', note: 'Production concern escalated from billing inquiry.' },
      { id: 'A2', date: '2026-06-12', author: 'Sam Wilson', event: 'Visit Completed', note: 'On-site visit completed. Pending Approval — closeout form incomplete.' },
    ],
  },

  // 4 — Roof Leak, Awaiting Parts, Pending Delivery
  {
    id: 'TR-2004',
    ticketName: 'TR-ROOF-004 — Roof Leak (Ostrowski)',
    customerName: 'Emily Ostrowski',
    customerPhone: '(518) 555-0388',
    customerAddress: '22 Pinewood Lane, Troy, NY 12180',
    hubspotContactId: 'HS-C-44204',
    hubspotContactLink: '#hs/contacts/44204',
    hubspotDealId: 'HS-D-89204',
    hubspotDealLink: '#hs/deals/89204',
    hubspotTicketId: 'HS-T-77304',
    hubspotTicketLink: '#hs/tickets/77304',
    paymentType: 'Loan', customerType: 'Residential', leaseDeal: false,
    ptoDate: '2021-07-08',
    monitoringPlatform: 'Enphase',
    systemId: 'EN-4420422',
    systemName: 'Ostrowski — 7.2 kW System',
    enphaseSiteLink: '#enphase/systems/4420422',
    currentMonitoringStatus: 'Reporting',
    gatewayStatus: 'Online',
    lastEnphaseReportDate: '2026-06-14',
    repeatIssueCount: 0,
    previousTruckRollCount: 0,
    issueCategory: 'Roof Leak',
    truckRollReason: 'Active roof leak at panel row 3 flashing. Customer reports water damage to attic insulation.',
    ticketCreatedDate: '2026-05-20',
    status: 'Awaiting Parts',
    assignedTechnician: 'Carlos Reyes',
    truckRollOwner: 'David Chen',
    siteAccessType: 'Customer Must Be Present',
    accessInstructions: 'Attic access through closet on 2nd floor. Customer must be home.',
    ladderRequired: true,
    specialEquipmentRequired: 'Custom flashing kit for 10-year-old GAF shingles, butyl tape',
    scheduledVisitDate: '',
    firstVisitDate: '2026-06-02',
    mostRecentVisitDate: '2026-06-02',
    completionDate: '',
    lastCustomerContactDate: '2026-06-10',
    nextFollowUpDate: '2026-06-18',
    partsRequired: true,
    pendingDeliveryOfItems: true,
    estimatedDeliveryDate: '2026-06-17',
    revisitRequired: true,
    revisitReason: 'Custom flashing parts were backordered. Temporary sealant applied but permanent repair requires correct parts.',
    revisitScheduledDate: '2026-06-19',
    numberOfVisits: 1,
    technicianNotes: 'Applied temporary butyl tape sealant. Ordered custom GAF-compatible flashing — backordered 2 weeks.',
    nextSteps: 'Parts arriving June 17. Schedule return visit June 19 for permanent flashing installation.',
    enphaseCases: [],
    rmas: [],
    visits: [{
      id: 'V1', visitDate: '2026-06-02', technicianName: 'Carlos Reyes',
      outcomeNotes: 'Temporary sealant applied. Correct flashing parts ordered. Revisit required when parts arrive.',
      issueIdentified: 'Cracked flashing at rail mount points on row 3. Water infiltration confirmed.',
      resolvedRemotely: false,
      revisitRequired: true,
      revisitReason: 'Parts backordered — custom flashing not available on-site.',
      partsUsed: ['Butyl tape (temporary)'],
      technicalNotes: 'Cracked EPDM flashing at 4 mount penetrations. GAF-compatible custom kit required.',
      customerUpdated: true,
      closeoutComplete: true,
      closeoutMissingFields: [],
    }],
    activityHistory: [
      { id: 'A1', date: '2026-05-20', author: 'David Chen', event: 'Ticket Created', note: 'Customer reported leak after heavy rain.' },
      { id: 'A2', date: '2026-06-02', author: 'Carlos Reyes', event: 'Visit Completed', note: 'Temporary fix applied. Parts ordered.' },
      { id: 'A3', date: '2026-06-05', author: 'David Chen', event: 'Parts Ordered', note: 'Custom flashing kit ordered from supplier. Estimated June 17.' },
      { id: 'A4', date: '2026-06-10', author: 'David Chen', event: 'Customer Contacted', note: 'Informed customer parts delayed. Revisit June 19.' },
    ],
  },

  // 5 — GNR, Awaiting Parts + Pending Delivery (Replacement Gateway)
  {
    id: 'TR-2005',
    ticketName: 'TR-GNR-002 — Gateway Not Reporting (Whitfield)',
    customerName: 'James & Carol Whitfield',
    customerPhone: '(518) 555-0499',
    customerAddress: '5 Sunflower Way, Latham, NY 12110',
    hubspotContactId: 'HS-C-44205',
    hubspotContactLink: '#hs/contacts/44205',
    hubspotDealId: 'HS-D-89205',
    hubspotDealLink: '#hs/deals/89205',
    hubspotTicketId: 'HS-T-77305',
    hubspotTicketLink: '#hs/tickets/77305',
    paymentType: 'Loan', customerType: 'Residential', leaseDeal: false,
    ptoDate: '2023-09-01',
    monitoringPlatform: 'Enphase',
    systemId: 'EN-4420510',
    systemName: 'Whitfield — 10.4 kW System',
    enphaseSiteLink: '#enphase/systems/4420510',
    currentMonitoringStatus: 'Not Reporting',
    gatewayStatus: 'Hardware Failure — replacement ordered',
    lastEnphaseReportDate: '2026-05-26',
    repeatIssueCount: 0,
    previousTruckRollCount: 0,
    issueCategory: 'Gateway Not Reporting',
    truckRollReason: 'IQ Gateway hardware failure confirmed by Enphase. Remote options exhausted. Replacement unit required.',
    ticketCreatedDate: '2026-05-25',
    status: 'Awaiting Parts',
    assignedTechnician: 'Mike Torres',
    truckRollOwner: 'Sarah Mitchell',
    siteAccessType: 'Customer Must Be Present',
    accessInstructions: 'Gateway is in garage electrical panel. Customer must provide access.',
    ladderRequired: false,
    specialEquipmentRequired: 'IQ Gateway replacement unit',
    scheduledVisitDate: '2026-06-18',
    firstVisitDate: '',
    mostRecentVisitDate: '',
    completionDate: '',
    lastCustomerContactDate: '2026-06-11',
    nextFollowUpDate: '2026-06-17',
    partsRequired: true,
    pendingDeliveryOfItems: true,
    estimatedDeliveryDate: '2026-06-16',
    revisitRequired: false,
    revisitReason: '',
    revisitScheduledDate: '',
    numberOfVisits: 0,
    technicianNotes: '',
    nextSteps: 'Replacement IQ Gateway arriving June 16. Mike Torres scheduled for June 18 install.',
    enphaseCases: [{ id: 'EC-005', enphaseCaseNumber: 'ENP-2026-44205', caseStatus: 'RMA Processing', openedDate: '2026-05-26', lastUpdatedDate: '2026-06-08', caseNotes: 'Hardware failure confirmed. Replacement unit shipped under warranty.' }],
    rmas: [{
      id: 'RMA-B', rmaNumber: 'RMA-50225', enphaseCaseNumber: 'ENP-2026-44205',
      rmaRequired: 'Yes', rmaSubmittedDate: '2026-05-28', rmaStatus: 'Replacement Shipped',
      trackingNumber: 'UPS-1Z-WF-2026', replacementEquipmentReceivedDate: '', replacementEquipmentInstalledDate: '',
      laborReimbursementStatus: 'Not Submitted', laborSubmittedDate: '',
      projectedReimbursementAmount: 250, totalReimbursementReceived: 0, reimbursementDateReceived: '',
      returnedDefectiveRMA: 'Pending', defectiveRMAReturnDate: '', defectiveRMAReturnTracking: '',
      rmaNote: 'Replacement IQ Gateway shipped. Defective unit must be returned within 30 days of receipt.',
    }],
    visits: [],
    activityHistory: [
      { id: 'A1', date: '2026-05-25', author: 'System', event: 'Ticket Created', note: 'GNR alert — gateway offline 20 days.' },
      { id: 'A2', date: '2026-05-26', author: 'Sarah Mitchell', event: 'Enphase Case Created', note: 'Opened ENP-2026-44205.' },
      { id: 'A3', date: '2026-05-28', author: 'Sarah Mitchell', event: 'RMA Submitted', note: 'Hardware failure confirmed. RMA-50225 submitted.' },
      { id: 'A4', date: '2026-06-08', author: 'Enphase', event: 'Replacement Shipped', note: 'Replacement IQ Gateway shipped via UPS.' },
    ],
  },

  // 6 — Failed Microinverter, Awaiting RMA Approval
  {
    id: 'TR-2006',
    ticketName: 'TR-MICRO-006 — Failed Microinverters (Tran)',
    customerName: 'Michelle Tran',
    customerPhone: '(518) 555-0612',
    customerAddress: '338 Lakeside Dr, Guilderland, NY 12084',
    hubspotContactId: 'HS-C-44206',
    hubspotContactLink: '#hs/contacts/44206',
    hubspotDealId: 'HS-D-89206',
    hubspotDealLink: '#hs/deals/89206',
    hubspotTicketId: 'HS-T-77306',
    hubspotTicketLink: '#hs/tickets/77306',
    paymentType: 'Cash Purchase', customerType: 'Residential', leaseDeal: false,
    ptoDate: '2022-04-22',
    monitoringPlatform: 'Enphase',
    systemId: 'EN-4420688',
    systemName: 'Tran — 6.4 kW System',
    enphaseSiteLink: '#enphase/systems/4420688',
    currentMonitoringStatus: 'Partial',
    gatewayStatus: 'Online — 6 of 8 microinverters reporting',
    lastEnphaseReportDate: '2026-06-14',
    repeatIssueCount: 1,
    previousTruckRollCount: 1,
    issueCategory: 'Failed Microinverter',
    truckRollReason: '2 microinverters offline. Previously replaced one unit in 2024. Possible batch defect.',
    ticketCreatedDate: '2026-06-03',
    status: 'Awaiting RMA Approval',
    assignedTechnician: 'Jason Park',
    truckRollOwner: 'James Rivera',
    siteAccessType: 'Open Access',
    accessInstructions: 'Side gate is unlocked. Panels on south-facing rear roof.',
    ladderRequired: true,
    specialEquipmentRequired: '',
    scheduledVisitDate: '',
    firstVisitDate: '',
    mostRecentVisitDate: '',
    completionDate: '',
    lastCustomerContactDate: '2026-06-08',
    nextFollowUpDate: '2026-06-17',
    partsRequired: true,
    pendingDeliveryOfItems: false,
    estimatedDeliveryDate: '',
    revisitRequired: false,
    revisitReason: '',
    revisitScheduledDate: '',
    numberOfVisits: 0,
    technicianNotes: '',
    nextSteps: 'Awaiting Enphase RMA approval. Schedule install once replacement units confirmed.',
    enphaseCases: [{ id: 'EC-006', enphaseCaseNumber: 'ENP-2026-44206', caseStatus: 'Open', openedDate: '2026-06-04', lastUpdatedDate: '2026-06-11', caseNotes: 'Possible batch defect. Requesting 2 IQ8M replacement units under warranty.' }],
    rmas: [{
      id: 'RMA-C', rmaNumber: 'RMA-50228', enphaseCaseNumber: 'ENP-2026-44206',
      rmaRequired: 'Under Review', rmaSubmittedDate: '2026-06-06', rmaStatus: 'Under Review',
      trackingNumber: '', replacementEquipmentReceivedDate: '', replacementEquipmentInstalledDate: '',
      laborReimbursementStatus: 'Not Submitted', laborSubmittedDate: '',
      projectedReimbursementAmount: 420, totalReimbursementReceived: 0, reimbursementDateReceived: '',
      returnedDefectiveRMA: 'Not Required', defectiveRMAReturnDate: '', defectiveRMAReturnTracking: '',
      rmaNote: 'Awaiting Enphase engineering review of batch defect claim.',
    }],
    visits: [],
    activityHistory: [
      { id: 'A1', date: '2026-06-03', author: 'System', event: 'Ticket Created', note: 'Alert: 2 microinverters offline 5 days.' },
      { id: 'A2', date: '2026-06-04', author: 'James Rivera', event: 'Enphase Case Created', note: 'Opened ENP-2026-44206. Batch defect investigation.' },
      { id: 'A3', date: '2026-06-06', author: 'James Rivera', event: 'RMA Submitted', note: 'RMA-50228 submitted. Under Enphase review.' },
    ],
  },

  // 7 — Production, RMA Submitted, waiting Enphase
  {
    id: 'TR-2007',
    ticketName: 'TR-PROD-007 — Failed Panel String (Santos)',
    customerName: 'Gregory Santos',
    customerPhone: '(518) 555-0744',
    customerAddress: '1002 Riverside Blvd, Cohoes, NY 12047',
    hubspotContactId: 'HS-C-44207',
    hubspotContactLink: '#hs/contacts/44207',
    hubspotDealId: 'HS-D-89207',
    hubspotDealLink: '#hs/deals/89207',
    hubspotTicketId: 'HS-T-77307',
    hubspotTicketLink: '#hs/tickets/77307',
    paymentType: 'Loan', customerType: 'Residential', leaseDeal: false,
    ptoDate: '2023-03-14',
    monitoringPlatform: 'Enphase',
    systemId: 'EN-4420788',
    systemName: 'Santos — 11.2 kW System',
    enphaseSiteLink: '#enphase/systems/4420788',
    currentMonitoringStatus: 'Partial',
    gatewayStatus: 'Online — string 2 offline',
    lastEnphaseReportDate: '2026-06-14',
    repeatIssueCount: 0,
    previousTruckRollCount: 0,
    issueCategory: 'Failed Microinverter',
    truckRollReason: 'Entire string 2 (6 microinverters) offline. Enphase confirmed AC branch circuit failure.',
    ticketCreatedDate: '2026-05-15',
    status: 'RMA Submitted',
    assignedTechnician: 'Jason Park',
    truckRollOwner: 'Priya Patel',
    siteAccessType: 'Gate Code Required',
    accessInstructions: 'Gate code: 7290. Panels accessible from driveway side.',
    ladderRequired: true,
    specialEquipmentRequired: 'AC branch circuit tester, 6x IQ8A microinverters',
    scheduledVisitDate: '2026-06-22',
    firstVisitDate: '',
    mostRecentVisitDate: '',
    completionDate: '',
    lastCustomerContactDate: '2026-06-09',
    nextFollowUpDate: '2026-06-18',
    partsRequired: true,
    pendingDeliveryOfItems: true,
    estimatedDeliveryDate: '2026-06-20',
    revisitRequired: false,
    revisitReason: '',
    revisitScheduledDate: '',
    numberOfVisits: 0,
    technicianNotes: '',
    nextSteps: 'Wait for RMA units (est. June 20). Jason Park scheduled June 22.',
    enphaseCases: [{ id: 'EC-007', enphaseCaseNumber: 'ENP-2026-44207', caseStatus: 'RMA Processing', openedDate: '2026-05-16', lastUpdatedDate: '2026-06-05', caseNotes: 'AC branch circuit failure. 6 IQ8A replacement units approved.' }],
    rmas: [{
      id: 'RMA-D', rmaNumber: 'RMA-50230', enphaseCaseNumber: 'ENP-2026-44207',
      rmaRequired: 'Yes', rmaSubmittedDate: '2026-05-20', rmaStatus: 'RMA Approved',
      trackingNumber: '', replacementEquipmentReceivedDate: '', replacementEquipmentInstalledDate: '',
      laborReimbursementStatus: 'Not Submitted', laborSubmittedDate: '',
      projectedReimbursementAmount: 680, totalReimbursementReceived: 0, reimbursementDateReceived: '',
      returnedDefectiveRMA: 'Pending', defectiveRMAReturnDate: '', defectiveRMAReturnTracking: '',
      rmaNote: 'RMA approved for 6 IQ8A units. Shipping expected June 18–20.',
    }],
    visits: [],
    activityHistory: [
      { id: 'A1', date: '2026-05-15', author: 'System', event: 'Ticket Created', note: 'String 2 offline 48h.' },
      { id: 'A2', date: '2026-05-16', author: 'Priya Patel', event: 'Enphase Case Created', note: 'Opened ENP-2026-44207.' },
      { id: 'A3', date: '2026-05-20', author: 'Priya Patel', event: 'RMA Submitted', note: 'RMA-50230 submitted for 6 IQ8A units.' },
      { id: 'A4', date: '2026-06-05', author: 'Enphase', event: 'RMA Approved', note: 'Enphase approved RMA. Replacement units processing.' },
    ],
  },

  // 8 — Replacement Shipped, Applied for Reimbursement
  {
    id: 'TR-2008',
    ticketName: 'TR-MICRO-008 — Microinverter Replacement (Colangelo)',
    customerName: 'Linda & Frank Colangelo',
    customerPhone: '(518) 555-0881',
    customerAddress: '74 Heritage Hills Rd, Niskayuna, NY 12309',
    hubspotContactId: 'HS-C-44208',
    hubspotContactLink: '#hs/contacts/44208',
    hubspotDealId: 'HS-D-89208',
    hubspotDealLink: '#hs/deals/89208',
    hubspotTicketId: 'HS-T-77308',
    hubspotTicketLink: '#hs/tickets/77308',
    paymentType: 'Cash Purchase', customerType: 'Residential', leaseDeal: false,
    ptoDate: '2021-06-01',
    monitoringPlatform: 'Enphase',
    systemId: 'EN-4420899',
    systemName: 'Colangelo — 9.6 kW System',
    enphaseSiteLink: '#enphase/systems/4420899',
    currentMonitoringStatus: 'Partial',
    gatewayStatus: 'Online — 10 of 12 reporting',
    lastEnphaseReportDate: '2026-06-14',
    repeatIssueCount: 0,
    previousTruckRollCount: 0,
    issueCategory: 'Failed Microinverter',
    truckRollReason: '2 microinverters failed after 5 years. Warranty replacement approved.',
    ticketCreatedDate: '2026-05-01',
    status: 'Replacement Shipped',
    assignedTechnician: 'Sam Wilson',
    truckRollOwner: 'David Chen',
    siteAccessType: 'Open Access',
    accessInstructions: 'Rear roof accessible from backyard. No gate.',
    ladderRequired: true,
    specialEquipmentRequired: '',
    scheduledVisitDate: '2026-06-20',
    firstVisitDate: '',
    mostRecentVisitDate: '',
    completionDate: '',
    lastCustomerContactDate: '2026-06-10',
    nextFollowUpDate: '2026-06-17',
    partsRequired: true,
    pendingDeliveryOfItems: true,
    estimatedDeliveryDate: '2026-06-16',
    revisitRequired: false,
    revisitReason: '',
    revisitScheduledDate: '',
    numberOfVisits: 0,
    technicianNotes: '',
    nextSteps: 'Parts arriving June 16. Sam Wilson install June 20. Submit labor reimbursement after completion.',
    enphaseCases: [{ id: 'EC-008', enphaseCaseNumber: 'ENP-2026-44208', caseStatus: 'Closed', openedDate: '2026-05-02', lastUpdatedDate: '2026-05-18', caseNotes: 'Warranty replacement approved. RMA processed.' }],
    rmas: [{
      id: 'RMA-E', rmaNumber: 'RMA-50235', enphaseCaseNumber: 'ENP-2026-44208',
      rmaRequired: 'Yes', rmaSubmittedDate: '2026-05-05', rmaStatus: 'Replacement Shipped',
      trackingNumber: 'FEDEX-2026-COL', replacementEquipmentReceivedDate: '', replacementEquipmentInstalledDate: '',
      laborReimbursementStatus: 'Not Submitted', laborSubmittedDate: '',
      projectedReimbursementAmount: 360, totalReimbursementReceived: 0, reimbursementDateReceived: '',
      returnedDefectiveRMA: 'Pending', defectiveRMAReturnDate: '', defectiveRMAReturnTracking: '',
      rmaNote: 'Replacement units shipped June 12 via FedEx. Defective units must be returned within 30 days.',
    }],
    visits: [],
    activityHistory: [
      { id: 'A1', date: '2026-05-01', author: 'David Chen', event: 'Ticket Created', note: 'Customer reported monitoring gap.' },
      { id: 'A2', date: '2026-05-05', author: 'David Chen', event: 'RMA Submitted', note: 'RMA-50235 submitted.' },
      { id: 'A3', date: '2026-05-18', author: 'Enphase', event: 'RMA Approved', note: 'Warranty confirmed.' },
      { id: 'A4', date: '2026-06-12', author: 'Enphase', event: 'Replacement Shipped', note: 'Units shipped via FedEx.' },
    ],
  },

  // 9 — GNR, Replacement Installed, Defective Return Pending
  {
    id: 'TR-2009',
    ticketName: 'TR-GNR-003 — Gateway Replacement Complete (Yaeger)',
    customerName: 'Thomas Yaeger',
    customerPhone: '(518) 555-0977',
    customerAddress: '201 Country Club Dr, Loudonville, NY 12211',
    hubspotContactId: 'HS-C-44209',
    hubspotContactLink: '#hs/contacts/44209',
    hubspotDealId: 'HS-D-89209',
    hubspotDealLink: '#hs/deals/89209',
    hubspotTicketId: 'HS-T-77309',
    hubspotTicketLink: '#hs/tickets/77309',
    paymentType: 'Loan', customerType: 'Residential', leaseDeal: false,
    ptoDate: '2023-11-08',
    monitoringPlatform: 'Enphase',
    systemId: 'EN-4421001',
    systemName: 'Yaeger — 13.0 kW System',
    enphaseSiteLink: '#enphase/systems/4421001',
    currentMonitoringStatus: 'Reporting',
    gatewayStatus: 'Online — all panels reporting',
    lastEnphaseReportDate: '2026-06-14',
    repeatIssueCount: 0,
    previousTruckRollCount: 0,
    issueCategory: 'Gateway Not Reporting',
    truckRollReason: 'IQ Gateway hardware failure. Replaced under warranty.',
    ticketCreatedDate: '2026-04-15',
    status: 'Replacement Received',
    assignedTechnician: 'Mike Torres',
    truckRollOwner: 'Sarah Mitchell',
    siteAccessType: 'Customer Must Be Present',
    accessInstructions: 'Interior electrical panel in basement. Customer must unlock door.',
    ladderRequired: false,
    specialEquipmentRequired: '',
    scheduledVisitDate: '',
    firstVisitDate: '2026-06-05',
    mostRecentVisitDate: '2026-06-05',
    completionDate: '',
    lastCustomerContactDate: '2026-06-05',
    nextFollowUpDate: '2026-06-20',
    partsRequired: false,
    pendingDeliveryOfItems: false,
    estimatedDeliveryDate: '',
    revisitRequired: false,
    revisitReason: '',
    revisitScheduledDate: '',
    numberOfVisits: 1,
    technicianNotes: 'New IQ Gateway installed and commissioned June 5. System fully reporting.',
    nextSteps: 'Ship defective gateway back to Enphase. Submit labor reimbursement application.',
    enphaseCases: [{ id: 'EC-009', enphaseCaseNumber: 'ENP-2026-44209', caseStatus: 'Closed', openedDate: '2026-04-16', lastUpdatedDate: '2026-06-05', caseNotes: 'Hardware failure confirmed. Replacement installed June 5.' }],
    rmas: [{
      id: 'RMA-F', rmaNumber: 'RMA-50218', enphaseCaseNumber: 'ENP-2026-44209',
      rmaRequired: 'Yes', rmaSubmittedDate: '2026-04-18', rmaStatus: 'Defective Equipment Return Pending',
      trackingNumber: 'UPS-1Z-YAE-2026', replacementEquipmentReceivedDate: '2026-06-03', replacementEquipmentInstalledDate: '2026-06-05',
      laborReimbursementStatus: 'Not Submitted', laborSubmittedDate: '',
      projectedReimbursementAmount: 280, totalReimbursementReceived: 0, reimbursementDateReceived: '',
      returnedDefectiveRMA: 'Pending', defectiveRMAReturnDate: '', defectiveRMAReturnTracking: '',
      rmaNote: 'Replacement installed. Must ship defective unit back to Enphase. Prepaid label on file.',
    }],
    visits: [{
      id: 'V1', visitDate: '2026-06-05', technicianName: 'Mike Torres',
      outcomeNotes: 'New IQ Gateway installed and commissioned. All 20 panels reporting. Customer confirmed system operational.',
      issueIdentified: 'IQ Gateway hardware failure — internal Wi-Fi chip defective.',
      resolvedRemotely: false,
      revisitRequired: false,
      revisitReason: '',
      partsUsed: ['IQ Gateway (RMA replacement)'],
      technicalNotes: 'Old unit completely dead. Replacement unit provisioned. Site survey updated in Enphase.',
      customerUpdated: true,
      closeoutComplete: true,
      closeoutMissingFields: [],
    }],
    activityHistory: [
      { id: 'A1', date: '2026-04-15', author: 'System', event: 'Ticket Created', note: 'GNR alert — gateway offline 30 days.' },
      { id: 'A2', date: '2026-04-18', author: 'Sarah Mitchell', event: 'RMA Submitted', note: 'Hardware failure confirmed. RMA-50218 submitted.' },
      { id: 'A3', date: '2026-06-03', author: 'Mike Torres', event: 'Parts Received', note: 'Replacement IQ Gateway received.' },
      { id: 'A4', date: '2026-06-05', author: 'Mike Torres', event: 'Visit Completed', note: 'Replacement installed and commissioned.' },
    ],
  },

  // 10 — Completed, Partial Reimbursement
  {
    id: 'TR-2010',
    ticketName: 'TR-MICRO-010 — Microinverter RMA Complete (Petersen)',
    customerName: 'Karen Petersen',
    customerPhone: '(518) 555-1044',
    customerAddress: '56 Clover Meadow Dr, Delmar, NY 12054',
    hubspotContactId: 'HS-C-44210',
    hubspotContactLink: '#hs/contacts/44210',
    hubspotDealId: 'HS-D-89210',
    hubspotDealLink: '#hs/deals/89210',
    hubspotTicketId: 'HS-T-77310',
    hubspotTicketLink: '#hs/tickets/77310',
    paymentType: 'Loan', customerType: 'Residential', leaseDeal: false,
    ptoDate: '2020-09-15',
    monitoringPlatform: 'Enphase',
    systemId: 'EN-4421111',
    systemName: 'Petersen — 8.0 kW System',
    enphaseSiteLink: '#enphase/systems/4421111',
    currentMonitoringStatus: 'Reporting',
    gatewayStatus: 'Online',
    lastEnphaseReportDate: '2026-06-14',
    repeatIssueCount: 1,
    previousTruckRollCount: 1,
    issueCategory: 'Failed Microinverter',
    truckRollReason: '3 microinverters replaced under warranty. RMA completed. Labor reimbursement partially received.',
    ticketCreatedDate: '2026-03-10',
    status: 'Completed',
    assignedTechnician: 'Sam Wilson',
    truckRollOwner: 'Priya Patel',
    siteAccessType: 'Open Access',
    accessInstructions: '',
    ladderRequired: true,
    specialEquipmentRequired: '',
    scheduledVisitDate: '2026-05-12',
    firstVisitDate: '2026-05-12',
    mostRecentVisitDate: '2026-05-12',
    completionDate: '2026-05-20',
    lastCustomerContactDate: '2026-05-20',
    nextFollowUpDate: '',
    partsRequired: false,
    pendingDeliveryOfItems: false,
    estimatedDeliveryDate: '',
    revisitRequired: false,
    revisitReason: '',
    revisitScheduledDate: '',
    numberOfVisits: 1,
    technicianNotes: 'Replaced 3 IQ7+ microinverters on panels 2, 6, 8. All confirmed operational post-install.',
    nextSteps: 'Follow up on outstanding reimbursement balance.',
    enphaseCases: [{ id: 'EC-010', enphaseCaseNumber: 'ENP-2026-44210', caseStatus: 'Closed', openedDate: '2026-03-12', lastUpdatedDate: '2026-04-20', caseNotes: 'Warranty replacement completed.' }],
    rmas: [{
      id: 'RMA-G', rmaNumber: 'RMA-50210', enphaseCaseNumber: 'ENP-2026-44210',
      rmaRequired: 'Yes', rmaSubmittedDate: '2026-03-15', rmaStatus: 'Labor Reimbursement Partially Received',
      trackingNumber: 'FEDEX-2026-PET', replacementEquipmentReceivedDate: '2026-05-08', replacementEquipmentInstalledDate: '2026-05-12',
      laborReimbursementStatus: 'Partially Received', laborSubmittedDate: '2026-05-25',
      projectedReimbursementAmount: 480, totalReimbursementReceived: 240, reimbursementDateReceived: '2026-06-08',
      returnedDefectiveRMA: 'Yes', defectiveRMAReturnDate: '2026-05-18', defectiveRMAReturnTracking: 'UPS-RET-PET-2026',
      rmaNote: 'First reimbursement payment received June 8 ($240). Second payment ($240) expected by June 30.',
    }],
    visits: [{
      id: 'V1', visitDate: '2026-05-12', technicianName: 'Sam Wilson',
      outcomeNotes: 'Replaced 3 IQ7+ microinverters. All panels operational at full capacity.',
      issueIdentified: 'IQ7+ batch defect — AC coupling failure in 3 units.',
      resolvedRemotely: false, revisitRequired: false, revisitReason: '',
      partsUsed: ['3x IQ7+ microinverter (RMA)'],
      technicalNotes: 'Defective units removed and returned. New units commissioned in Enphase app.',
      customerUpdated: true, closeoutComplete: true, closeoutMissingFields: [],
    }],
    activityHistory: [
      { id: 'A1', date: '2026-03-10', author: 'Priya Patel', event: 'Ticket Created', note: 'Customer reported 3 panels offline.' },
      { id: 'A2', date: '2026-05-12', author: 'Sam Wilson', event: 'Visit Completed', note: '3 microinverters replaced.' },
      { id: 'A3', date: '2026-05-20', author: 'Priya Patel', event: 'Ticket Completed', note: 'Marked complete.' },
      { id: 'A4', date: '2026-05-25', author: 'Priya Patel', event: 'Labor Reimbursement Submitted', note: 'Submitted $480 labor reimbursement.' },
      { id: 'A5', date: '2026-06-08', author: 'Enphase', event: 'Partial Reimbursement Received', note: '$240 received (50% of claim).' },
    ],
  },

  // 11 — Completed, Full Reimbursement, Defective Returned
  {
    id: 'TR-2011',
    ticketName: 'TR-GNR-004 — Gateway RMA Complete (Hoffman)',
    customerName: 'Steven & Diane Hoffman',
    customerPhone: '(518) 555-1122',
    customerAddress: '14 Fox Run Rd, Slingerlands, NY 12159',
    hubspotContactId: 'HS-C-44211',
    hubspotContactLink: '#hs/contacts/44211',
    hubspotDealId: 'HS-D-89211',
    hubspotDealLink: '#hs/deals/89211',
    hubspotTicketId: 'HS-T-77311',
    hubspotTicketLink: '#hs/tickets/77311',
    paymentType: 'Cash Purchase', customerType: 'Residential', leaseDeal: false,
    ptoDate: '2022-06-20',
    monitoringPlatform: 'Enphase',
    systemId: 'EN-4421222',
    systemName: 'Hoffman — 10.4 kW System',
    enphaseSiteLink: '#enphase/systems/4421222',
    currentMonitoringStatus: 'Reporting',
    gatewayStatus: 'Online',
    lastEnphaseReportDate: '2026-06-14',
    repeatIssueCount: 0,
    previousTruckRollCount: 0,
    issueCategory: 'Gateway Not Reporting',
    truckRollReason: 'IQ Gateway failed after lightning storm. Full RMA and labor reimbursement completed.',
    ticketCreatedDate: '2026-02-15',
    status: 'Completed',
    assignedTechnician: 'Mike Torres',
    truckRollOwner: 'Sarah Mitchell',
    siteAccessType: 'Customer Must Be Present',
    accessInstructions: '',
    ladderRequired: false,
    specialEquipmentRequired: '',
    scheduledVisitDate: '2026-04-08',
    firstVisitDate: '2026-04-08',
    mostRecentVisitDate: '2026-04-08',
    completionDate: '2026-04-10',
    lastCustomerContactDate: '2026-04-10',
    nextFollowUpDate: '',
    partsRequired: false,
    pendingDeliveryOfItems: false,
    estimatedDeliveryDate: '',
    revisitRequired: false,
    revisitReason: '',
    revisitScheduledDate: '',
    numberOfVisits: 1,
    technicianNotes: 'IQ Gateway replaced. All 16 panels reporting. Surge protection recommended.',
    nextSteps: 'Closed.',
    enphaseCases: [{ id: 'EC-011', enphaseCaseNumber: 'ENP-2026-44211', caseStatus: 'Closed', openedDate: '2026-02-16', lastUpdatedDate: '2026-04-10', caseNotes: 'Lightning surge damage. Warranty replacement approved and completed.' }],
    rmas: [{
      id: 'RMA-H', rmaNumber: 'RMA-50205', enphaseCaseNumber: 'ENP-2026-44211',
      rmaRequired: 'Yes', rmaSubmittedDate: '2026-02-20', rmaStatus: 'RMA Closed',
      trackingNumber: 'UPS-1Z-HOF-2026', replacementEquipmentReceivedDate: '2026-04-05', replacementEquipmentInstalledDate: '2026-04-08',
      laborReimbursementStatus: 'Fully Received', laborSubmittedDate: '2026-04-15',
      projectedReimbursementAmount: 290, totalReimbursementReceived: 290, reimbursementDateReceived: '2026-05-10',
      returnedDefectiveRMA: 'Yes', defectiveRMAReturnDate: '2026-04-12', defectiveRMAReturnTracking: 'UPS-RET-HOF-2026',
      rmaNote: 'Full reimbursement received May 10. Defective unit returned April 12. Case fully closed.',
    }],
    visits: [{
      id: 'V1', visitDate: '2026-04-08', technicianName: 'Mike Torres',
      outcomeNotes: 'Replacement IQ Gateway installed and commissioned. All panels reporting.',
      issueIdentified: 'Lightning surge caused internal failure of IQ Gateway.',
      resolvedRemotely: false, revisitRequired: false, revisitReason: '',
      partsUsed: ['IQ Gateway (RMA replacement)'],
      technicalNotes: 'Surge protector added to breaker panel as precaution.',
      customerUpdated: true, closeoutComplete: true, closeoutMissingFields: [],
    }],
    activityHistory: [
      { id: 'A1', date: '2026-02-15', author: 'Sarah Mitchell', event: 'Ticket Created', note: 'Gateway offline after storm Feb 14.' },
      { id: 'A2', date: '2026-04-08', author: 'Mike Torres', event: 'Visit Completed', note: 'Replacement installed.' },
      { id: 'A3', date: '2026-04-10', author: 'Sarah Mitchell', event: 'Ticket Completed', note: 'Closed.' },
      { id: 'A4', date: '2026-05-10', author: 'Enphase', event: 'Labor Reimbursement Received', note: 'Full $290 received.' },
    ],
  },

  // 12 — GNR, Remote Resolution (Closed, no truck roll needed)
  {
    id: 'TR-2012',
    ticketName: 'TR-GNR-005 — Gateway Resolved Remotely (Mullen)',
    customerName: 'Beatrice Mullen',
    customerPhone: '(518) 555-1256',
    customerAddress: '99 Hillcrest Ave, Schenectady, NY 12309',
    hubspotContactId: 'HS-C-44212',
    hubspotContactLink: '#hs/contacts/44212',
    hubspotDealId: 'HS-D-89212',
    hubspotDealLink: '#hs/deals/89212',
    hubspotTicketId: 'HS-T-77312',
    hubspotTicketLink: '#hs/tickets/77312',
    paymentType: 'Loan', customerType: 'Residential', leaseDeal: false,
    ptoDate: '2024-03-01',
    monitoringPlatform: 'Enphase',
    systemId: 'EN-4421300',
    systemName: 'Mullen — 7.2 kW System',
    enphaseSiteLink: '#enphase/systems/4421300',
    currentMonitoringStatus: 'Reporting',
    gatewayStatus: 'Online',
    lastEnphaseReportDate: '2026-06-14',
    repeatIssueCount: 0,
    previousTruckRollCount: 0,
    issueCategory: 'Gateway Not Reporting',
    truckRollReason: 'Gateway offline — resolved remotely via Enphase remote reboot. No truck roll required.',
    ticketCreatedDate: '2026-06-05',
    status: 'Completed',
    assignedTechnician: 'Mike Torres',
    truckRollOwner: 'Sarah Mitchell',
    siteAccessType: 'Open Access',
    accessInstructions: '',
    ladderRequired: false,
    specialEquipmentRequired: '',
    scheduledVisitDate: '',
    firstVisitDate: '',
    mostRecentVisitDate: '',
    completionDate: '2026-06-08',
    lastCustomerContactDate: '2026-06-08',
    nextFollowUpDate: '',
    partsRequired: false,
    pendingDeliveryOfItems: false,
    estimatedDeliveryDate: '',
    revisitRequired: false,
    revisitReason: '',
    revisitScheduledDate: '',
    numberOfVisits: 0,
    technicianNotes: 'Remote reboot via Enphase portal resolved issue. Gateway back online within 4 hours.',
    nextSteps: 'Closed — resolved remotely.',
    enphaseCases: [],
    rmas: [],
    visits: [],
    activityHistory: [
      { id: 'A1', date: '2026-06-05', author: 'System', event: 'Ticket Created', note: 'GNR alert — gateway offline 36h.' },
      { id: 'A2', date: '2026-06-06', author: 'Mike Torres', event: 'Remote Troubleshooting', note: 'Initiated remote reboot via Enphase portal.' },
      { id: 'A3', date: '2026-06-08', author: 'Sarah Mitchell', event: 'Ticket Completed', note: 'Resolved remotely. Gateway online. Closed.' },
    ],
  },

  // 13 — Failed Microinverter, Return Visit Required, Revisit Scheduled
  {
    id: 'TR-2013',
    ticketName: 'TR-MICRO-013 — Microinverter Revisit (Cervantes)',
    customerName: 'Anthony & Paula Cervantes',
    customerPhone: '(518) 555-1388',
    customerAddress: '32 Stonegate Dr, Halfmoon, NY 12065',
    hubspotContactId: 'HS-C-44213',
    hubspotContactLink: '#hs/contacts/44213',
    hubspotDealId: 'HS-D-89213',
    hubspotDealLink: '#hs/deals/89213',
    hubspotTicketId: 'HS-T-77313',
    hubspotTicketLink: '#hs/tickets/77313',
    paymentType: 'Loan', customerType: 'Residential', leaseDeal: false,
    ptoDate: '2023-07-14',
    monitoringPlatform: 'Enphase',
    systemId: 'EN-4421388',
    systemName: 'Cervantes — 11.2 kW System',
    enphaseSiteLink: '#enphase/systems/4421388',
    currentMonitoringStatus: 'Partial',
    gatewayStatus: 'Online — 12 of 14 reporting',
    lastEnphaseReportDate: '2026-06-14',
    repeatIssueCount: 0,
    previousTruckRollCount: 0,
    issueCategory: 'Failed Microinverter',
    truckRollReason: '2 microinverters failed. First visit replaced 1 of 2 — second unit requires revisit with correct tool.',
    ticketCreatedDate: '2026-05-28',
    status: 'Revisit Scheduled',
    assignedTechnician: 'Jason Park',
    truckRollOwner: 'James Rivera',
    siteAccessType: 'Gate Code Required',
    accessInstructions: 'Side gate code: 3311. Panels on east-facing roof, 2nd story.',
    ladderRequired: true,
    specialEquipmentRequired: '32-ft ladder required for east roof section',
    scheduledVisitDate: '2026-06-20',
    firstVisitDate: '2026-06-10',
    mostRecentVisitDate: '2026-06-10',
    completionDate: '',
    lastCustomerContactDate: '2026-06-12',
    nextFollowUpDate: '2026-06-20',
    partsRequired: true,
    pendingDeliveryOfItems: false,
    estimatedDeliveryDate: '',
    revisitRequired: true,
    revisitReason: 'First visit replaced only 1 of 2 failed microinverters. Second unit on east roof requires 32-ft ladder not available at first visit.',
    revisitScheduledDate: '2026-06-20',
    numberOfVisits: 1,
    technicianNotes: 'First microinverter replaced on panel 3 (south roof). Panel 9 (east roof) requires 32-ft ladder — will return June 20.',
    nextSteps: 'Jason Park revisit June 20 with 32-ft ladder. Replace microinverter panel 9.',
    enphaseCases: [],
    rmas: [{
      id: 'RMA-I', rmaNumber: 'RMA-50240', enphaseCaseNumber: '',
      rmaRequired: 'Yes', rmaSubmittedDate: '2026-06-01', rmaStatus: 'Replacement Delivered',
      trackingNumber: '', replacementEquipmentReceivedDate: '2026-06-09', replacementEquipmentInstalledDate: '',
      laborReimbursementStatus: 'Not Submitted', laborSubmittedDate: '',
      projectedReimbursementAmount: 320, totalReimbursementReceived: 0, reimbursementDateReceived: '',
      returnedDefectiveRMA: 'Pending', defectiveRMAReturnDate: '', defectiveRMAReturnTracking: '',
      rmaNote: 'Replacement for panel 9 received June 9. Will be installed at revisit June 20.',
    }],
    visits: [{
      id: 'V1', visitDate: '2026-06-10', technicianName: 'Jason Park',
      outcomeNotes: 'Replaced microinverter on panel 3. Panel 9 deferred — 32-ft ladder required.',
      issueIdentified: 'Both IQ8A microinverters on panels 3 and 9 failed — firmware issue.',
      resolvedRemotely: false, revisitRequired: true,
      revisitReason: 'Panel 9 requires 32-ft ladder. Not available at first visit.',
      partsUsed: ['1x IQ8A microinverter (panel 3)'],
      technicalNotes: 'Panel 3 replaced and commissioned. Panel 9 verified offline — RMA unit received June 9 on-site.',
      customerUpdated: true, closeoutComplete: true, closeoutMissingFields: [],
    }],
    activityHistory: [
      { id: 'A1', date: '2026-05-28', author: 'James Rivera', event: 'Ticket Created', note: '2 microinverters offline.' },
      { id: 'A2', date: '2026-06-10', author: 'Jason Park', event: 'Visit Completed', note: '1 of 2 replaced. Revisit needed.' },
      { id: 'A3', date: '2026-06-12', author: 'James Rivera', event: 'Revisit Scheduled', note: 'June 20 revisit confirmed.' },
    ],
  },

  // 14 — Production, OVERDUE (35+ days, Awaiting Technician)
  {
    id: 'TR-2014',
    ticketName: 'TR-PROD-014 — Production Decline OVERDUE (Borowski)',
    customerName: 'Richard Borowski',
    customerPhone: '(518) 555-1499',
    customerAddress: '77 Fernwood Ave, Albany, NY 12203',
    hubspotContactId: 'HS-C-44214',
    hubspotContactLink: '#hs/contacts/44214',
    hubspotDealId: 'HS-D-89214',
    hubspotDealLink: '#hs/deals/89214',
    hubspotTicketId: 'HS-T-77314',
    hubspotTicketLink: '#hs/tickets/77314',
    paymentType: 'Loan', customerType: 'Residential', leaseDeal: false,
    ptoDate: '2022-08-30',
    monitoringPlatform: 'Enphase',
    systemId: 'EN-4421499',
    systemName: 'Borowski — 9.6 kW System',
    enphaseSiteLink: '#enphase/systems/4421499',
    currentMonitoringStatus: 'Partial',
    gatewayStatus: 'Online — production 40% below expected',
    lastEnphaseReportDate: '2026-06-14',
    repeatIssueCount: 1,
    previousTruckRollCount: 1,
    issueCategory: 'Production Issue',
    truckRollReason: 'System producing 40% below expected. Remote diagnosis inconclusive. Truck roll required for on-site investigation.',
    ticketCreatedDate: '2026-05-01',
    status: 'Awaiting Technician',
    assignedTechnician: '',
    truckRollOwner: 'David Chen',
    siteAccessType: 'Customer Must Be Present',
    accessInstructions: 'Customer works nights — available 10AM–6PM only.',
    ladderRequired: true,
    specialEquipmentRequired: 'I-V curve tracer, thermal camera',
    scheduledVisitDate: '',
    firstVisitDate: '',
    mostRecentVisitDate: '',
    completionDate: '',
    lastCustomerContactDate: '2026-06-01',
    nextFollowUpDate: '2026-06-15',
    partsRequired: false,
    pendingDeliveryOfItems: false,
    estimatedDeliveryDate: '',
    revisitRequired: false,
    revisitReason: '',
    revisitScheduledDate: '',
    numberOfVisits: 0,
    technicianNotes: '',
    nextSteps: 'URGENT: Assign technician immediately. Case is 45 days old. Customer has contacted billing department.',
    enphaseCases: [],
    rmas: [],
    visits: [],
    activityHistory: [
      { id: 'A1', date: '2026-05-01', author: 'David Chen', event: 'Ticket Created', note: 'Production 40% below expected — remote diagnosis needed.' },
      { id: 'A2', date: '2026-05-15', author: 'David Chen', event: 'Customer Contacted', note: 'Customer frustrated — no progress in 2 weeks.' },
      { id: 'A3', date: '2026-06-01', author: 'David Chen', event: 'Customer Contacted', note: 'Second contact. Customer threatening billing dispute.' },
    ],
  },

  // 15 — GNR, Repeat Customer, Completed
  {
    id: 'TR-2015',
    ticketName: 'TR-GNR-006 — Repeat GNR Issue (Chen)',
    customerName: 'Nora & Calvin Chen',
    customerPhone: '(518) 555-1577',
    customerAddress: '420 Maplewood Blvd, Rensselaer, NY 12144',
    hubspotContactId: 'HS-C-44215',
    hubspotContactLink: '#hs/contacts/44215',
    hubspotDealId: 'HS-D-89215',
    hubspotDealLink: '#hs/deals/89215',
    hubspotTicketId: 'HS-T-77315',
    hubspotTicketLink: '#hs/tickets/77315',
    paymentType: 'Cash Purchase', customerType: 'Residential', leaseDeal: false,
    ptoDate: '2021-04-10',
    monitoringPlatform: 'Enphase',
    systemId: 'EN-4421577',
    systemName: 'Chen — 8.8 kW System',
    enphaseSiteLink: '#enphase/systems/4421577',
    currentMonitoringStatus: 'Reporting',
    gatewayStatus: 'Online',
    lastEnphaseReportDate: '2026-06-14',
    repeatIssueCount: 3,
    previousTruckRollCount: 2,
    issueCategory: 'Gateway Not Reporting',
    truckRollReason: 'Third GNR incident. Previous gateway replaced twice. Suspected ISP-related recurring issue.',
    ticketCreatedDate: '2026-06-01',
    status: 'Completed',
    assignedTechnician: 'Mike Torres',
    truckRollOwner: 'Sarah Mitchell',
    siteAccessType: 'Customer Must Be Present',
    accessInstructions: 'Customer works from home. Easy access.',
    ladderRequired: false,
    specialEquipmentRequired: '',
    scheduledVisitDate: '2026-06-10',
    firstVisitDate: '2026-06-10',
    mostRecentVisitDate: '2026-06-10',
    completionDate: '2026-06-12',
    lastCustomerContactDate: '2026-06-12',
    nextFollowUpDate: '',
    partsRequired: false,
    pendingDeliveryOfItems: false,
    estimatedDeliveryDate: '',
    revisitRequired: false,
    revisitReason: '',
    revisitScheduledDate: '',
    numberOfVisits: 1,
    technicianNotes: 'Root cause identified: ISP modem firmware update causes DHCP conflict with Enphase gateway. Configured gateway with static IP — permanent fix.',
    nextSteps: 'Closed. Monitor for 60 days. Document static IP workaround in customer record.',
    enphaseCases: [],
    rmas: [],
    visits: [{
      id: 'V1', visitDate: '2026-06-10', technicianName: 'Mike Torres',
      outcomeNotes: 'Root cause found: ISP DHCP conflict. Assigned static IP to gateway. System fully operational.',
      issueIdentified: 'ISP modem firmware update causing DHCP lease conflict with IQ Gateway.',
      resolvedRemotely: false, revisitRequired: false, revisitReason: '',
      partsUsed: [],
      technicalNotes: 'Static IP 192.168.1.200 assigned to gateway. Confirmed with Spectrum ISP. No further conflicts expected.',
      customerUpdated: true, closeoutComplete: true, closeoutMissingFields: [],
    }],
    activityHistory: [
      { id: 'A1', date: '2026-06-01', author: 'System', event: 'Ticket Created', note: '3rd GNR incident for this customer.' },
      { id: 'A2', date: '2026-06-10', author: 'Mike Torres', event: 'Visit Completed', note: 'Static IP assigned — root cause resolved.' },
      { id: 'A3', date: '2026-06-12', author: 'Sarah Mitchell', event: 'Ticket Completed', note: 'Closed. Customer satisfied.' },
    ],
  },
];
