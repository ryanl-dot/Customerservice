import { describe, it, expect } from 'vitest';
import type { CustomerCase } from '../src/data/sampleData';
import {
  getOpenCases, getDueTodayCases, getOverdueCases, getSLABreachedCases,
  getFollowUpCompliance, getEscalationRate, getEscalatedCasesAll,
  getMonthlyScore, computeAllKPIs,
} from '../src/utils/kpiCalculations';
import { TODAY } from '../src/utils/caseLogic';

// ── Factory ─────────────────────────────────────────────────────────────────
let n = 0;
function mkCase(over: Partial<CustomerCase> = {}): CustomerCase {
  n += 1;
  return {
    id: `C-${n}`,
    customerName: 'Test Customer',
    customerEmail: 't@example.com',
    customerPhone: '000',
    customerAddress: 'addr',
    systemSize: '8kW',
    installDate: '2024-01-01',
    caseType: 'Billing',
    priority: 'Medium',
    status: 'In Progress',
    owner: 'Sarah Mitchell',
    dateOpened: '2026-06-01',
    lastUpdate: TODAY,
    nextFollowUp: '2026-06-20',
    waitingOn: 'None',
    hubspotLink: '#',
    summary: '', rootCause: '', nextAction: '',
    escalations: [],
    timeline: [],
    ...over,
  };
}

describe('Case KPIs', () => {
  it('open cases exclude Closed and Resolved', () => {
    const cases = [
      mkCase({ status: 'In Progress' }),
      mkCase({ status: 'New' }),
      mkCase({ status: 'Closed' }),
      mkCase({ status: 'Resolved' }),
    ];
    expect(getOpenCases(cases)).toHaveLength(2);
  });

  it('due today counts only open cases whose nextFollowUp == today', () => {
    const cases = [
      mkCase({ nextFollowUp: TODAY }),
      mkCase({ nextFollowUp: TODAY, status: 'Closed' }), // closed → excluded
      mkCase({ nextFollowUp: '2026-06-20' }),
    ];
    expect(getDueTodayCases(cases)).toHaveLength(1);
  });

  it('overdue counts open cases with nextFollowUp < today', () => {
    const cases = [
      mkCase({ nextFollowUp: '2026-06-01' }),
      mkCase({ nextFollowUp: '2026-06-14' }),
      mkCase({ nextFollowUp: '2026-06-20' }),
      mkCase({ nextFollowUp: '2026-06-01', status: 'Resolved' }), // excluded
    ];
    expect(getOverdueCases(cases)).toHaveLength(2);
  });

  it('SLA breached = open cases older than 14 days', () => {
    const cases = [
      mkCase({ dateOpened: '2026-05-01' }), // 45d
      mkCase({ dateOpened: '2026-06-10' }), // 5d
      mkCase({ dateOpened: '2026-05-01', status: 'Closed', lastUpdate: '2026-05-10' }), // closed → excluded
    ];
    expect(getSLABreachedCases(cases)).toHaveLength(1);
  });

  it('follow-up compliance = open not-overdue / open', () => {
    const cases = [
      mkCase({ nextFollowUp: '2026-06-20' }),       // compliant
      mkCase({ nextFollowUp: '2026-06-20' }),       // compliant
      mkCase({ nextFollowUp: '2026-06-01' }),       // overdue
      mkCase({ nextFollowUp: '2026-06-01', status: 'Closed', lastUpdate: '2026-06-02' }),
    ];
    expect(getFollowUpCompliance(cases)).toBe(66.7);
  });
});

describe('Escalation Rate (Phase 1 fix — shared definition)', () => {
  it('= escalated cases (any status) / total cases (any status)', () => {
    const cases = [
      mkCase({ escalations: ['BBB Complaint'] }),
      mkCase({ escalations: ['Legal Threat'], status: 'Closed', lastUpdate: '2026-06-02' }), // closed but still counts
      mkCase({ escalations: [] }),
      mkCase({ escalations: [] }),
    ];
    expect(getEscalatedCasesAll(cases)).toHaveLength(2);
    expect(getEscalationRate(cases)).toBe(50); // 2 / 4
  });
});

describe('Monthly Score', () => {
  it('returns a 0–100 score, a grade, and components that sum to the score', () => {
    const cases = [mkCase(), mkCase({ status: 'New' })];
    const ms = getMonthlyScore(cases, []);
    expect(ms.score).toBeGreaterThanOrEqual(0);
    expect(ms.score).toBeLessThanOrEqual(100);
    expect('ABCDF').toContain(ms.grade);
    const summed = Math.round(ms.components.reduce((s, c) => s + c.weighted, 0));
    expect(ms.score).toBe(summed);
    // weights total 100
    expect(ms.components.reduce((s, c) => s + c.weight, 0)).toBe(100);
  });

  it('Escalation-Free component = 100 − Escalation Rate', () => {
    const cases = [mkCase({ escalations: ['BBB Complaint'] }), mkCase(), mkCase(), mkCase()]; // rate 25
    const ms = getMonthlyScore(cases, []);
    const esc = ms.components.find(c => c.label === 'Escalation-Free Rate')!;
    expect(esc.pct).toBe(75);
  });
});

describe('Edge cases', () => {
  it('empty data does not throw and yields safe zeros', () => {
    const k = computeAllKPIs([], [], []);
    expect(k.openCount).toBe(0);
    expect(k.escalationRate).toBe(0);
    expect(k.followUpCompliance).toBe(100); // vacuously compliant
    expect(k.trCompletionRate).toBe(0);
  });

  it('all-closed dataset yields zero open and 100% compliance', () => {
    const cases = [
      mkCase({ status: 'Closed', lastUpdate: '2026-06-02' }),
      mkCase({ status: 'Resolved', lastUpdate: '2026-06-02' }),
    ];
    expect(getOpenCases(cases)).toHaveLength(0);
    expect(getFollowUpCompliance(cases)).toBe(100);
  });

  it('unknown status is treated as open (not Closed/Resolved)', () => {
    const cases = [mkCase({ status: 'Truck Roll Scheduled' })];
    expect(getOpenCases(cases)).toHaveLength(1);
  });

  it('zero denominator escalation rate is 0, not NaN', () => {
    expect(getEscalationRate([])).toBe(0);
  });
});
