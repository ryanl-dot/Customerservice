import type { Role } from './roles';

// ── Pages / routes ─────────────────────────────────────────────────────────────
// Every protected page in the app has a stable key. Route guards (client) and the
// API authorization layer (server) both resolve access through ROLE_PAGES below.

export const PAGES = [
  'dashboard',
  'cases',
  'follow-up',
  'truck-roll',
  'internal-waiting',
  'escalation',
  'notifications',
  'templates',
  'kpi',
  'executive',
  'testing',
  'admin-users',
] as const;

export type PageKey = (typeof PAGES)[number];

// ── Sensitive data fields (data minimization) ──────────────────────────────────
// Field-level visibility used by the API to strip fields the role should not see,
// and by the UI to hide them. Server is the enforcement boundary; client is cosmetic.

export const SENSITIVE_FIELDS = [
  'customerPhone',
  'customerEmail',
  'customerAddress',
  'paymentDetails',
  'accessInstructions',
  'internalNotes',
  'technicianNotes',
  'trackingNumber',
  'reimbursement',
] as const;

export type SensitiveField = (typeof SENSITIVE_FIELDS)[number];

// ── Page access matrix ──────────────────────────────────────────────────────────
// Listed pages are accessible to that role. Administrator implicitly gets everything.

const CS_PAGES: PageKey[] = [
  'dashboard', 'cases', 'follow-up', 'truck-roll',
  'internal-waiting', 'escalation', 'notifications', 'templates',
];

const ROLE_PAGES: Record<Role, PageKey[]> = {
  customer_service: CS_PAGES,
  operations: ['cases', 'truck-roll', 'notifications'],
  compliance: ['cases', 'escalation', 'truck-roll', 'notifications'],
  management: ['dashboard', 'cases', 'truck-roll', 'escalation', 'kpi', 'notifications'],
  executive: ['executive', 'kpi', 'dashboard'],
  administrator: [...PAGES], // everything, including admin-users + testing
  developer: ['testing', 'dashboard', 'cases', 'truck-roll'],
};

// Roles whose truck-roll access is read-only (no write actions).
const READ_ONLY_TRUCK_ROLL: Role[] = ['compliance', 'executive'];

// Default landing page per role (executive lands on the Executive Dashboard).
const ROLE_LANDING: Record<Role, PageKey> = {
  customer_service: 'dashboard',
  operations: 'cases',
  compliance: 'cases',
  management: 'dashboard',
  executive: 'executive',
  administrator: 'dashboard',
  developer: 'testing',
};

// ── Field visibility matrix ──────────────────────────────────────────────────────
// Which sensitive fields each role may receive. Compliance/Management/Exec see
// less PII; Operations needs logistics fields; CS needs contact info.

const ROLE_FIELDS: Record<Role, SensitiveField[]> = {
  customer_service: ['customerPhone', 'customerEmail', 'customerAddress', 'accessInstructions', 'internalNotes'],
  operations: ['customerPhone', 'customerAddress', 'accessInstructions', 'technicianNotes', 'trackingNumber'],
  compliance: ['internalNotes', 'technicianNotes', 'reimbursement'],
  management: ['internalNotes', 'reimbursement'],
  executive: [],
  administrator: [...SENSITIVE_FIELDS],
  developer: [...SENSITIVE_FIELDS],
};

// ── Public API ───────────────────────────────────────────────────────────────────

export function canAccessPage(role: Role, page: PageKey): boolean {
  if (role === 'administrator') return true;
  return ROLE_PAGES[role].includes(page);
}

export function accessiblePages(role: Role): PageKey[] {
  return role === 'administrator' ? [...PAGES] : [...ROLE_PAGES[role]];
}

export function defaultLandingPage(role: Role): PageKey {
  return ROLE_LANDING[role];
}

export function canSeeField(role: Role, field: SensitiveField): boolean {
  if (role === 'administrator' || role === 'developer') return true;
  return ROLE_FIELDS[role].includes(field);
}

export function visibleFields(role: Role): SensitiveField[] {
  return role === 'administrator' || role === 'developer'
    ? [...SENSITIVE_FIELDS]
    : [...ROLE_FIELDS[role]];
}

export function isTruckRollReadOnly(role: Role): boolean {
  return READ_ONLY_TRUCK_ROLL.includes(role);
}

// Map a URL path to a PageKey for route-guard resolution.
export function pageKeyForPath(pathname: string): PageKey | null {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/') return 'dashboard';
  const seg = p.split('/')[1];
  const map: Record<string, PageKey> = {
    cases: 'cases',
    'follow-up': 'follow-up',
    'truck-roll': 'truck-roll',
    'internal-waiting': 'internal-waiting',
    escalation: 'escalation',
    notifications: 'notifications',
    templates: 'templates',
    kpi: 'kpi',
    executive: 'executive',
    testing: 'testing',
    'admin-users': 'admin-users',
  };
  return map[seg] ?? null;
}
