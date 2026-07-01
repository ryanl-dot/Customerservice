import type { Role } from './roles';

// The authenticated identity surfaced to the client. NEVER includes password
// hashes, tokens, or secrets — only what the UI needs to render and route.
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface SessionInfo {
  authenticated: boolean;
  user?: AuthUser;
  /** ISO timestamp when the session expires; used by the client to detect expiry. */
  expiresAt?: string;
  /**
   * Set when the signed-in user holds a privileged role but has not completed MFA
   * enrollment. The session is NOT fully authenticated: the client must route to the
   * mandatory MFA setup screen, and the server blocks all protected endpoints except
   * MFA enrollment until this clears.
   */
  mfaEnrollmentRequired?: boolean;
}
