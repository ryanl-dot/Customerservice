import { describe, it, expect } from 'vitest';
import { ROLES } from '../shared/auth/roles';
import {
  canAccessPage, accessiblePages, defaultLandingPage,
  canSeeField, isTruckRollReadOnly, pageKeyForPath, PAGES,
} from '../shared/auth/permissions';

describe('RBAC permission model', () => {
  it('administrator can access every page', () => {
    for (const page of PAGES) expect(canAccessPage('administrator', page)).toBe(true);
  });

  it('customer_service cannot reach admin/exec/testing pages', () => {
    expect(canAccessPage('customer_service', 'kpi')).toBe(false);
    expect(canAccessPage('customer_service', 'executive')).toBe(false);
    expect(canAccessPage('customer_service', 'testing')).toBe(false);
    expect(canAccessPage('customer_service', 'dashboard')).toBe(true);
  });

  it('executive lands on the Executive Dashboard and has no Testing Center', () => {
    expect(defaultLandingPage('executive')).toBe('executive');
    expect(canAccessPage('executive', 'testing')).toBe(false);
  });

  it('only developer and administrator reach the Testing Center', () => {
    for (const role of ROLES) {
      const allowed = role === 'developer' || role === 'administrator';
      expect(canAccessPage(role, 'testing')).toBe(allowed);
    }
  });

  it('compliance and executive have read-only truck-roll access', () => {
    expect(isTruckRollReadOnly('compliance')).toBe(true);
    expect(isTruckRollReadOnly('executive')).toBe(true);
    expect(isTruckRollReadOnly('operations')).toBe(false);
  });

  it('data minimization: executive sees no sensitive fields; CS sees contact info', () => {
    expect(canSeeField('executive', 'customerPhone')).toBe(false);
    expect(canSeeField('executive', 'reimbursement')).toBe(false);
    expect(canSeeField('customer_service', 'customerPhone')).toBe(true);
    expect(canSeeField('operations', 'trackingNumber')).toBe(true);
    expect(canSeeField('customer_service', 'trackingNumber')).toBe(false);
  });

  it('every role has at least one accessible page and a valid landing page', () => {
    for (const role of ROLES) {
      const pages = accessiblePages(role);
      expect(pages.length).toBeGreaterThan(0);
      expect(pages).toContain(defaultLandingPage(role));
    }
  });

  it('pageKeyForPath maps routes correctly', () => {
    expect(pageKeyForPath('/')).toBe('dashboard');
    expect(pageKeyForPath('/truck-roll')).toBe('truck-roll');
    expect(pageKeyForPath('/kpi')).toBe('kpi');
    expect(pageKeyForPath('/cases/123')).toBe('cases');
    expect(pageKeyForPath('/nonexistent')).toBeNull();
  });
});
