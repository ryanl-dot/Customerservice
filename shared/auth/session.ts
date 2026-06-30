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
}
