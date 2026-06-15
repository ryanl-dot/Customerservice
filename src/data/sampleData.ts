export type CaseType =
  | 'Billing'
  | 'Production'
  | 'Gateway Not Reporting'
  | 'Roof Leak'
  | 'Collections'
  | 'Complaint'
  | 'Utility Issue'
  | 'PTO Issue'
  | 'ACH Issue'
  | 'Cancellation';

export type CaseStatus =
  | 'New'
  | 'In Progress'
  | 'Waiting on Customer'
  | 'Waiting on Internal Team'
  | 'Truck Roll Scheduled'
  | 'Pending Approval'
  | 'Revisit Required'
  | 'Resolved'
  | 'Closed';

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type WaitingOn =
  | 'Installer'
  | 'Warehouse'
  | 'Engineering'
  | 'Billing'
  | 'Utility'
  | 'Customer'
  | 'Management'
  | 'Legal'
  | 'None';

export type EscalationType =
  | 'AG Complaint'
  | 'PSC Complaint'
  | 'NYSERDA Complaint'
  | 'BBB Complaint'
  | 'Attorney Mentioned'
  | 'Refund Request'
  | 'Media / NBC Responds'
  | 'Legal Threat';

export interface TimelineNote {
  id: string;
  date: string;
  author: string;
  note: string;
}

export interface CustomerCase {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  systemSize: string;
  installDate: string;
  caseType: CaseType;
  priority: Priority;
  status: CaseStatus;
  owner: string;
  dateOpened: string;
  lastUpdate: string;
  nextFollowUp: string;
  waitingOn: WaitingOn;
  hubspotLink: string;
  summary: string;
  rootCause: string;
  nextAction: string;
  escalations: EscalationType[];
  timeline: TimelineNote[];
  truckRollId?: string;
}

export interface TruckRoll {
  id: string;
  caseId: string;
  customerName: string;
  issueType: string;
  technician: string;
  visitDate: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Pending Approval' | 'Revisit Required' | 'Closed';
  outcome: string;
  revisitRequired: boolean;
  rmaRequired: boolean;
  rmaCaseNumber: string;
  troubleshootIssue: string;
  couldBeDoneRemotely: boolean | null;
  isRevisitNeeded: boolean | null;
  couldHaveBeenAvoided: boolean | null;
  avoidedDetails: string;
  nextSteps: string;
  customerUpdated: boolean;
}

export interface Notification {
  id: string;
  type: 'overdue' | 'truck_roll_scheduled' | 'truck_roll_completed' | 'truck_roll_missing_outcome' | 'customer_not_updated' | 'revisit_required' | 'internal_overdue' | 'escalation_detected';
  message: string;
  caseId: string;
  customerName: string;
  timestamp: string;
  read: boolean;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
}

export const OWNERS = ['Sarah Mitchell', 'James Rivera', 'Priya Patel', 'David Chen', 'Maria Lopez'];

export const cases: CustomerCase[] = [
  {
    id: 'CS-1001',
    customerName: 'Robert & Linda Hargrove',
    customerEmail: 'rhargrove@gmail.com',
    customerPhone: '(518) 555-0142',
    customerAddress: '14 Maple Ridge Dr, Albany, NY 12205',
    systemSize: '8.4 kW',
    installDate: '2023-04-12',
    caseType: 'Gateway Not Reporting',
    priority: 'High',
    status: 'Truck Roll Scheduled',
    owner: 'Sarah Mitchell',
    dateOpened: '2026-06-01',
    lastUpdate: '2026-06-11',
    nextFollowUp: '2026-06-15',
    waitingOn: 'Installer',
    hubspotLink: '#hubspot/CS-1001',
    summary: 'Customer gateway has not reported data to Enphase for 18 days. Remote reset attempts failed.',
    rootCause: 'Suspected gateway hardware failure. Customer confirmed power cycling did not resolve.',
    nextAction: 'Technician truck roll scheduled for June 15. Bring replacement gateway.',
    escalations: [],
    timeline: [
      { id: 't1', date: '2026-06-01', author: 'Sarah Mitchell', note: 'Case opened. Customer called reporting no data in Enphase app.' },
      { id: 't2', date: '2026-06-03', author: 'Sarah Mitchell', note: 'Attempted remote reset via Enphase portal. No response from gateway.' },
      { id: 't3', date: '2026-06-08', author: 'Sarah Mitchell', note: 'Escalated to engineering for remote diagnosis.' },
      { id: 't4', date: '2026-06-11', author: 'James Rivera', note: 'Engineering confirmed hardware issue. Scheduled truck roll for June 15.' },
    ],
    truckRollId: 'TR-1001',
  },
  {
    id: 'CS-1002',
    customerName: 'Patricia Weston',
    customerEmail: 'pweston@yahoo.com',
    customerPhone: '(716) 555-0278',
    customerAddress: '88 Sunfield Court, Buffalo, NY 14201',
    systemSize: '6.0 kW',
    installDate: '2022-07-20',
    caseType: 'Roof Leak',
    priority: 'Urgent',
    status: 'In Progress',
    owner: 'James Rivera',
    dateOpened: '2026-05-28',
    lastUpdate: '2026-06-10',
    nextFollowUp: '2026-06-14',
    waitingOn: 'Installer',
    hubspotLink: '#hubspot/CS-1002',
    summary: 'Customer reporting active roof leak around panel mounting area after heavy rain.',
    rootCause: 'Suspected improper flashing around roof penetrations from original installation.',
    nextAction: 'Installer team scheduled for inspection June 16. Customer must document leak with photos.',
    escalations: [],
    timeline: [
      { id: 't1', date: '2026-05-28', author: 'James Rivera', note: 'Urgent case opened. Customer reported water coming in through ceiling in living room.' },
      { id: 't2', date: '2026-05-29', author: 'James Rivera', note: 'Confirmed location aligns with panel row 2 mounting points.' },
      { id: 't3', date: '2026-06-02', author: 'James Rivera', note: 'Coordinated with installer for site visit.' },
      { id: 't4', date: '2026-06-10', author: 'James Rivera', note: 'Installer confirmed June 16 visit. Temporary tarp placed by customer.' },
    ],
    truckRollId: 'TR-1002',
  },
  {
    id: 'CS-1003',
    customerName: 'Gregory Fontaine',
    customerEmail: 'gfontaine@outlook.com',
    customerPhone: '(212) 555-0391',
    customerAddress: '22 Westview Blvd, New York, NY 10001',
    systemSize: '5.2 kW',
    installDate: '2021-11-05',
    caseType: 'Billing',
    priority: 'Medium',
    status: 'Waiting on Customer',
    owner: 'Priya Patel',
    dateOpened: '2026-06-03',
    lastUpdate: '2026-06-09',
    nextFollowUp: '2026-06-16',
    waitingOn: 'Customer',
    hubspotLink: '#hubspot/CS-1003',
    summary: 'Customer disputing monthly billing statement. Claims production credits not applied correctly.',
    rootCause: 'Billing system applied incorrect net metering rate from previous tariff schedule.',
    nextAction: 'Sent corrected invoice to customer. Awaiting confirmation and payment.',
    escalations: [],
    timeline: [
      { id: 't1', date: '2026-06-03', author: 'Priya Patel', note: 'Customer emailed billing dispute. Invoice shows $47 overcharge.' },
      { id: 't2', date: '2026-06-06', author: 'Priya Patel', note: 'Billing team confirmed error in rate application.' },
      { id: 't3', date: '2026-06-09', author: 'Priya Patel', note: 'Corrected invoice sent. Awaiting customer response.' },
    ],
  },
  {
    id: 'CS-1004',
    customerName: 'Angela & Thomas Reinholt',
    customerEmail: 'treinholt@gmail.com',
    customerPhone: '(315) 555-0147',
    customerAddress: '7 Pinecrest Lane, Syracuse, NY 13201',
    systemSize: '10.2 kW',
    installDate: '2023-09-14',
    caseType: 'Production',
    priority: 'High',
    status: 'Waiting on Internal Team',
    owner: 'David Chen',
    dateOpened: '2026-05-22',
    lastUpdate: '2026-06-08',
    nextFollowUp: '2026-06-15',
    waitingOn: 'Engineering',
    hubspotLink: '#hubspot/CS-1004',
    summary: 'System producing 38% below projected output for past 60 days. Customer concerned about ROI.',
    rootCause: 'Two microinverters confirmed failed by remote monitoring. Shading analysis pending.',
    nextAction: 'Engineering to complete shading analysis. RMA for 2 microinverters in process.',
    escalations: [],
    timeline: [
      { id: 't1', date: '2026-05-22', author: 'David Chen', note: 'Customer contacted re: low production alert from Enphase app.' },
      { id: 't2', date: '2026-05-27', author: 'David Chen', note: 'Remote analysis confirmed 2 failed microinverters (panels 4 and 7).' },
      { id: 't3', date: '2026-06-01', author: 'David Chen', note: 'RMA submitted to Enphase. Awaiting approval.' },
      { id: 't4', date: '2026-06-08', author: 'David Chen', note: 'Engineering shading analysis still pending. Followed up with team.' },
    ],
  },
  {
    id: 'CS-1005',
    customerName: 'Marcus Webb',
    customerEmail: 'mwebb55@hotmail.com',
    customerPhone: '(914) 555-0082',
    customerAddress: '156 Heritage Oak Rd, Yonkers, NY 10701',
    systemSize: '7.8 kW',
    installDate: '2022-03-18',
    caseType: 'Complaint',
    priority: 'Urgent',
    status: 'In Progress',
    owner: 'Maria Lopez',
    dateOpened: '2026-06-05',
    lastUpdate: '2026-06-12',
    nextFollowUp: '2026-06-15',
    waitingOn: 'Management',
    hubspotLink: '#hubspot/CS-1005',
    summary: 'Customer extremely upset about 3 missed appointments and unresolved production issue from March.',
    rootCause: 'Internal scheduling failure. Technician was reassigned without customer notification 3 times.',
    nextAction: 'Escalated to management. Director to call customer by EOD June 13.',
    escalations: ['BBB Complaint', 'Attorney Mentioned'],
    timeline: [
      { id: 't1', date: '2026-06-05', author: 'Maria Lopez', note: 'Customer called extremely angry. 3 missed appointments since March.' },
      { id: 't2', date: '2026-06-07', author: 'Maria Lopez', note: 'Customer mentioned contacting BBB and consulting an attorney.' },
      { id: 't3', date: '2026-06-10', author: 'Maria Lopez', note: 'Escalated to management. Director notified.' },
      { id: 't4', date: '2026-06-12', author: 'Maria Lopez', note: 'BBB complaint confirmed filed. Legal notified.' },
    ],
  },
  {
    id: 'CS-1006',
    customerName: 'Dorothy & Samuel Kim',
    customerEmail: 'dkim_solar@gmail.com',
    customerPhone: '(631) 555-0234',
    customerAddress: '34 Fairview Drive, Huntington, NY 11743',
    systemSize: '9.1 kW',
    installDate: '2021-06-22',
    caseType: 'PTO Issue',
    priority: 'High',
    status: 'Waiting on Internal Team',
    owner: 'Sarah Mitchell',
    dateOpened: '2026-05-15',
    lastUpdate: '2026-06-07',
    nextFollowUp: '2026-06-15',
    waitingOn: 'Utility',
    hubspotLink: '#hubspot/CS-1006',
    summary: 'PTO approval from PSEG has been pending for 47 days. System installed but not activated.',
    rootCause: 'PSEG backlog. Missing final interconnection agreement signature from utility side.',
    nextAction: 'Follow up with PSEG liaison. Confirm document submission status.',
    escalations: [],
    timeline: [
      { id: 't1', date: '2026-05-15', author: 'Sarah Mitchell', note: 'Customer called — system installed April 28 but no PTO issued.' },
      { id: 't2', date: '2026-05-22', author: 'Sarah Mitchell', note: 'Submitted PTO follow-up request to PSEG.' },
      { id: 't3', date: '2026-06-01', author: 'Sarah Mitchell', note: 'PSEG indicated missing document. Resubmitted interconnection agreement.' },
      { id: 't4', date: '2026-06-07', author: 'Sarah Mitchell', note: 'Still no approval. Escalating to utility liaison.' },
    ],
  },
  {
    id: 'CS-1007',
    customerName: 'Franklin Okafor',
    customerEmail: 'fokafor@gmail.com',
    customerPhone: '(347) 555-0511',
    customerAddress: '90 Crown Heights Blvd, Brooklyn, NY 11213',
    systemSize: '4.8 kW',
    installDate: '2024-01-10',
    caseType: 'ACH Issue',
    priority: 'Medium',
    status: 'In Progress',
    owner: 'Priya Patel',
    dateOpened: '2026-06-08',
    lastUpdate: '2026-06-13',
    nextFollowUp: '2026-06-17',
    waitingOn: 'Customer',
    hubspotLink: '#hubspot/CS-1007',
    summary: 'Customer ACH payment returned for June. Bank account appears to have changed.',
    rootCause: 'Customer switched banks. New routing and account numbers not updated in billing system.',
    nextAction: 'Sent ACH update form via email. Awaiting new banking information.',
    escalations: [],
    timeline: [
      { id: 't1', date: '2026-06-08', author: 'Priya Patel', note: 'ACH return notice received from billing. Called customer.' },
      { id: 't2', date: '2026-06-10', author: 'Priya Patel', note: 'Customer confirmed bank change. Sent update form.' },
      { id: 't3', date: '2026-06-13', author: 'Priya Patel', note: 'Following up — form not returned yet.' },
    ],
  },
  {
    id: 'CS-1008',
    customerName: 'Helen Trudeau',
    customerEmail: 'htrudeau@optonline.net',
    customerPhone: '(518) 555-0367',
    customerAddress: '203 Lakewood Terrace, Troy, NY 12180',
    systemSize: '6.6 kW',
    installDate: '2020-08-30',
    caseType: 'Utility Issue',
    priority: 'High',
    status: 'Waiting on Internal Team',
    owner: 'James Rivera',
    dateOpened: '2026-06-02',
    lastUpdate: '2026-06-11',
    nextFollowUp: '2026-06-15',
    waitingOn: 'Utility',
    hubspotLink: '#hubspot/CS-1008',
    summary: 'National Grid changed meter configuration and net metering credits stopped accumulating.',
    rootCause: 'Utility replaced smart meter without notifying installer. Meter CT ratio mismatch.',
    nextAction: 'Engineering to file formal meter dispute with National Grid.',
    escalations: ['PSC Complaint'],
    timeline: [
      { id: 't1', date: '2026-06-02', author: 'James Rivera', note: 'Customer noticed $0 credits for 3 weeks on utility bill.' },
      { id: 't2', date: '2026-06-05', author: 'James Rivera', note: 'Confirmed National Grid replaced meter May 12 without notice.' },
      { id: 't3', date: '2026-06-11', author: 'James Rivera', note: 'Customer filed PSC complaint. Engineering drafting dispute letter.' },
    ],
  },
  {
    id: 'CS-1009',
    customerName: 'Carlos & Rosa Medina',
    customerEmail: 'cmedina_solar@yahoo.com',
    customerPhone: '(845) 555-0189',
    customerAddress: '17 Orchid Way, Newburgh, NY 12550',
    systemSize: '11.5 kW',
    installDate: '2023-02-28',
    caseType: 'Cancellation',
    priority: 'High',
    status: 'Pending Approval',
    owner: 'Maria Lopez',
    dateOpened: '2026-06-09',
    lastUpdate: '2026-06-13',
    nextFollowUp: '2026-06-16',
    waitingOn: 'Management',
    hubspotLink: '#hubspot/CS-1009',
    summary: 'Customer requesting contract cancellation citing financial hardship after job loss.',
    rootCause: 'Customer lost employment. Cannot maintain monthly payments.',
    nextAction: 'Management review of hardship cancellation request. Legal review pending.',
    escalations: ['Refund Request'],
    timeline: [
      { id: 't1', date: '2026-06-09', author: 'Maria Lopez', note: 'Customer called requesting cancellation. Cited job loss.' },
      { id: 't2', date: '2026-06-11', author: 'Maria Lopez', note: 'Submitted hardship cancellation form to management.' },
      { id: 't3', date: '2026-06-13', author: 'Maria Lopez', note: 'Awaiting management and legal sign-off.' },
    ],
  },
  {
    id: 'CS-1010',
    customerName: 'Jennifer Blackwood',
    customerEmail: 'jblackwood@gmail.com',
    customerPhone: '(607) 555-0412',
    customerAddress: '5 Elmwood Circle, Ithaca, NY 14850',
    systemSize: '7.2 kW',
    installDate: '2022-05-16',
    caseType: 'Collections',
    priority: 'Urgent',
    status: 'In Progress',
    owner: 'Priya Patel',
    dateOpened: '2026-05-20',
    lastUpdate: '2026-06-12',
    nextFollowUp: '2026-06-15',
    waitingOn: 'Legal',
    hubspotLink: '#hubspot/CS-1010',
    summary: 'Account 4 months past due. Payment plan offered and rejected. Referred to collections.',
    rootCause: 'Customer claims production deficiency justifies withholding payment.',
    nextAction: 'Legal team handling collections proceeding. Do not contact customer.',
    escalations: ['Legal Threat', 'Attorney Mentioned'],
    timeline: [
      { id: 't1', date: '2026-05-20', author: 'Priya Patel', note: '4th consecutive missed payment. Account flagged.' },
      { id: 't2', date: '2026-05-28', author: 'Priya Patel', note: 'Customer rejected payment plan. Mentioned attorney.' },
      { id: 't3', date: '2026-06-05', author: 'Priya Patel', note: 'Referred to legal/collections.' },
      { id: 't4', date: '2026-06-12', author: 'Priya Patel', note: 'Legal confirmed proceeding initiated.' },
    ],
  },
  {
    id: 'CS-1011',
    customerName: 'William Ashby',
    customerEmail: 'washby@roadrunner.com',
    customerPhone: '(716) 555-0567',
    customerAddress: '44 Niagara Glen Rd, Niagara Falls, NY 14301',
    systemSize: '5.6 kW',
    installDate: '2021-09-07',
    caseType: 'Production',
    priority: 'Medium',
    status: 'Revisit Required',
    owner: 'David Chen',
    dateOpened: '2026-05-30',
    lastUpdate: '2026-06-10',
    nextFollowUp: '2026-06-18',
    waitingOn: 'Installer',
    hubspotLink: '#hubspot/CS-1011',
    summary: 'Truck roll completed June 10 but issue persists. One microinverter still shows offline.',
    rootCause: 'Initial truck roll replaced 1 of 2 failed microinverters. Second unit missed.',
    nextAction: 'Schedule revisit to replace second microinverter. RMA arrived June 12.',
    escalations: [],
    timeline: [
      { id: 't1', date: '2026-05-30', author: 'David Chen', note: 'Production alert — 2 panels offline.' },
      { id: 't2', date: '2026-06-05', author: 'David Chen', note: 'Truck roll completed. Tech replaced 1 microinverter.' },
      { id: 't3', date: '2026-06-10', author: 'David Chen', note: 'Monitoring shows 1 unit still offline. Revisit required.' },
    ],
    truckRollId: 'TR-1003',
  },
  {
    id: 'CS-1012',
    customerName: 'Brenda & Larry Nguyen',
    customerEmail: 'lnguyen_solar@gmail.com',
    customerPhone: '(914) 555-0698',
    customerAddress: '12 Foxwood Lane, White Plains, NY 10601',
    systemSize: '8.8 kW',
    installDate: '2023-06-01',
    caseType: 'Gateway Not Reporting',
    priority: 'Medium',
    status: 'Resolved',
    owner: 'Sarah Mitchell',
    dateOpened: '2026-06-04',
    lastUpdate: '2026-06-12',
    nextFollowUp: '',
    waitingOn: 'None',
    hubspotLink: '#hubspot/CS-1012',
    summary: 'Gateway offline for 5 days. Remote reboot resolved the issue.',
    rootCause: 'Gateway firmware update loop caused unresponsive state.',
    nextAction: 'Closed. Monitor for recurrence over 30 days.',
    escalations: [],
    timeline: [
      { id: 't1', date: '2026-06-04', author: 'Sarah Mitchell', note: 'Customer reported no data for 5 days.' },
      { id: 't2', date: '2026-06-06', author: 'Sarah Mitchell', note: 'Engineering performed remote factory reset.' },
      { id: 't3', date: '2026-06-12', author: 'Sarah Mitchell', note: 'Gateway reporting normally. Case resolved.' },
    ],
  },
  {
    id: 'CS-1013',
    customerName: 'Edward Callahan',
    customerEmail: 'ecallahan@verizon.net',
    customerPhone: '(631) 555-0723',
    customerAddress: '78 Harbor Lights Dr, Bay Shore, NY 11706',
    systemSize: '6.4 kW',
    installDate: '2022-10-11',
    caseType: 'Billing',
    priority: 'Low',
    status: 'New',
    owner: 'Priya Patel',
    dateOpened: '2026-06-13',
    lastUpdate: '2026-06-13',
    nextFollowUp: '2026-06-16',
    waitingOn: 'None',
    hubspotLink: '#hubspot/CS-1013',
    summary: 'Customer requesting copy of all billing statements from past 12 months.',
    rootCause: 'N/A — document request only.',
    nextAction: 'Pull billing history and email to customer.',
    escalations: [],
    timeline: [
      { id: 't1', date: '2026-06-13', author: 'Priya Patel', note: 'New case — customer needs billing history for tax purposes.' },
    ],
  },
  {
    id: 'CS-1014',
    customerName: 'Rosa Delgado',
    customerEmail: 'rdelgado22@gmail.com',
    customerPhone: '(718) 555-0834',
    customerAddress: '222 Sunnyside Ave, Queens, NY 11104',
    systemSize: '5.0 kW',
    installDate: '2023-12-05',
    caseType: 'Complaint',
    priority: 'High',
    status: 'In Progress',
    owner: 'Maria Lopez',
    dateOpened: '2026-06-10',
    lastUpdate: '2026-06-13',
    nextFollowUp: '2026-06-15',
    waitingOn: 'Management',
    hubspotLink: '#hubspot/CS-1014',
    summary: 'Customer complaining about installation crew leaving debris on property and damaging garden.',
    rootCause: 'Installation crew did not properly clean up site. Customer documented with photos.',
    nextAction: 'Manager to call customer. Arrange remediation and possible credit.',
    escalations: [],
    timeline: [
      { id: 't1', date: '2026-06-10', author: 'Maria Lopez', note: 'Customer called upset about installation damage to garden.' },
      { id: 't2', date: '2026-06-12', author: 'Maria Lopez', note: 'Customer emailed photos of damage.' },
      { id: 't3', date: '2026-06-13', author: 'Maria Lopez', note: 'Forwarded to management for remediation decision.' },
    ],
  },
  {
    id: 'CS-1015',
    customerName: 'Scott & Kim Patterson',
    customerEmail: 'spatterson@gmail.com',
    customerPhone: '(845) 555-0945',
    customerAddress: '56 Blue Ridge Rd, Kingston, NY 12401',
    systemSize: '12.0 kW',
    installDate: '2022-08-14',
    caseType: 'PTO Issue',
    priority: 'Medium',
    status: 'Waiting on Internal Team',
    owner: 'James Rivera',
    dateOpened: '2026-06-11',
    lastUpdate: '2026-06-13',
    nextFollowUp: '2026-06-17',
    waitingOn: 'Utility',
    hubspotLink: '#hubspot/CS-1015',
    summary: 'Con Edison interconnection approval delayed. Documents submitted 3 weeks ago.',
    rootCause: 'Con Edison queue backlog for 12kW+ systems in this region.',
    nextAction: 'Follow up with Con Edison interconnection team.',
    escalations: [],
    timeline: [
      { id: 't1', date: '2026-06-11', author: 'James Rivera', note: 'Customer called asking for PTO update.' },
      { id: 't2', date: '2026-06-13', author: 'James Rivera', note: 'Contacted Con Edison. Ticket in queue, estimated 2 more weeks.' },
    ],
  },
  {
    id: 'CS-1016',
    customerName: 'Nancy Genovese',
    customerEmail: 'ngenovese@icloud.com',
    customerPhone: '(516) 555-1012',
    customerAddress: '9 Coral Bay Ct, Massapequa, NY 11758',
    systemSize: '7.0 kW',
    installDate: '2021-04-20',
    caseType: 'Roof Leak',
    priority: 'Urgent',
    status: 'Truck Roll Scheduled',
    owner: 'James Rivera',
    dateOpened: '2026-06-12',
    lastUpdate: '2026-06-13',
    nextFollowUp: '2026-06-16',
    waitingOn: 'Installer',
    hubspotLink: '#hubspot/CS-1016',
    summary: 'New roof leak reported after heavy rain June 11. Possible flashing issue.',
    rootCause: 'Pending inspection.',
    nextAction: 'Emergency truck roll scheduled June 16.',
    escalations: [],
    timeline: [
      { id: 't1', date: '2026-06-12', author: 'James Rivera', note: 'Customer reported leak. Called after rainstorm.' },
      { id: 't2', date: '2026-06-13', author: 'James Rivera', note: 'Emergency truck roll scheduled June 16.' },
    ],
    truckRollId: 'TR-1004',
  },
  {
    id: 'CS-1017',
    customerName: 'Anthony Russo',
    customerEmail: 'arusso_ny@gmail.com',
    customerPhone: '(212) 555-1123',
    customerAddress: '301 Riverside Dr, New York, NY 10025',
    systemSize: '4.4 kW',
    installDate: '2023-03-08',
    caseType: 'ACH Issue',
    priority: 'Low',
    status: 'Resolved',
    owner: 'Priya Patel',
    dateOpened: '2026-06-06',
    lastUpdate: '2026-06-12',
    nextFollowUp: '',
    waitingOn: 'None',
    hubspotLink: '#hubspot/CS-1017',
    summary: 'Customer updated ACH info. June payment processed successfully.',
    rootCause: 'Customer closed old checking account without updating billing profile.',
    nextAction: 'Closed.',
    escalations: [],
    timeline: [
      { id: 't1', date: '2026-06-06', author: 'Priya Patel', note: 'ACH returned for June.' },
      { id: 't2', date: '2026-06-09', author: 'Priya Patel', note: 'Customer provided new ACH info.' },
      { id: 't3', date: '2026-06-12', author: 'Priya Patel', note: 'Payment reprocessed successfully. Case resolved.' },
    ],
  },
  {
    id: 'CS-1018',
    customerName: 'Diane & Paul Kowalski',
    customerEmail: 'pkowalski@optonline.net',
    customerPhone: '(716) 555-1189',
    customerAddress: '123 Maple Street, Cheektowaga, NY 14225',
    systemSize: '9.6 kW',
    installDate: '2020-11-17',
    caseType: 'Production',
    priority: 'Medium',
    status: 'New',
    owner: 'David Chen',
    dateOpened: '2026-06-13',
    lastUpdate: '2026-06-13',
    nextFollowUp: '2026-06-16',
    waitingOn: 'None',
    hubspotLink: '#hubspot/CS-1018',
    summary: 'Customer requested annual production review. System is 5.5 years old.',
    rootCause: 'Routine review — no confirmed issue yet.',
    nextAction: 'Pull Enphase report and compare to PVWatts estimate.',
    escalations: [],
    timeline: [
      { id: 't1', date: '2026-06-13', author: 'David Chen', note: 'Customer called requesting production review. Says production seems lower lately.' },
    ],
  },
  {
    id: 'CS-1019',
    customerName: 'Lawrence Tompkins',
    customerEmail: 'ltompkins@gmail.com',
    customerPhone: '(607) 555-1234',
    customerAddress: '88 Valley View Rd, Binghamton, NY 13901',
    systemSize: '8.0 kW',
    installDate: '2021-07-25',
    caseType: 'Utility Issue',
    priority: 'Medium',
    status: 'Waiting on Internal Team',
    owner: 'Sarah Mitchell',
    dateOpened: '2026-06-07',
    lastUpdate: '2026-06-11',
    nextFollowUp: '2026-06-15',
    waitingOn: 'Utility',
    hubspotLink: '#hubspot/CS-1019',
    summary: 'NYSEG applying wrong rate code for net metering. Customer overbilled for 2 months.',
    rootCause: 'NYSEG rate code change not reflected after meter upgrade last winter.',
    nextAction: 'Engineering to submit rate code correction request to NYSEG.',
    escalations: [],
    timeline: [
      { id: 't1', date: '2026-06-07', author: 'Sarah Mitchell', note: 'Customer noticed higher bills despite good production.' },
      { id: 't2', date: '2026-06-11', author: 'Sarah Mitchell', note: 'Confirmed wrong rate code on NYSEG account. Preparing correction request.' },
    ],
  },
  {
    id: 'CS-1020',
    customerName: 'Christine Belmont',
    customerEmail: 'cbelmont@yahoo.com',
    customerPhone: '(315) 555-1345',
    customerAddress: '15 Lakeshore Drive, Oswego, NY 13126',
    systemSize: '6.8 kW',
    installDate: '2022-12-01',
    caseType: 'Complaint',
    priority: 'High',
    status: 'In Progress',
    owner: 'Maria Lopez',
    dateOpened: '2026-06-11',
    lastUpdate: '2026-06-13',
    nextFollowUp: '2026-06-15',
    waitingOn: 'Management',
    hubspotLink: '#hubspot/CS-1020',
    summary: 'Customer threatening to contact local news after unresolved issues for 5 months.',
    rootCause: 'Multiple unresolved issues: billing error, production concern, no-show appointment.',
    nextAction: 'Director must call customer personally by June 15.',
    escalations: ['Media / NBC Responds'],
    timeline: [
      { id: 't1', date: '2026-06-11', author: 'Maria Lopez', note: 'Customer called furious. Mentioned NBC News consumer unit.' },
      { id: 't2', date: '2026-06-13', author: 'Maria Lopez', note: 'Escalated to director. Priority call scheduled.' },
    ],
  },
];

export const truckRolls: TruckRoll[] = [
  {
    id: 'TR-1001',
    caseId: 'CS-1001',
    customerName: 'Robert & Linda Hargrove',
    issueType: 'Gateway Not Reporting',
    technician: 'Mike Torres',
    visitDate: '2026-06-15',
    status: 'Scheduled',
    outcome: '',
    revisitRequired: false,
    rmaRequired: true,
    rmaCaseNumber: 'RMA-48821',
    troubleshootIssue: '',
    couldBeDoneRemotely: false,
    isRevisitNeeded: null,
    couldHaveBeenAvoided: null,
    avoidedDetails: '',
    nextSteps: 'Bring replacement Enphase IQ Gateway. Swap and test on-site.',
    customerUpdated: true,
  },
  {
    id: 'TR-1002',
    caseId: 'CS-1002',
    customerName: 'Patricia Weston',
    issueType: 'Roof Leak',
    technician: 'Carlos Reyes',
    visitDate: '2026-06-16',
    status: 'Scheduled',
    outcome: '',
    revisitRequired: false,
    rmaRequired: false,
    rmaCaseNumber: '',
    troubleshootIssue: '',
    couldBeDoneRemotely: false,
    isRevisitNeeded: null,
    couldHaveBeenAvoided: null,
    avoidedDetails: '',
    nextSteps: 'Inspect flashing around row 2 mounts. Apply butyl tape and reseal penetrations.',
    customerUpdated: true,
  },
  {
    id: 'TR-1003',
    caseId: 'CS-1011',
    customerName: 'William Ashby',
    issueType: 'Failed Microinverter',
    technician: 'Jason Park',
    visitDate: '2026-06-05',
    status: 'Revisit Required',
    outcome: 'Replaced 1 of 2 failed microinverters. Second unit was not accessible due to equipment issue.',
    revisitRequired: true,
    rmaRequired: true,
    rmaCaseNumber: 'RMA-48799',
    troubleshootIssue: 'Microinverter on panel 7 replaced. Panel 4 replacement deferred — ladder too short.',
    couldBeDoneRemotely: false,
    isRevisitNeeded: true,
    couldHaveBeenAvoided: true,
    avoidedDetails: 'Should have brought 32-ft ladder per original work order notes.',
    nextSteps: 'Return with correct ladder. Replace second microinverter on panel 4.',
    customerUpdated: false,
  },
  {
    id: 'TR-1004',
    caseId: 'CS-1016',
    customerName: 'Nancy Genovese',
    issueType: 'Roof Leak',
    technician: 'Carlos Reyes',
    visitDate: '2026-06-16',
    status: 'Scheduled',
    outcome: '',
    revisitRequired: false,
    rmaRequired: false,
    rmaCaseNumber: '',
    troubleshootIssue: '',
    couldBeDoneRemotely: false,
    isRevisitNeeded: null,
    couldHaveBeenAvoided: null,
    avoidedDetails: '',
    nextSteps: 'Emergency roof inspection. Bring all flashing supplies.',
    customerUpdated: true,
  },
  {
    id: 'TR-1005',
    caseId: 'CS-1012',
    customerName: 'Brenda & Larry Nguyen',
    issueType: 'Gateway Not Reporting',
    technician: 'Mike Torres',
    visitDate: '2026-06-06',
    status: 'Closed',
    outcome: 'Remote reboot resolved issue. No on-site visit required.',
    revisitRequired: false,
    rmaRequired: false,
    rmaCaseNumber: '',
    troubleshootIssue: 'Gateway firmware loop. Factory reset via Enphase remote tool fixed it.',
    couldBeDoneRemotely: true,
    isRevisitNeeded: false,
    couldHaveBeenAvoided: true,
    avoidedDetails: 'Could have been resolved remotely from the start. Truck roll was not needed.',
    nextSteps: 'Monitor for 30 days.',
    customerUpdated: true,
  },
  {
    id: 'TR-1006',
    caseId: 'CS-1004',
    customerName: 'Angela & Thomas Reinholt',
    issueType: 'Failed Microinverters',
    technician: 'Jason Park',
    visitDate: '2026-06-18',
    status: 'Scheduled',
    outcome: '',
    revisitRequired: false,
    rmaRequired: true,
    rmaCaseNumber: 'RMA-48845',
    troubleshootIssue: '',
    couldBeDoneRemotely: false,
    isRevisitNeeded: null,
    couldHaveBeenAvoided: null,
    avoidedDetails: '',
    nextSteps: 'Replace 2 microinverters on panels 4 and 7. RMA units in transit.',
    customerUpdated: true,
  },
  {
    id: 'TR-1007',
    caseId: 'CS-1019',
    customerName: 'Lawrence Tompkins',
    issueType: 'Utility Meter Issue',
    technician: 'Sam Wilson',
    visitDate: '2026-06-10',
    status: 'Completed',
    outcome: 'Verified system output and meter readings. Confirmed NYSEG meter CT ratio mismatch.',
    revisitRequired: false,
    rmaRequired: false,
    rmaCaseNumber: '',
    troubleshootIssue: 'CT ratio on new meter set to 200:5 instead of 400:5. Utility error.',
    couldBeDoneRemotely: false,
    isRevisitNeeded: false,
    couldHaveBeenAvoided: true,
    avoidedDetails: 'NYSEG should have coordinated meter upgrade with our team.',
    nextSteps: 'Engineering to submit formal NYSEG rate/meter correction request with test data.',
    customerUpdated: true,
  },
  {
    id: 'TR-1008',
    caseId: 'CS-1018',
    customerName: 'Diane & Paul Kowalski',
    issueType: 'Production Review',
    technician: 'Jason Park',
    visitDate: '2026-06-20',
    status: 'Scheduled',
    outcome: '',
    revisitRequired: false,
    rmaRequired: false,
    rmaCaseNumber: '',
    troubleshootIssue: '',
    couldBeDoneRemotely: null,
    isRevisitNeeded: null,
    couldHaveBeenAvoided: null,
    avoidedDetails: '',
    nextSteps: 'Inspect panels, check microinverter health report, clean panels if needed.',
    customerUpdated: false,
  },
  {
    id: 'TR-1009',
    caseId: 'CS-1005',
    customerName: 'Marcus Webb',
    issueType: 'Production + Complaint',
    technician: 'Mike Torres',
    visitDate: '2026-05-15',
    status: 'Completed',
    outcome: 'Visited but customer refused entry due to prior no-shows. No work performed.',
    revisitRequired: true,
    rmaRequired: false,
    rmaCaseNumber: '',
    troubleshootIssue: 'Could not access system. Customer hostile at door.',
    couldBeDoneRemotely: false,
    isRevisitNeeded: true,
    couldHaveBeenAvoided: true,
    avoidedDetails: 'Prior 3 missed appointments caused customer to lose trust. Should have sent manager.',
    nextSteps: 'Director to call customer before next visit. Rebuild trust first.',
    customerUpdated: false,
  },
  {
    id: 'TR-1010',
    caseId: 'CS-1014',
    customerName: 'Rosa Delgado',
    issueType: 'Complaint — Property Damage',
    technician: 'Carlos Reyes',
    visitDate: '2026-06-17',
    status: 'Scheduled',
    outcome: '',
    revisitRequired: false,
    rmaRequired: false,
    rmaCaseNumber: '',
    troubleshootIssue: '',
    couldBeDoneRemotely: false,
    isRevisitNeeded: null,
    couldHaveBeenAvoided: null,
    avoidedDetails: '',
    nextSteps: 'Document property damage, remove debris, assess garden damage for compensation.',
    customerUpdated: false,
  },
];

export const notifications: Notification[] = [
  { id: 'N-001', type: 'overdue', message: 'CS-1006 (Dorothy & Samuel Kim) — Follow-up overdue by 8 days', caseId: 'CS-1006', customerName: 'Dorothy & Samuel Kim', timestamp: '2026-06-15T08:00:00', read: false },
  { id: 'N-002', type: 'truck_roll_scheduled', message: 'TR-1001 — Truck roll scheduled for Robert & Linda Hargrove today (June 15)', caseId: 'CS-1001', customerName: 'Robert & Linda Hargrove', timestamp: '2026-06-15T07:30:00', read: false },
  { id: 'N-003', type: 'truck_roll_missing_outcome', message: 'TR-1009 — Truck roll completed May 15 with no outcome filed for Marcus Webb', caseId: 'CS-1005', customerName: 'Marcus Webb', timestamp: '2026-06-15T08:15:00', read: false },
  { id: 'N-004', type: 'customer_not_updated', message: 'TR-1003 — Customer William Ashby not updated after truck roll (June 5)', caseId: 'CS-1011', customerName: 'William Ashby', timestamp: '2026-06-15T08:30:00', read: false },
  { id: 'N-005', type: 'revisit_required', message: 'CS-1011 (William Ashby) — Revisit required after incomplete truck roll', caseId: 'CS-1011', customerName: 'William Ashby', timestamp: '2026-06-10T16:00:00', read: true },
  { id: 'N-006', type: 'escalation_detected', message: 'CS-1020 — Escalation keyword detected: "NBC News" in case notes for Christine Belmont', caseId: 'CS-1020', customerName: 'Christine Belmont', timestamp: '2026-06-11T10:45:00', read: false },
  { id: 'N-007', type: 'escalation_detected', message: 'CS-1005 — Escalation keyword: "attorney" mentioned by Marcus Webb', caseId: 'CS-1005', customerName: 'Marcus Webb', timestamp: '2026-06-07T14:00:00', read: true },
  { id: 'N-008', type: 'internal_overdue', message: 'CS-1004 (Angela & Thomas Reinholt) — Engineering follow-up overdue 7 days', caseId: 'CS-1004', customerName: 'Angela & Thomas Reinholt', timestamp: '2026-06-15T08:00:00', read: false },
  { id: 'N-009', type: 'truck_roll_scheduled', message: 'TR-1002 — Truck roll scheduled for Patricia Weston tomorrow (June 16)', caseId: 'CS-1002', customerName: 'Patricia Weston', timestamp: '2026-06-15T09:00:00', read: false },
  { id: 'N-010', type: 'overdue', message: 'CS-1010 (Jennifer Blackwood) — Follow-up overdue by 26 days', caseId: 'CS-1010', customerName: 'Jennifer Blackwood', timestamp: '2026-06-15T08:00:00', read: true },
];

export const templates: Template[] = [
  {
    id: 'T-001',
    name: 'ACH Update Request',
    category: 'Billing',
    subject: 'Action Required: Update Your ACH Payment Information',
    body: `Dear [Customer Name],

We recently received a notice that your ACH payment could not be processed. This is often due to a bank account change or updated routing/account numbers.

To keep your account in good standing, please update your payment information by clicking the link below or calling us at [Phone Number].

[ACH Update Link]

If you have already updated your information, please disregard this notice. If you have any questions, our team is happy to assist.

Thank you,
[Your Name]
Customer Service | [Company Name]`,
  },
  {
    id: 'T-002',
    name: 'Billing Explanation',
    category: 'Billing',
    subject: 'Explanation of Your Recent Solar Bill',
    body: `Dear [Customer Name],

Thank you for reaching out about your recent billing statement. We want to make sure everything is clear.

Here is a breakdown of your current invoice:
- Solar Loan / Lease Payment: $[Amount]
- Net Metering Credit Applied: -$[Credit]
- Adjusted Balance: $[Balance]

Your credits are calculated based on the energy your system exported to the grid during [Month]. These credits are applied directly by your utility, [Utility Name], and may appear on a separate utility statement.

If you have additional questions or believe there is an error, please don't hesitate to contact us.

Best regards,
[Your Name]
Customer Service | [Company Name]`,
  },
  {
    id: 'T-003',
    name: 'Roof Leak Follow-Up',
    category: 'Roof Leak',
    subject: 'Update on Your Roof Leak Investigation — Case [Case ID]',
    body: `Dear [Customer Name],

I'm following up on your reported roof leak (Case [Case ID]). We take this matter very seriously and want to ensure it is resolved as quickly as possible.

Current Status: [Status]
Scheduled Visit: [Date/Time]
Technician: [Technician Name]

Please ensure someone is home during the scheduled visit window. Our technician will inspect the mounting hardware, flashing, and all roof penetrations associated with your solar installation.

If your situation changes or you need to reschedule, please call us at [Phone Number] as soon as possible.

Thank you for your patience,
[Your Name]
Customer Service | [Company Name]`,
  },
  {
    id: 'T-004',
    name: 'Truck Roll Scheduling',
    category: 'Truck Roll',
    subject: 'Service Visit Scheduled — [Date]',
    body: `Dear [Customer Name],

We have scheduled a service visit to address your recent concern (Case [Case ID]).

Appointment Details:
- Date: [Date]
- Time Window: [Time Window]
- Technician: [Technician Name]
- Purpose: [Issue Description]

Please ensure someone 18 or older is available to provide access to the electrical panel and roof/attic area.

To reschedule, please contact us at least 24 hours in advance at [Phone Number].

See you soon,
[Your Name]
Customer Service | [Company Name]`,
  },
  {
    id: 'T-005',
    name: 'Missed Appointment',
    category: 'Truck Roll',
    subject: 'We Missed You — Rescheduling Your Service Visit',
    body: `Dear [Customer Name],

Our technician arrived at your property on [Date] for your scheduled service visit but was unable to make contact.

We understand schedules change and we'd be happy to reschedule at your convenience.

Please call us at [Phone Number] or reply to this email to set up a new appointment time.

We apologize for any inconvenience and look forward to resolving your issue as soon as possible.

Best regards,
[Your Name]
Customer Service | [Company Name]`,
  },
  {
    id: 'T-006',
    name: 'Gateway Not Reporting — Troubleshooting',
    category: 'Technical',
    subject: 'Troubleshooting Your Enphase Gateway — Case [Case ID]',
    body: `Dear [Customer Name],

Thank you for reporting that your Enphase gateway is not sending data. Here are a few quick troubleshooting steps you can try before we schedule a service visit:

1. Locate your Enphase IQ Gateway (usually near your electrical panel or router).
2. Check that the power light is solid green.
3. Check that the internet/WiFi light is solid green.
4. If either light is off or flashing, try restarting your router and gateway by unplugging both, waiting 60 seconds, then plugging the router in first, followed by the gateway.
5. Allow 15–20 minutes for the system to reconnect.

If the lights return to normal, your data should resume reporting within the hour. If the issue persists, please let us know and we will arrange a service visit.

Thank you,
[Your Name]
Customer Service | [Company Name]`,
  },
  {
    id: 'T-007',
    name: 'Production Review Update',
    category: 'Production',
    subject: 'Update on Your Solar Production Review — Case [Case ID]',
    body: `Dear [Customer Name],

We have completed our review of your system's production data for the period [Date Range].

Summary of Findings:
- Expected Production: [Expected kWh]
- Actual Production: [Actual kWh]
- Variance: [Variance %]

[If Issue Found]: Our analysis identified [specific issue]. We are taking the following steps to resolve this: [Steps].

[If No Issue]: Your system is performing within the normal range for this time of year. Seasonal factors such as shorter days and cloud cover can affect production during [Season].

If you have further questions, please don't hesitate to reach out.

Best regards,
[Your Name]
Customer Service | [Company Name]`,
  },
  {
    id: 'T-008',
    name: 'Waiting on Installer Update',
    category: 'Internal',
    subject: 'Update on Your Case — Awaiting Installer Confirmation',
    body: `Dear [Customer Name],

I wanted to provide you with a quick update on Case [Case ID].

We are currently working with our installation team to [specific action — schedule a visit / obtain documentation / complete the repair]. We expect to have a confirmed update for you by [Date].

We appreciate your patience and want to assure you that your case is actively being managed.

Please feel free to reach out with any questions in the meantime.

Thank you,
[Your Name]
Customer Service | [Company Name]`,
  },
  {
    id: 'T-009',
    name: 'Complaint Acknowledgment',
    category: 'Complaint',
    subject: 'We Hear You — Acknowledgment of Your Concern',
    body: `Dear [Customer Name],

Thank you for taking the time to share your experience with us. I sincerely apologize that we have not met your expectations. Your feedback matters, and I want you to know that your concern is being treated as a priority.

I have personally reviewed your case and will be directly overseeing its resolution. Here is what we are doing immediately:

1. [Action 1]
2. [Action 2]
3. [Action 3]

I will follow up with you by [Date/Time] with a full update. You are also welcome to contact me directly at [Phone Number] or [Email].

Again, I sincerely apologize for the frustration this has caused.

Respectfully,
[Your Name]
[Title] | [Company Name]`,
  },
  {
    id: 'T-010',
    name: 'Cancellation Warning',
    category: 'Cancellation',
    subject: 'Important: Before You Cancel Your Solar Agreement',
    body: `Dear [Customer Name],

We received your request regarding cancellation of your solar agreement. Before we proceed, we want to make sure you have all the information available.

Cancelling your agreement may result in:
- Early termination fees as outlined in Section [X] of your contract
- Loss of net metering credits
- Removal costs for the solar equipment

We also want to understand if there is something we can do to address your concerns. Many issues — including billing questions, performance concerns, or service delays — can be resolved without cancellation.

Please call us at [Phone Number] so we can discuss your options before any action is taken.

We value you as a customer and want to find a solution that works for you.

Sincerely,
[Your Name]
Customer Service | [Company Name]`,
  },
];
