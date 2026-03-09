import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const wcdPanelPlugin = createPlugin({
  id: 'wcd-panel',
  routes: {
    root: rootRouteRef,
  },
});

export const WcdPanelPage = wcdPanelPlugin.provide(
  createRoutableExtension({
    name: 'WcdPanelPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.TerraformStatus),
    mountPoint: rootRouteRef,
  }),
);
