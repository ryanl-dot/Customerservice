// Shared API contract — used by the server (to produce) and the client (to handle).

export type DataMode = 'mock' | 'test' | 'production';

export type ApiErrorCode =
  | 'unauthenticated'      // no/invalid session
  | 'mfa_required'         // password OK, but a TOTP second factor is needed/invalid
  | 'session_expired'      // session existed but expired
  | 'unauthorized'         // authenticated but role lacks access
  | 'invalid_request'      // failed input validation
  | 'not_found'
  | 'rate_limited'
  | 'upstream_unavailable' // HubSpot/Enphase/etc. not reachable
  | 'server_error';

export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string };
}

export interface ListResponse<T> {
  mode: DataMode;
  /** true when production mode is active but no upstream data source is connected. */
  empty: boolean;
  data: T[];
}
