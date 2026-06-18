import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import { LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import express from 'express';
import Router from 'express-promise-router';
// You might need to install node-fetch if not available: yarn --cwd plugins/my-data-backend add node-fetch
import fetch from 'node-fetch'; 

export interface RouterOptions {
  logger: LoggerService;
  config: Config;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config } = options;
  const router = Router();
  router.use(express.json());

  router.get('/external-data', async (_, response) => {
    // 1. Get the API URL and Token from app-config.yaml (Secure!)
    const apiUrl = config.getString('myData.baseUrl');
    const apiToken = config.getString('myData.apiToken');

    try {
      // 2. Call the External REST API
      const externalResponse = await fetch(`${apiUrl}/data`, {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!externalResponse.ok) {
        throw new Error(`API Error: ${externalResponse.statusText}`);
      }

      const data = await externalResponse.json();

      // 3. Return the data to your Frontend
      response.json(data);
    } catch (error) {
      logger.error('Failed to fetch data', error);
      response.status(500).json({ error: 'Failed to fetch data' });
    }
  });

  return router;
}
