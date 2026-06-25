import { createDevApp } from '@backstage/dev-utils';
import { azTaskMonitoringFrontendPlugin, AzTaskMonitoringFrontendPage } from '../src/plugin';

createDevApp()
  .registerPlugin(azTaskMonitoringFrontendPlugin)
  .addPage({
    element: <AzTaskMonitoringFrontendPage />,
    title: 'Root Page',
    path: '/az-task-monitoring-frontend',
  })
  .render();
