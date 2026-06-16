// Mock KPI data for the Admin KPI Center
// All data is pre-calculated for the period ending June 15, 2026

export interface WeeklyPoint  { week: string;  value: number }
export interface MonthlyPoint { month: string; value: number }

// ── Ticket Closure Rate ──────────────────────────────────────────────────────

export const closureWeekly: WeeklyPoint[] = [
  { week: 'Jan W1', value: 18 }, { week: 'Jan W2', value: 22 }, { week: 'Jan W3', value: 19 },
  { week: 'Jan W4', value: 25 }, { week: 'Feb W1', value: 21 }, { week: 'Feb W2', value: 17 },
  { week: 'Feb W3', value: 23 }, { week: 'Feb W4', value: 20 }, { week: 'Mar W1', value: 26 },
  { week: 'Mar W2', value: 24 }, { week: 'Mar W3', value: 28 }, { week: 'Mar W4', value: 22 },
  { week: 'Apr W1', value: 30 }, { week: 'Apr W2', value: 27 }, { week: 'Apr W3', value: 25 },
  { week: 'Apr W4', value: 31 }, { week: 'May W1', value: 29 }, { week: 'May W2', value: 33 },
  { week: 'May W3', value: 28 }, { week: 'May W4', value: 35 }, { week: 'Jun W1', value: 32 },
  { week: 'Jun W2', value: 14 },
];

export const closureMonthly: MonthlyPoint[] = [
  { month: 'Jan', value: 84 }, { month: 'Feb', value: 81 }, { month: 'Mar', value: 100 },
  { month: 'Apr', value: 113 }, { month: 'May', value: 125 }, { month: 'Jun', value: 46 },
];

export const ticketClosureSummary = {
  weeklyClosedThisWeek: 14,
  weeklyClosedLastWeek: 32,
  monthlyClosedThisMonth: 46,
  monthlyClosedLastMonth: 125,
};

// ── Average Resolution Time ──────────────────────────────────────────────────

export interface ResolutionByType {
  type: string; avgDays: number; goalDays: number;
  trend: MonthlyPoint[];
}

export const resolutionByType: ResolutionByType[] = [
  {
    type: 'Billing', goalDays: 7, avgDays: 5.2,
    trend: [
      { month: 'Jan', value: 6.8 }, { month: 'Feb', value: 7.1 }, { month: 'Mar', value: 6.2 },
      { month: 'Apr', value: 5.9 }, { month: 'May', value: 5.4 }, { month: 'Jun', value: 5.2 },
    ],
  },
  {
    type: 'Production', goalDays: 14, avgDays: 16.4,
    trend: [
      { month: 'Jan', value: 18.2 }, { month: 'Feb', value: 17.8 }, { month: 'Mar', value: 17.1 },
      { month: 'Apr', value: 16.9 }, { month: 'May', value: 16.7 }, { month: 'Jun', value: 16.4 },
    ],
  },
  {
    type: 'Truck Roll', goalDays: 21, avgDays: 19.1,
    trend: [
      { month: 'Jan', value: 24.3 }, { month: 'Feb', value: 23.1 }, { month: 'Mar', value: 21.8 },
      { month: 'Apr', value: 20.9 }, { month: 'May', value: 19.8 }, { month: 'Jun', value: 19.1 },
    ],
  },
];

export const resolutionOverall: MonthlyPoint[] = [
  { month: 'Jan', value: 14.2 }, { month: 'Feb', value: 13.8 }, { month: 'Mar', value: 13.1 },
  { month: 'Apr', value: 12.7 }, { month: 'May', value: 12.3 }, { month: 'Jun', value: 12.0 },
];

// ── Aging Ticket Percentage ──────────────────────────────────────────────────

export const agingStats = {
  totalOpen: 14,
  over7Days:  { count: 9,  pct: 64.3 },
  over14Days: { count: 6,  pct: 42.9 },
  over30Days: { count: 2,  pct: 14.3 },
  goal30DayPct: 10,
};

export const agingTrend: MonthlyPoint[] = [
  { month: 'Jan', value: 22.1 }, { month: 'Feb', value: 20.3 }, { month: 'Mar', value: 18.7 },
  { month: 'Apr', value: 17.2 }, { month: 'May', value: 15.4 }, { month: 'Jun', value: 14.3 },
];

// ── Follow-Up Compliance ─────────────────────────────────────────────────────

export const followUpCompliance = {
  required: 42,
  completed: 36,
  missed: 4,
  overdue: 2,
  pct: 85.7,
  goal: 100,
};

export const followUpTrend: MonthlyPoint[] = [
  { month: 'Jan', value: 78.2 }, { month: 'Feb', value: 80.1 }, { month: 'Mar', value: 82.4 },
  { month: 'Apr', value: 84.0 }, { month: 'May', value: 85.3 }, { month: 'Jun', value: 85.7 },
];

// ── Production Concern Resolution Rate ──────────────────────────────────────

export const productionResolution = {
  total: 28,
  resolved: 25,
  escalated: 3,
  pct: 89.3,
  goal: 85,
};

export const productionTrend: MonthlyPoint[] = [
  { month: 'Jan', value: 79.1 }, { month: 'Feb', value: 81.3 }, { month: 'Mar', value: 83.5 },
  { month: 'Apr', value: 85.7 }, { month: 'May', value: 87.9 }, { month: 'Jun', value: 89.3 },
];

// ── Truck Roll Completion Rate ───────────────────────────────────────────────

export const truckRollCompletion = {
  scheduled: 10,
  completed: 6,
  pct: 60.0,
  goal: 95,
};

export const truckRollCompletionTrend: MonthlyPoint[] = [
  { month: 'Jan', value: 88.2 }, { month: 'Feb', value: 90.1 }, { month: 'Mar', value: 92.3 },
  { month: 'Apr', value: 91.7 }, { month: 'May', value: 93.4 }, { month: 'Jun', value: 60.0 },
];

// ── Truck Roll Revisit Rate ──────────────────────────────────────────────────

export const truckRollRevisit = {
  completed: 6,
  revisitRequired: 2,
  pct: 33.3,
  goal: 15,
};

export const revisitTrend: MonthlyPoint[] = [
  { month: 'Jan', value: 28.1 }, { month: 'Feb', value: 25.4 }, { month: 'Mar', value: 22.1 },
  { month: 'Apr', value: 19.8 }, { month: 'May', value: 18.2 }, { month: 'Jun', value: 33.3 },
];

// ── GNR Remote Resolution Rate ───────────────────────────────────────────────

export const gnrResolution = {
  total: 8,
  resolvedRemotely: 4,
  truckRollsAvoided: 4,
  pct: 50.0,
  goal: 40,
  estimatedSavingsPerTR: 450,
};

export const gnrTrend: MonthlyPoint[] = [
  { month: 'Jan', value: 32.4 }, { month: 'Feb', value: 35.1 }, { month: 'Mar', value: 38.7 },
  { month: 'Apr', value: 41.2 }, { month: 'May', value: 46.3 }, { month: 'Jun', value: 50.0 },
];

// ── Documentation Accuracy ───────────────────────────────────────────────────

export const docAccuracy = {
  audited: 20,
  complete: 17,
  pct: 85.0,
  goal: 95,
  missingFields: {
    'Customer Concern': 1,
    'Root Cause': 2,
    'Next Steps': 0,
    'Follow-Up Date': 3,
  },
};

export const docAccuracyHistory: MonthlyPoint[] = [
  { month: 'Jan', value: 72.1 }, { month: 'Feb', value: 75.4 }, { month: 'Mar', value: 78.9 },
  { month: 'Apr', value: 81.2 }, { month: 'May', value: 83.7 }, { month: 'Jun', value: 85.0 },
];

// ── Ticket Audit Score ───────────────────────────────────────────────────────

export interface AuditScore {
  month: string;
  accuracy: number;
  professionalism: number;
  followUpQuality: number;
  resolutionQuality: number;
  overall: number;
}

export const auditScores: AuditScore[] = [
  { month: 'Jan', accuracy: 82, professionalism: 91, followUpQuality: 78, resolutionQuality: 80, overall: 83 },
  { month: 'Feb', accuracy: 84, professionalism: 92, followUpQuality: 80, resolutionQuality: 82, overall: 85 },
  { month: 'Mar', accuracy: 86, professionalism: 93, followUpQuality: 83, resolutionQuality: 84, overall: 87 },
  { month: 'Apr', accuracy: 88, professionalism: 94, followUpQuality: 85, resolutionQuality: 86, overall: 88 },
  { month: 'May', accuracy: 89, professionalism: 95, followUpQuality: 87, resolutionQuality: 88, overall: 90 },
  { month: 'Jun', accuracy: 90, professionalism: 96, followUpQuality: 88, resolutionQuality: 89, overall: 91 },
];

// ── First Response Time ──────────────────────────────────────────────────────

export const firstResponse = {
  avgHours: 3.2,
  goal: 4,
  slaCompliance: 87.5,
};

export const firstResponseTrend: MonthlyPoint[] = [
  { month: 'Jan', value: 5.8 }, { month: 'Feb', value: 5.2 }, { month: 'Mar', value: 4.7 },
  { month: 'Apr', value: 4.1 }, { month: 'May', value: 3.6 }, { month: 'Jun', value: 3.2 },
];

// ── Ticket Reopen Rate ───────────────────────────────────────────────────────

export const reopenRate = {
  closed: 125,
  reopened: 4,
  pct: 3.2,
  goal: 5,
};

export const reopenTrend: MonthlyPoint[] = [
  { month: 'Jan', value: 6.2 }, { month: 'Feb', value: 5.8 }, { month: 'Mar', value: 5.1 },
  { month: 'Apr', value: 4.4 }, { month: 'May', value: 3.7 }, { month: 'Jun', value: 3.2 },
];

// ── Escalation Rate ──────────────────────────────────────────────────────────

export const escalationRate = {
  total: 125,
  escalated: 5,
  pct: 4.0,
  goal: 5,
};

export const escalationTrend: MonthlyPoint[] = [
  { month: 'Jan', value: 7.2 }, { month: 'Feb', value: 6.8 }, { month: 'Mar', value: 5.9 },
  { month: 'Apr', value: 5.3 }, { month: 'May', value: 4.6 }, { month: 'Jun', value: 4.0 },
];

// ── Collection Recovery Rate ─────────────────────────────────────────────────

export const collectionRecovery = {
  delinquent: 12,
  recovered: 9,
  pct: 75.0,
  amountRecovered: 14820,
  amountTotal: 19760,
};

export const collectionTrend: MonthlyPoint[] = [
  { month: 'Jan', value: 58.3 }, { month: 'Feb', value: 61.7 }, { month: 'Mar', value: 65.2 },
  { month: 'Apr', value: 68.4 }, { month: 'May', value: 71.9 }, { month: 'Jun', value: 75.0 },
];

// ── Monthly Scorecard ────────────────────────────────────────────────────────

export interface ScorecardEntry {
  month: string;
  csat: number;
  firstResponse: number;
  followUpCompliance: number;
  resolutionTime: number;
  docAccuracy: number;
  collectionRecovery: number;
  escalationRate: number;
  reopenRate: number;
  weighted: number;
  grade: string;
}

function weightedScore(e: Omit<ScorecardEntry, 'weighted' | 'grade'>): number {
  return Math.round(
    e.csat              * 0.20 +
    e.firstResponse     * 0.10 +
    e.followUpCompliance* 0.20 +
    e.resolutionTime    * 0.15 +
    e.docAccuracy       * 0.10 +
    e.collectionRecovery* 0.15 +
    e.escalationRate    * 0.05 +
    e.reopenRate        * 0.05
  );
}

function grade(score: number): string {
  if (score >= 95) return 'A';
  if (score >= 90) return 'B';
  if (score >= 80) return 'C';
  if (score >= 70) return 'D';
  return 'F';
}

const rawScores = [
  { month: 'Jan', csat: 74, firstResponse: 60, followUpCompliance: 78, resolutionTime: 70, docAccuracy: 72, collectionRecovery: 58, escalationRate: 65, reopenRate: 63 },
  { month: 'Feb', csat: 76, firstResponse: 65, followUpCompliance: 80, resolutionTime: 72, docAccuracy: 75, collectionRecovery: 62, escalationRate: 68, reopenRate: 67 },
  { month: 'Mar', csat: 79, firstResponse: 71, followUpCompliance: 82, resolutionTime: 75, docAccuracy: 79, collectionRecovery: 65, escalationRate: 72, reopenRate: 71 },
  { month: 'Apr', csat: 82, firstResponse: 76, followUpCompliance: 84, resolutionTime: 78, docAccuracy: 81, collectionRecovery: 68, escalationRate: 76, reopenRate: 75 },
  { month: 'May', csat: 86, firstResponse: 82, followUpCompliance: 85, resolutionTime: 82, docAccuracy: 84, collectionRecovery: 72, escalationRate: 80, reopenRate: 79 },
  { month: 'Jun', csat: 88, firstResponse: 86, followUpCompliance: 86, resolutionTime: 85, docAccuracy: 85, collectionRecovery: 75, escalationRate: 84, reopenRate: 82 },
];

export const scorecard: ScorecardEntry[] = rawScores.map(e => {
  const w = weightedScore(e);
  return { ...e, weighted: w, grade: grade(w) };
});

export const quarterlyScore = Math.round(
  scorecard.slice(-3).reduce((s, e) => s + e.weighted, 0) / 3
);
export const annualScore = Math.round(
  scorecard.reduce((s, e) => s + e.weighted, 0) / scorecard.length
);

// ── Executive Dashboard metrics ──────────────────────────────────────────────

export const execMetrics = [
  { label: 'Open Tickets',           value: '14',    unit: '',    goal: null,      status: 'neutral' },
  { label: 'Due Today',              value: '4',     unit: '',    goal: null,      status: 'warn' },
  { label: 'Over SLA',               value: '2',     unit: '',    goal: '0',       status: 'bad' },
  { label: 'Avg Resolution',         value: '12.0',  unit: 'days',goal: '<14d',    status: 'good' },
  { label: 'TR Completion',          value: '60%',   unit: '',    goal: '95%',     status: 'bad' },
  { label: 'TR Revisit Rate',        value: '33.3%', unit: '',    goal: '<15%',    status: 'bad' },
  { label: 'GNR Remote Res.',        value: '50%',   unit: '',    goal: '40%+',    status: 'good' },
  { label: 'Doc Accuracy',           value: '85%',   unit: '',    goal: '95%',     status: 'warn' },
  { label: 'Follow-Up Compliance',   value: '85.7%', unit: '',    goal: '100%',    status: 'warn' },
  { label: 'Monthly Score',          value: '84',    unit: 'pts', goal: '90+',     status: 'warn' },
] as const;
