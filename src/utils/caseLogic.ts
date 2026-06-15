import type { CustomerCase, TruckRoll } from '../data/sampleData';

export const TODAY = '2026-06-15';

// ─── Date helpers ────────────────────────────────────────────────────────────

export function daysBetween(from: string, to: string = TODAY): number {
  return Math.floor(
    (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000
  );
}

export function daysOpen(c: CustomerCase): number {
  if (c.status === 'Closed' || c.status === 'Resolved') {
    return daysBetween(c.dateOpened, c.lastUpdate);
  }
  return daysBetween(c.dateOpened);
}

export function daysSinceLastUpdate(c: CustomerCase): number {
  return daysBetween(c.lastUpdate);
}

// ─── Boolean flags ────────────────────────────────────────────────────────────

export function isOverdue(c: CustomerCase): boolean {
  return !!(
    c.nextFollowUp &&
    c.nextFollowUp < TODAY &&
    c.status !== 'Closed' &&
    c.status !== 'Resolved'
  );
}

export function isDueToday(c: CustomerCase): boolean {
  return (
    c.nextFollowUp === TODAY &&
    c.status !== 'Closed' &&
    c.status !== 'Resolved'
  );
}

export function hasNoRecentUpdate(c: CustomerCase): boolean {
  return (
    daysSinceLastUpdate(c) >= 3 &&
    c.status !== 'Closed' &&
    c.status !== 'Resolved'
  );
}

export function isTruckRollMissingOutcome(t: TruckRoll): boolean {
  const completedOrRevisit =
    t.status === 'Completed' ||
    t.status === 'Revisit Required' ||
    t.status === 'Closed';
  return completedOrRevisit && !t.outcome.trim();
}

export function isTruckRollPastDate(t: TruckRoll): boolean {
  return t.visitDate < TODAY && t.status === 'Scheduled';
}

export function needsCustomerUpdateAfterTruckRoll(t: TruckRoll): boolean {
  const postVisit =
    t.status === 'Completed' ||
    t.status === 'Revisit Required' ||
    t.status === 'Closed';
  return postVisit && !t.customerUpdated;
}

// ─── Risk Score ───────────────────────────────────────────────────────────────

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface RiskBreakdown {
  score: number;
  level: RiskLevel;
  reasons: string[];
}

const ESCALATION_WEIGHTS: Record<string, number> = {
  'Legal Threat': 30,
  'Attorney Mentioned': 25,
  'AG Complaint': 25,
  'PSC Complaint': 20,
  'Media / NBC Responds': 20,
  'BBB Complaint': 15,
  'NYSERDA Complaint': 15,
  'Refund Request': 10,
};

export function computeRisk(c: CustomerCase, truckRoll?: TruckRoll): RiskBreakdown {
  let score = 0;
  const reasons: string[] = [];

  // Priority
  const priorityScore: Record<string, number> = {
    Urgent: 30,
    High: 20,
    Medium: 10,
    Low: 0,
  };
  const ps = priorityScore[c.priority] ?? 0;
  if (ps > 0) {
    score += ps;
    reasons.push(`Priority: ${c.priority} (+${ps})`);
  }

  // Days open
  const open = daysOpen(c);
  if (open >= 30) {
    score += 20;
    reasons.push(`Open ${open} days (+20)`);
  } else if (open >= 14) {
    score += 12;
    reasons.push(`Open ${open} days (+12)`);
  } else if (open >= 7) {
    score += 6;
    reasons.push(`Open ${open} days (+6)`);
  }

  // Overdue follow-up
  if (isOverdue(c)) {
    const overdueDays = daysBetween(c.nextFollowUp);
    const pts = overdueDays >= 7 ? 20 : overdueDays >= 3 ? 12 : 6;
    score += pts;
    reasons.push(`Follow-up overdue ${overdueDays}d (+${pts})`);
  }

  // No update in 3+ days
  const sinceUpdate = daysSinceLastUpdate(c);
  if (sinceUpdate >= 7) {
    score += 15;
    reasons.push(`No update in ${sinceUpdate} days (+15)`);
  } else if (sinceUpdate >= 3) {
    score += 8;
    reasons.push(`No update in ${sinceUpdate} days (+8)`);
  }

  // Escalations
  for (const e of c.escalations) {
    const pts = ESCALATION_WEIGHTS[e] ?? 10;
    score += pts;
    reasons.push(`Escalation: ${e} (+${pts})`);
  }

  // Complaint case type
  if (c.caseType === 'Complaint') {
    score += 10;
    reasons.push('Case type: Complaint (+10)');
  }
  if (c.caseType === 'Collections') {
    score += 10;
    reasons.push('Case type: Collections (+10)');
  }
  if (c.caseType === 'Roof Leak') {
    score += 8;
    reasons.push('Case type: Roof Leak (+8)');
  }

  // Truck roll problems
  if (truckRoll) {
    if (isTruckRollMissingOutcome(truckRoll)) {
      score += 12;
      reasons.push('Truck roll outcome missing (+12)');
    }
    if (needsCustomerUpdateAfterTruckRoll(truckRoll)) {
      score += 10;
      reasons.push('Customer not updated after truck roll (+10)');
    }
    if (truckRoll.revisitRequired) {
      score += 8;
      reasons.push('Revisit required (+8)');
    }
    if (isTruckRollPastDate(truckRoll)) {
      score += 15;
      reasons.push('Truck roll past scheduled date (+15)');
    }
  }

  // Waiting long on internal
  if (
    c.status === 'Waiting on Internal Team' &&
    sinceUpdate >= 5
  ) {
    score += 10;
    reasons.push(`Internal team unresponsive ${sinceUpdate}d (+10)`);
  }

  // Level thresholds
  let level: RiskLevel;
  if (score >= 70) level = 'Critical';
  else if (score >= 40) level = 'High';
  else if (score >= 20) level = 'Medium';
  else level = 'Low';

  return { score, level, reasons };
}

// ─── Daily CS Summary ─────────────────────────────────────────────────────────

export interface DailySummary {
  totalOpen: number;
  overdueCases: number;
  dueToday: number;
  truckRollsToday: number;
  missingTruckRollOutcomes: number;
  customersNeedingUpdate: number;
  escalationsOpen: number;
  criticalRisk: number;
  highRisk: number;
}

export function buildDailySummary(
  allCases: CustomerCase[],
  allTruckRolls: TruckRoll[]
): DailySummary {
  const activeCases = allCases.filter(
    c => c.status !== 'Closed' && c.status !== 'Resolved'
  );

  return {
    totalOpen: activeCases.length,
    overdueCases: activeCases.filter(isOverdue).length,
    dueToday: activeCases.filter(isDueToday).length,
    truckRollsToday: allTruckRolls.filter(t => t.visitDate === TODAY).length,
    missingTruckRollOutcomes: allTruckRolls.filter(isTruckRollMissingOutcome).length,
    customersNeedingUpdate: allTruckRolls.filter(needsCustomerUpdateAfterTruckRoll).length,
    escalationsOpen: activeCases.filter(c => c.escalations.length > 0).length,
    criticalRisk: activeCases.filter(c => {
      const tr = allTruckRolls.find(t => t.id === c.truckRollId);
      return computeRisk(c, tr).level === 'Critical';
    }).length,
    highRisk: activeCases.filter(c => {
      const tr = allTruckRolls.find(t => t.id === c.truckRollId);
      return computeRisk(c, tr).level === 'High';
    }).length,
  };
}

// ─── Slack preview builder ────────────────────────────────────────────────────

const TYPE_EMOJI: Record<string, string> = {
  overdue: '⚠️',
  truck_roll_scheduled: '🚚',
  truck_roll_completed: '✅',
  truck_roll_missing_outcome: '📋',
  customer_not_updated: '👤',
  revisit_required: '🔄',
  internal_overdue: '🏢',
  escalation_detected: '🚨',
};

const CHANNEL_MAP: Record<string, string> = {
  overdue: '#cs-followups',
  truck_roll_scheduled: '#cs-truck-rolls',
  truck_roll_completed: '#cs-truck-rolls',
  truck_roll_missing_outcome: '#cs-truck-rolls',
  customer_not_updated: '#cs-truck-rolls',
  revisit_required: '#cs-truck-rolls',
  internal_overdue: '#cs-internal',
  escalation_detected: '#cs-escalations',
};

export interface SlackPreview {
  channel: string;
  emoji: string;
  header: string;
  body: string;
  footer: string;
}

export function buildSlackPreview(
  type: string,
  message: string,
  caseId: string,
  customerName: string,
  timestamp: string
): SlackPreview {
  const emoji = TYPE_EMOJI[type] ?? '🔔';
  const channel = CHANNEL_MAP[type] ?? '#cs-general';
  const date = new Date(timestamp).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  const headerMap: Record<string, string> = {
    overdue: 'Follow-Up Overdue',
    truck_roll_scheduled: 'Truck Roll Scheduled',
    truck_roll_completed: 'Truck Roll Completed',
    truck_roll_missing_outcome: 'Truck Roll Missing Outcome',
    customer_not_updated: 'Customer Not Updated',
    revisit_required: 'Revisit Required',
    internal_overdue: 'Internal Team Overdue',
    escalation_detected: 'Escalation Detected',
  };

  return {
    channel,
    emoji,
    header: headerMap[type] ?? 'CS Alert',
    body: message,
    footer: `${caseId} · ${customerName} · ${date} · SolarCS Command Center`,
  };
}
