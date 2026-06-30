import type { Role } from '../../../shared/auth/roles';
import { canSeeField } from '../../../shared/auth/permissions';
import type { CustomerCase } from '../../../src/data/sampleData';
import type { TruckRollRecord } from '../../../src/data/truckRollData';

// Data minimization — the server strips fields a role is not permitted to see BEFORE
// the response leaves the boundary. The browser therefore never receives PII or
// sensitive logistics/financial fields outside the role's need-to-know.

const REDACTED = '';

export function minimizeCase(c: CustomerCase, role: Role): CustomerCase {
  const out: CustomerCase = { ...c };
  if (!canSeeField(role, 'customerPhone')) out.customerPhone = REDACTED;
  if (!canSeeField(role, 'customerEmail')) out.customerEmail = REDACTED;
  if (!canSeeField(role, 'customerAddress')) out.customerAddress = REDACTED;
  if (!canSeeField(role, 'internalNotes')) {
    out.summary = REDACTED;
    out.rootCause = REDACTED;
    out.nextAction = REDACTED;
    out.timeline = [];
  }
  return out;
}

export function minimizeTruckRoll(t: TruckRollRecord, role: Role): TruckRollRecord {
  const out: TruckRollRecord = { ...t };
  if (!canSeeField(role, 'customerPhone')) out.customerPhone = REDACTED;
  if (!canSeeField(role, 'customerAddress')) out.customerAddress = REDACTED;
  if (!canSeeField(role, 'accessInstructions')) out.accessInstructions = REDACTED;
  if (!canSeeField(role, 'technicianNotes')) {
    out.technicianNotes = REDACTED;
    out.visits = out.visits.map(v => ({ ...v, technicalNotes: REDACTED, outcomeNotes: REDACTED }));
  }
  const hideTracking = !canSeeField(role, 'trackingNumber');
  const hideReimb = !canSeeField(role, 'reimbursement');
  if (hideTracking || hideReimb) {
    out.rmas = out.rmas.map(r => ({
      ...r,
      trackingNumber: hideTracking ? REDACTED : r.trackingNumber,
      defectiveRMAReturnTracking: hideTracking ? REDACTED : r.defectiveRMAReturnTracking,
      projectedReimbursementAmount: hideReimb ? 0 : r.projectedReimbursementAmount,
      totalReimbursementReceived: hideReimb ? 0 : r.totalReimbursementReceived,
    }));
  }
  return out;
}
