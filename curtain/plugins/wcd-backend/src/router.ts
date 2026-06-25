// plugins/wcd-backend/src/router.ts
import { Router } from 'express';
//import { LoggerService, Config } from '@backstage/backend-plugin-api';
import { LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';

/**
 * Creates and returns the Express router for the wcd backend plugin.
 * It fetches vehicle telemetry JSON from an external service and returns it.
 */
export async function createRouter(options: { logger: LoggerService; config: Config }) {
  const { logger, config } = options;
  const router = Router();

  // Read external URL from config with fallback
  const baseUrl =
    config.getOptionalString('wcd.externalBaseUrl') ??
    'http://52.42.144.82:1500';

  // GET /api/wcd/telemetry  -> calls  {baseUrl}/api/data
  router.get('/telemetry', async (_req, res) => {
    try {
      const resp = await fetch(`${baseUrl}/api/data`);
      if (!resp.ok) {
        logger.warn(`Upstream returned HTTP ${resp.status}`);
        return res.status(502).json({ error: `Upstream error ${resp.status}` });
      }
      const json = await resp.json();
      return res.json(json);
    } catch (e: any) {
      logger.error(`Failed to fetch telemetry: ${String(e)}`);
      return res.status(500).json({ error: 'Failed to fetch telemetry' });
    }
  });

  return router;
}
