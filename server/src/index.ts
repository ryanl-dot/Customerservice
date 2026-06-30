import { createApp } from './app';
import { getDataMode } from './lib/dataMode';

const PORT = Number(process.env.PORT ?? 8787);
const app = createApp();

app.listen(PORT, () => {
  console.log(`[server] SolarCS API listening on :${PORT} (DATA_MODE=${getDataMode()})`);
});
