import type { CustomerCase, TruckRoll } from '../data/sampleData';
import {
  daysOpen, isOverdue, isDueToday, hasNoRecentUpdate, computeRisk,
  needsCustomerUpdateAfterTruckRoll,
} from './caseLogic';

// Single source of truth for all shared KPI calculations.
// Every dashboard page imports from here — no page maintains its own formulas.
//
// ─────────────────────────────────────────────────────────────────────────────
// KPI DICTIONARY (plain English) — Phase 1 reconciliation
// Reference date ("today"): 2026-06-15 (TODAY in caseLogic.ts). Case KPIs use the
// `cases` array; the TR KPIs below use the legacy `truckRolls` array.
// NOTE: the Truck Roll Center uses the richer `truckRollRecords` dataset; those two
// truck-roll populations are NOT yet unified — see the PHASE-1 NOTE at the TR
// section and the scope labels in the UI.
//
// Open Cases     — count of cases with status ≠ 'Closed' and ≠ 'Resolved'.
// Due Today      — open cases with nextFollowUp == today.
// Overdue        — open cases with nextFollowUp < today.
// SLA Breached   — open cases with daysOpen > SLA_DAYS (14).
// Avg Days Open  — mean daysOpen across OPEN cases only (1 dp).
// Follow-Up Compliance (%) — (open cases NOT overdue) / (all open cases) × 100.
// Escalation Rate (%)  ← Phase 1 fix
//   Numerator: ALL cases (any status) with ≥1 escalation flag.
//   Denominator: ALL cases (any status). ×100, 1 dp. Population: open + closed.
//   Same definition feeds the KPI Center card, its tiles, and the Monthly Score
//   "Escalation-Free Rate" component (= 100 − Escalation Rate).
// TR Completion Rate (%)    = Completed TRs / all TRs × 100.
// TR Revisit Rate (%)       = TRs with revisitRequired flag / all TRs × 100.
// GNR Remote Resolution (%) = GNR TRs flagged couldBeDoneRemotely / all GNR TRs × 100.
// Monthly Score (0–100 + grade) — weighted blend in getMonthlyScore(). Doc Accuracy
//   is a fixed constant (no audit field in data) and is labeled illustrative. This is
//   the ONLY Monthly Score; historical Jan–May figures in the scorecard are
//   illustrative seed data, explicitly labeled as such in the UI.
// ─────────────────────────────────────────────────────────────────────────────

export const SLA_DAYS = 14;

// ── Case KPIs ─────────────────────────────────────────────────────────────────

export function getOpenCases(cases: CustomerCase[]) {
  return cases.filter(c => c.status !== 'Closed' && c.status !== 'Resolved');
}

export function getDueTodayCases(cases: CustomerCase[]) {
  return getOpenCases(cases).filter(isDueToday);
}

export function getOverdueCases(cases: CustomerCase[]) {
  return getOpenCases(cases).filter(isOverdue);
}

export function getSLABreachedCases(cases: CustomerCase[]) {
  return getOpenCases(cases).filter(c => daysOpen(c) > SLA_DAYS);
}

export function getHighPriorityCases(cases: CustomerCase[]) {
  return getOpenCases(cases).filter(c => c.priority === 'High' || c.priority === 'Urgent');
}

export function getCriticalRiskCases(cases: CustomerCase[], truckRolls: TruckRoll[]) {
  return getOpenCases(cases).filter(c => {
    const tr = truckRolls.find(t => t.id === c.truckRollId);
    return computeRisk(c, tr).level === 'Critical';
  });
}

export function getHighRiskCases(cases: CustomerCase[], truckRolls: TruckRoll[]) {
  return getOpenCases(cases).filter(c => {
    const tr = truckRolls.find(t => t.id === c.truckRollId);
    return computeRisk(c, tr).level === 'High';
  });
}

export function getWaitingOnInternalCases(cases: CustomerCase[]) {
  return getOpenCases(cases).filter(c => c.status === 'Waiting on Internal Team');
}

/** Open cases that currently carry an escalation flag (used for "open escalations" counts). */
export function getEscalatedCases(cases: CustomerCase[]) {
  return getOpenCases(cases).filter(c => c.escalations.length > 0);
}

/** ALL cases (any status) with ≥1 escalation flag — the numerator for Escalation Rate. */
export function getEscalatedCasesAll(cases: CustomerCase[]) {
  return cases.filter(c => c.escalations.length > 0);
}

/** Total case population (any status) — the denominator for Escalation Rate. */
export function getTotalCaseCount(cases: CustomerCase[]): number {
  return cases.length;
}

/**
 * Escalation Rate (%) = escalated cases (any status) / total cases (any status) × 100.
 * Single definition shared by the KPI Center card, its tiles, and the Monthly Score.
 */
export function getEscalationRate(cases: CustomerCase[]): number {
  if (!cases.length) return 0;
  return Math.round((getEscalatedCasesAll(cases).length / cases.length) * 1000) / 10;
}

export function getCustomersNotUpdated(_cases: CustomerCase[], truckRolls: TruckRoll[]) {
  return truckRolls.filter(needsCustomerUpdateAfterTruckRoll);
}

export function getAvgDaysOpen(cases: CustomerCase[]): number {
  const open = getOpenCases(cases);
  if (!open.length) return 0;
  return Math.round((open.reduce((s, c) => s + daysOpen(c), 0) / open.length) * 10) / 10;
}

// Follow-up compliance: % of open cases whose nextFollowUp is not overdue
export function getFollowUpCompliance(cases: CustomerCase[]): number {
  const open = getOpenCases(cases);
  if (!open.length) return 100;
  const compliant = open.filter(c => !isOverdue(c)).length;
  return Math.round((compliant / open.length) * 1000) / 10;
}

// Cases with no update in 3+ days
export function getStaleUpdateCases(cases: CustomerCase[]) {
  return getOpenCases(cases).filter(hasNoRecentUpdate);
}

// ── Truck Roll KPIs ───────────────────────────────────────────────────────────

export function getTRScheduled(truckRolls: TruckRoll[]) {
  return truckRolls.filter(t => t.status === 'Scheduled');
}

export function getTRCompleted(truckRolls: TruckRoll[]) {
  return truckRolls.filter(t => t.status === 'Completed');
}

/** Records whose current status is "Revisit Required" */
export function getTRInRevisitStatus(truckRolls: TruckRoll[]) {
  return truckRolls.filter(t => t.status === 'Revisit Required');
}

/** Records where the revisitRequired boolean flag is true (identified as needing revisit) */
export function getTRRevisitFlagged(truckRolls: TruckRoll[]) {
  return truckRolls.filter(t => t.revisitRequired);
}

export function getTRCompletionRate(truckRolls: TruckRoll[]): number {
  if (!truckRolls.length) return 0;
  const completed = getTRCompleted(truckRolls).length;
  return Math.round((completed / truckRolls.length) * 1000) / 10;
}

// Revisit rate = records with revisitRequired flag / total TRs
export function getTRRevisitRate(truckRolls: TruckRoll[]): number {
  if (!truckRolls.length) return 0;
  const flagged = getTRRevisitFlagged(truckRolls).length;
  return Math.round((flagged / truckRolls.length) * 1000) / 10;
}

// GNR cases that could have been resolved remotely / total GNR TRs
export function getGNRRemoteResolutionRate(truckRolls: TruckRoll[]): number {
  const gnr = truckRolls.filter(t => t.issueType === 'Gateway Not Reporting');
  if (!gnr.length) return 0;
  const remote = gnr.filter(t => t.couldBeDoneRemotely === true).length;
  return Math.round((remote / gnr.length) * 1000) / 10;
}

// ── Monthly Score ─────────────────────────────────────────────────────────────

// Weighted scorecard (mirrors the weights shown in KPICenter)
// Components and weights:
//   Follow-up compliance    20%
//   TR completion rate      20%
//   GNR remote rate         15%
//   SLA adherence           20%  (no SLA breaches = 100)
//   Documentation accuracy  15%  (hardcoded — no doc audit field on cases)
//   Escalation rate          5%
//   Avg resolution speed    5%   (bonus if avg < 14d)

export interface MonthlyScore {
  score: number;
  grade: string;
  components: { label: string; weight: number; pct: number; weighted: number }[];
}

export function getMonthlyScore(cases: CustomerCase[], truckRolls: TruckRoll[]): MonthlyScore {
  const open = getOpenCases(cases);
  const slaAdherence = open.length
    ? Math.round(((open.length - getSLABreachedCases(cases).length) / open.length) * 100)
    : 100;
  const avgDays = getAvgDaysOpen(cases);
  const resolutionScore = avgDays <= 7 ? 100 : avgDays <= 14 ? 85 : avgDays <= 21 ? 65 : 40;
  // Escalation-Free Rate = 100 − Escalation Rate, using the SAME shared rate as the
  // KPI Center card (escalated cases ÷ total cases). Higher = better.
  const escalationFreeRate = Math.round((100 - getEscalationRate(cases)) * 10) / 10;

  const components = [
    { label: 'Follow-Up Compliance', weight: 20, pct: getFollowUpCompliance(cases) },
    { label: 'TR Completion Rate',   weight: 20, pct: getTRCompletionRate(truckRolls) },
    { label: 'GNR Remote Rate',      weight: 15, pct: getGNRRemoteResolutionRate(truckRolls) },
    { label: 'SLA Adherence',        weight: 20, pct: slaAdherence },
    { label: 'Doc Accuracy',         weight: 15, pct: 85 }, // illustrative — no audit field in data
    { label: 'Escalation-Free Rate', weight:  5, pct: escalationFreeRate },
    { label: 'Resolution Speed',     weight:  5, pct: resolutionScore },
  ].map(c => ({ ...c, weighted: Math.round(c.weight * c.pct) / 100 }));

  const score = Math.round(components.reduce((s, c) => s + c.weighted, 0));
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
  return { score, grade, components };
}

// ── Master KPI object ─────────────────────────────────────────────────────────

export interface AllKPIs {
  openCount: number;
  dueTodayCount: number;
  overdueCount: number;
  slaBreachedCount: number;
  highPriorityCount: number;
  criticalRiskCount: number;
  highRiskCount: number;
  waitingInternalCount: number;
  escalatedCount: number;
  escalatedAllCount: number;
  totalCaseCount: number;
  escalationRate: number;
  staleUpdateCount: number;
  avgDaysOpen: number;
  followUpCompliance: number;
  trTotal: number;
  trScheduledCount: number;
  trCompletedCount: number;
  trInRevisitStatusCount: number;
  trRevisitFlaggedCount: number;
  trCompletionRate: number;
  trRevisitRate: number;
  gnrRemoteRate: number;
  monthlyScore: MonthlyScore;
  customersNotUpdatedCount: number;
}

export function computeAllKPIs(cases: CustomerCase[], truckRolls: TruckRoll[]): AllKPIs {
  return {
    openCount:               getOpenCases(cases).length,
    dueTodayCount:           getDueTodayCases(cases).length,
    overdueCount:            getOverdueCases(cases).length,
    slaBreachedCount:        getSLABreachedCases(cases).length,
    highPriorityCount:       getHighPriorityCases(cases).length,
    criticalRiskCount:       getCriticalRiskCases(cases, truckRolls).length,
    highRiskCount:           getHighRiskCases(cases, truckRolls).length,
    waitingInternalCount:    getWaitingOnInternalCases(cases).length,
    escalatedCount:          getEscalatedCases(cases).length,
    escalatedAllCount:       getEscalatedCasesAll(cases).length,
    totalCaseCount:          getTotalCaseCount(cases),
    escalationRate:          getEscalationRate(cases),
    staleUpdateCount:        getStaleUpdateCases(cases).length,
    avgDaysOpen:             getAvgDaysOpen(cases),
    followUpCompliance:      getFollowUpCompliance(cases),
    trTotal:                 truckRolls.length,
    trScheduledCount:        getTRScheduled(truckRolls).length,
    trCompletedCount:        getTRCompleted(truckRolls).length,
    trInRevisitStatusCount:  getTRInRevisitStatus(truckRolls).length,
    trRevisitFlaggedCount:   getTRRevisitFlagged(truckRolls).length,
    trCompletionRate:        getTRCompletionRate(truckRolls),
    trRevisitRate:           getTRRevisitRate(truckRolls),
    gnrRemoteRate:           getGNRRemoteResolutionRate(truckRolls),
    monthlyScore:            getMonthlyScore(cases, truckRolls),
    customersNotUpdatedCount: getCustomersNotUpdated(cases, truckRolls).length,
  };
}
