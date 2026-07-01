import { Router } from 'express';
import { requireAuth, requireMfaSatisfied, requireRole } from '../middleware/auth';
import { disableMfa, findById } from '../db/repositories/users';
import { revokeAllForUser } from '../lib/sessions';
import { reqAudit } from '../lib/audit';
import { sendError } from '../lib/errors';

// Administrator-only endpoints. Admins must themselves have satisfied MFA to reach
// these (requireMfaSatisfied), so MFA recovery cannot be used to bypass MFA.
export const adminRouter = Router();

adminRouter.use(requireAuth, requireMfaSatisfied, requireRole('administrator'));

// Administrator-controlled MFA recovery: disables a user's MFA (clearing the secret),
// which forces mandatory re-enrollment on their next login, and revokes their
// sessions. This is the ONLY supported MFA reset path — there are no bypass codes.
adminRouter.post('/users/:id/reset-mfa', async (req, res) => {
  const id = String(req.params.id);
  const target = await findById(id);
  if (!target) { sendError(res, 'not_found', 'User not found.'); return; }
  await disableMfa(id);
  await revokeAllForUser(id);
  reqAudit(req, 'config_change', { actorId: req.auth!.userId, targetType: 'mfa_recovery', targetId: id, result: 'success' });
  res.json({ ok: true });
});
