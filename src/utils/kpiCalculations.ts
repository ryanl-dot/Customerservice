import type { CustomerCase, TruckRoll } from '../data/sampleData';
import {
  daysOpen, isOverdue, isDueToday, hasNoRecentUpdate, computeRisk,
  needsCustomerUpdateAfterTruckRoll,
} from './caseLogic';

// Single source of truth for all shared KPI calculations.
// Every dashboard page imports from here — no page maintains its own formulas.

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

export function getEscalatedCases(cases: CustomerCase[]) {
  return getOpenCases(cases).filter(c => c.escalations.length > 0);
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
  const escalationPct = open.length
    ? Math.round(((open.length - getEscalatedCases(cases).length) / open.length) * 100)
    : 100;

  const components = [
    { label: 'Follow-Up Compliance', weight: 20, pct: getFollowUpCompliance(cases) },
    { label: 'TR Completion Rate',   weight: 20, pct: getTRCompletionRate(truckRolls) },
    { label: 'GNR Remote Rate',      weight: 15, pct: getGNRRemoteResolutionRate(truckRolls) },
    { label: 'SLA Adherence',        weight: 20, pct: slaAdherence },
    { label: 'Doc Accuracy',         weight: 15, pct: 85 }, // no audit field — use KPI constant
    { label: 'Escalation Rate',      weight:  5, pct: escalationPct },
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
