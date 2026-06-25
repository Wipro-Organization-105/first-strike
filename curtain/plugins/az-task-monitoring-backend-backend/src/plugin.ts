import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
//import { todoListServiceRef } from './services/TodoListService';
//import fs from 'fs/promises';
//import path from 'path';


//const DATA_DIR = process.env.WECOLLAB_DATA_DIR || '/home/ec2-user/BS-Wipro/wecollab/azure/task/data';

/**
 * azTaskMonitoringBackendPlugin backend plugin
 *
 * @public
 */


/*async function readJson(fileName: string) {
  const filePath = path.join(DATA_DIR, fileName);
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}*/

export const azTaskMonitoringBackendPlugin = createBackendPlugin({
  pluginId: 'az-task-monitoring-backend',
  register(env) {
    env.registerInit({
      deps: {
        //httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
	logger: coreServices.logger,
	config: coreServices.rootConfig,
        //todoList: todoListServiceRef,
      },
      async init({ httpRouter, logger, config }) {
	logger.info('Initialiing az-task-monitoring-backend');

	/*const router = Router();

	router.get('/metadata', async (_req, res) => {
          res.json(await readJson('metadata.json'));
        });*/

        const router = await createRouter();
	httpRouter.addAuthPolicy({ path: '/metadata', allow: 'unauthenticated' });
	httpRouter.addAuthPolicy({ path: '/work-items', allow: 'unauthenticated' });
        httpRouter.addAuthPolicy({ path: '/summary', allow: 'unauthenticated' });

        httpRouter.use(router);

	logger.info('Task Monitoring routes registered');
      },
    });
  },
});
