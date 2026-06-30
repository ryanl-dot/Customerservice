// Centralized role definitions — shared by the frontend route guards AND the
// server-side authorization middleware. This is the single source of truth for
// "who can do what". Do not add ad-hoc role checks elsewhere.

export const ROLES = [
  'customer_service',
  'operations',
  'compliance',
  'management',
  'executive',
  'administrator',
  'developer',
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  customer_service: 'Customer Service',
  operations: 'Operations',
  compliance: 'Compliance',
  management: 'Management',
  executive: 'Executive',
  administrator: 'Administrator',
  developer: 'Developer / Tester',
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}
