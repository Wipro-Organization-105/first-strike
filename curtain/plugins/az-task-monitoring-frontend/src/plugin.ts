import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const azTaskMonitoringFrontendPlugin = createPlugin({
  id: 'az-task-monitoring-frontend',
  routes: {
    root: rootRouteRef,
  },
});

export const AzTaskMonitoringFrontendPage = azTaskMonitoringFrontendPlugin.provide(
  createRoutableExtension({
    name: 'AzTaskMonitoringFrontendPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
