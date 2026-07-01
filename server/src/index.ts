import { createApp } from './app';
import { assertEnvOrExit } from './lib/env';
import { appMode, dataMode, userStore } from './lib/config';
import { warnIfMfaNotEnforced } from './lib/mfa';

// Fail-closed: refuse to boot on unsafe production configuration.
assertEnvOrExit();
// Clear notice while privileged-role MFA enforcement is incomplete.
warnIfMfaNotEnforced();

const PORT = Number(process.env.PORT ?? 8787);
const app = createApp();

app.listen(PORT, () => {
  console.log(`[server] SolarCS API on :${PORT} (APP_MODE=${appMode()}, DATA_MODE=${dataMode()}, USER_STORE=${userStore()})`);
});
