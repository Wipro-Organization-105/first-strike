// plugins/wcd-backend/src/plugin.ts
import { coreServices, createBackendPlugin } from '@backstage/backend-plugin-api';
import { createRouter } from './router'; // <-- from src/router.ts

export const wcdBackendPlugin = createBackendPlugin({
  pluginId: 'wcd', // This makes your routes available under /api/wcd/*
  register(env) {
    env.registerInit({
      deps: {
        http: coreServices.httpRouter,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
      },
      async init({ http, logger, config }) {
        http.use(await createRouter({ logger, config }));

        // (Optional while testing) allow unauthenticated access to this route:
        // http.addAuthPolicy({ path: '/telemetry', allow: 'unauthenticated' });
      },
    });
  },
});
