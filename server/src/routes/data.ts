import { Router } from 'express';
import type { ListResponse } from '../../../shared/api/types';
import type { CustomerCase } from '../../../src/data/sampleData';
import type { TruckRollRecord } from '../../../src/data/truckRollData';
import { getCases, getTruckRolls, getKpis } from '../lib/dataSource';
import { getDataMode } from '../lib/dataMode';
import { minimizeCase, minimizeTruckRoll } from '../lib/minimize';
import { requireAuth, requirePage, requireMfaSatisfied } from '../middleware/auth';
import { reqAudit } from '../lib/audit';
import { sendError } from '../lib/errors';

export const dataRouter = Router();

dataRouter.use(requireAuth);
// MFA-pending (privileged, un-enrolled) sessions cannot reach any data endpoint.
dataRouter.use(requireMfaSatisfied);

// Cases — role must have case access; sensitive fields stripped per role.
dataRouter.get('/cases', requirePage('cases'), (req, res) => {
  const role = req.auth!.role;
  const { empty, data } = getCases();
  reqAudit(req, 'customer_viewed', { actorId: req.auth!.userId, targetType: 'cases' });
  const body: ListResponse<CustomerCase> = {
    mode: getDataMode(), empty, data: data.map(c => minimizeCase(c, role)),
  };
  res.json(body);
});

// Truck rolls — role must have truck-roll access; sensitive fields stripped per role.
dataRouter.get('/truck-rolls', requirePage('truck-roll'), (req, res) => {
  const role = req.auth!.role;
  const { empty, data } = getTruckRolls();
  const body: ListResponse<TruckRollRecord> = {
    mode: getDataMode(), empty, data: data.map(t => minimizeTruckRoll(t, role)),
  };
  res.json(body);
});

// KPIs — aggregate numbers (no row-level PII). Dashboard-capable roles only.
dataRouter.get('/kpis', requirePage('dashboard'), (_req, res) => {
  const { empty, data } = getKpis();
  if (empty || !data) {
    res.json({ mode: getDataMode(), empty: true, data: null });
    return;
  }
  res.json({ mode: getDataMode(), empty: false, data });
});

// Explicit 404 for unknown data routes.
dataRouter.use((_req, res) => sendError(res, 'not_found'));
